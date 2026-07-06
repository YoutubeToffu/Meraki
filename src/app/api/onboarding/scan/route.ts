import { NextResponse } from 'next/server'
import { z } from 'zod'
import OpenAI from 'openai'
import { getRequiredSession, handleAuthError } from '@/lib/auth-helpers'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const scanSchema = z.object({
  url: z
    .string()
    .url('Must be a valid URL')
    .refine(
      (u) => u.startsWith('http://') || u.startsWith('https://'),
      'Only http and https URLs are allowed'
    ),
})

// ── SSRF guard ──────────────────────────────────────────────────────────────
// Block requests to private/loopback addresses to prevent server-side
// request forgery attacks.
function isPrivateOrLoopback(hostname: string): boolean {
  // Localhost variants
  if (hostname === 'localhost' || hostname === '::1') return true

  // IPv4 private ranges: 10.x, 172.16-31.x, 192.168.x, 127.x
  const ipv4 = hostname.match(
    /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/
  )
  if (ipv4) {
    const [, a, b] = ipv4.map(Number)
    if (a === 127) return true
    if (a === 10) return true
    if (a === 172 && b >= 16 && b <= 31) return true
    if (a === 192 && b === 168) return true
    if (a === 169 && b === 254) return true // link-local
    if (a === 0) return true
  }

  // metadata service IPs (cloud providers)
  if (hostname === '169.254.169.254') return true
  if (hostname === 'metadata.google.internal') return true

  return false
}

// ── HTML → plain text ────────────────────────────────────────────────────────
function htmlToText(html: string): string {
  return html
    // Remove script/style/noscript blocks entirely
    .replace(/<(script|style|noscript|iframe|svg|canvas)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    // Remove all remaining HTML tags
    .replace(/<[^>]+>/g, ' ')
    // Decode common HTML entities
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    // Collapse whitespace
    .replace(/\s{2,}/g, ' ')
    .trim()
}

// ── Detect JS-heavy SPA ──────────────────────────────────────────────────────
// Returns true when the page has very little readable text relative to its
// total size — a strong signal that real content is rendered client-side.
function isJsHeavy(html: string, plainText: string): boolean {
  const scriptCount = (html.match(/<script/gi) || []).length
  const htmlSize = html.length
  const textRatio = plainText.length / Math.max(htmlSize, 1)
  // Heuristic: many script tags AND most content is code, not text
  return scriptCount >= 5 && textRatio < 0.12
}

// ── Jina AI Reader fallback ───────────────────────────────────────────────────
// https://r.jina.ai/{url} returns a fully JS-rendered page as clean markdown.
// Free, no API key required, handles SPAs.
async function fetchViaJina(url: string): Promise<string> {
  const jinaUrl = `https://r.jina.ai/${url}`
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 20_000) // longer for full render
  try {
    const res = await fetch(jinaUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Meraki-GrowthPlanner/1.0',
        Accept: 'text/plain,text/markdown,*/*',
        // Ask Jina to return clean markdown
        'X-Return-Format': 'markdown',
        // Jina respects this to remove nav/footer noise
        'X-Remove-Selector': 'nav,footer,header,[class*="cookie"],[class*="banner"]',
      },
      redirect: 'follow',
    })
    clearTimeout(timeout)
    if (!res.ok) throw new Error(`Jina returned ${res.status}`)
    return await res.text()
  } catch {
    clearTimeout(timeout)
    throw new Error('Dynamic content rendering timed out. Try a different page URL.')
  }
}

// POST /api/onboarding/scan — Fetch a URL and extract product information
// Strategy: static fetch first → if JS-heavy or thin content → Jina Reader fallback
export async function POST(request: Request) {
  try {
    await getRequiredSession()

    const body = await request.json()
    const { url } = scanSchema.parse(body)

    // SSRF guard — validate hostname before any outbound request
    let parsedUrl: URL
    try {
      parsedUrl = new URL(url)
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
    }

    if (isPrivateOrLoopback(parsedUrl.hostname)) {
      return NextResponse.json(
        { error: 'URL points to a private or reserved address' },
        { status: 400 }
      )
    }
    // Also block Jina itself from being used as a proxy target
    if (parsedUrl.hostname === 'r.jina.ai') {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }

    // ── Step 1: Static fetch ──────────────────────────────────────────────────
    let pageText = ''
    let fetchMethod: 'static' | 'jina' = 'static'

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10_000)

      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Meraki-GrowthPlanner/1.0 (product information scanner)',
          Accept: 'text/html,application/xhtml+xml',
        },
        redirect: 'follow',
      })
      clearTimeout(timeout)

      if (res.ok) {
        const contentType = res.headers.get('content-type') || ''
        if (contentType.includes('text/html') || contentType.includes('text/plain')) {
          const html = await res.text()
          const candidate = htmlToText(html)

          // ── Step 2: JS-heavy detection → fall back to Jina ─────────────────
          if (isJsHeavy(html, candidate) || candidate.length < 300) {
            fetchMethod = 'jina'
          } else {
            pageText = candidate
          }
        } else {
          fetchMethod = 'jina' // Non-HTML (redirect to app shell, etc.)
        }
      } else {
        fetchMethod = 'jina' // Static fetch failed, try Jina
      }
    } catch (fetchErr: any) {
      if (fetchErr?.name === 'AbortError') {
        fetchMethod = 'jina' // Timeout — try Jina (it has its own cache)
      } else {
        return NextResponse.json(
          { error: 'Could not reach the URL. Please check it is publicly accessible.' },
          { status: 422 }
        )
      }
    }

    // ── Step 3: Jina Reader for dynamic / JS-rendered sites ──────────────────
    if (fetchMethod === 'jina') {
      try {
        const rendered = await fetchViaJina(url)
        pageText = rendered.slice(0, 14_000)
      } catch (jinaErr: any) {
        return NextResponse.json({ error: jinaErr.message }, { status: 422 })
      }
    } else {
      pageText = pageText.slice(0, 12_000)
    }

    if (pageText.length < 100) {
      return NextResponse.json(
        { error: 'Page content is too short to extract product information from. Try your homepage or a features page.' },
        { status: 422 }
      )
    }

    // Ask GPT-4o to extract structured product data
    // Content may be raw plain text (static) or clean markdown (Jina-rendered)
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.2,
      max_tokens: 800,
      messages: [
        {
          role: 'system',
          content: `You are an expert at extracting B2B SaaS product information from website content. The content may be raw text or rendered markdown from a JavaScript-heavy site.

Extract the following fields from the page text. If a field cannot be confidently determined, return null for that field. Return ONLY valid JSON — no markdown, no explanation.

{
  "companyName": "Company or product name",
  "industry": "Industry or market vertical (e.g. HRTech, MarTech, FinTech)",
  "productCategory": "Type of software (e.g. AI recruitment platform, project management tool)",
  "productDescription": "1-2 sentence description of what the product does",
  "coreValuePromise": "The main outcome or result the product promises (e.g. reduce hiring time by 70%)",
  "primaryCTA": "The main call-to-action on the site (e.g. Book a Demo, Start Free Trial)",
  "targetRole": "The job titles or roles the product targets (e.g. HR Managers, Recruiters, Founders)",
  "targetCompanyProfile": "The type of companies the product targets (e.g. fast-growing startups, staffing agencies)",
  "corePain": "The core problem or pain point the product solves",
  "launchAge": "Any indication of how new the product is (e.g. recently launched, beta, established)",
  "pricing": "Pricing model if mentioned (e.g. free trial, per seat, usage-based)"
}`,
        },
        {
          role: 'user',
          content: `Website URL: ${url}\nContent source: ${fetchMethod === 'jina' ? 'JS-rendered (dynamic site)' : 'static HTML'}\n\nPage content:\n${pageText}`,
        },
      ],
    })

    const raw = completion.choices[0]?.message?.content || '{}'

    let extracted: Record<string, string | null>
    try {
      // Strip markdown code fences if model wrapped the JSON
      const cleaned = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim()
      extracted = JSON.parse(cleaned)
    } catch {
      return NextResponse.json(
        { error: 'Could not parse product information from the page. Try a more descriptive page URL.' },
        { status: 422 }
      )
    }

    // Remove null values so the UI can detect what was found
    const result = Object.fromEntries(
      Object.entries(extracted).filter(([, v]) => v !== null && v !== '')
    )

    return NextResponse.json({ data: result, scannedUrl: url, fetchMethod })
  } catch (error) {
    try {
      return handleAuthError(error)
    } catch {}
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
    }
    console.error('Scan error:', error)
    return NextResponse.json({ error: 'Scan failed' }, { status: 500 })
  }
}
