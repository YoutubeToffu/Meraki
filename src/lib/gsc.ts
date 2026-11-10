import { prisma } from '@/lib/prisma'
import { decryptSecret, encryptSecret } from '@/lib/email-config'

export const GSC_SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly'
const GSC_API = 'https://www.googleapis.com/webmasters/v3'
const INSPECT_API = 'https://searchconsole.googleapis.com/v1/urlInspection/index:inspect'

const clientId = () => process.env.GOOGLE_CLIENT_ID ?? ''
const clientSecret = () => process.env.GOOGLE_CLIENT_SECRET ?? ''
export const gscRedirectUri = () =>
  `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/gsc/callback`

export const isGscConfigured = () => Boolean(clientId() && clientSecret())

export function buildAuthUrl(state: string) {
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  url.searchParams.set('client_id', clientId())
  url.searchParams.set('redirect_uri', gscRedirectUri())
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', GSC_SCOPE)
  url.searchParams.set('access_type', 'offline')
  url.searchParams.set('prompt', 'consent')
  url.searchParams.set('state', state)
  return url.toString()
}

interface TokenResponse {
  access_token: string
  refresh_token?: string
  expires_in?: number
}

async function tokenRequest(params: Record<string, string>): Promise<TokenResponse> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: clientId(), client_secret: clientSecret(), ...params }),
  })
  if (!res.ok) throw new Error(`Google token request failed: ${await res.text()}`)
  return res.json()
}

export const exchangeCode = (code: string) =>
  tokenRequest({ grant_type: 'authorization_code', code, redirect_uri: gscRedirectUri() })

export class GscNotConnectedError extends Error {}

// Returns a valid access token for the org, refreshing it when expired.
export async function getAccessToken(organizationId: string): Promise<string> {
  const integration = await prisma.integration.findUnique({
    where: { organizationId_type: { organizationId, type: 'GOOGLE_SEARCH_CONSOLE' } },
  })
  if (!integration || integration.status === 'DISCONNECTED' || !integration.accessToken) {
    throw new GscNotConnectedError('Google Search Console is not connected')
  }

  const stillValid = integration.expiresAt && integration.expiresAt.getTime() - 60_000 > Date.now()
  if (stillValid) return decryptSecret(integration.accessToken)

  if (!integration.refreshToken) {
    await prisma.integration.update({ where: { id: integration.id }, data: { status: 'EXPIRED' } })
    throw new GscNotConnectedError('Google Search Console connection expired. Please reconnect.')
  }

  try {
    const tokens = await tokenRequest({
      grant_type: 'refresh_token',
      refresh_token: decryptSecret(integration.refreshToken),
    })
    await prisma.integration.update({
      where: { id: integration.id },
      data: {
        status: 'CONNECTED',
        accessToken: encryptSecret(tokens.access_token),
        expiresAt: new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000),
      },
    })
    return tokens.access_token
  } catch {
    await prisma.integration.update({ where: { id: integration.id }, data: { status: 'EXPIRED' } })
    throw new GscNotConnectedError('Google Search Console connection expired. Please reconnect.')
  }
}

async function gscRequest<T>(token: string, url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method: body ? 'POST' : 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Search Console API error (${res.status}): ${await res.text()}`)
  return res.json()
}

export interface GscSite {
  siteUrl: string
  permissionLevel: string
}

export async function listSites(token: string): Promise<GscSite[]> {
  const data = await gscRequest<{ siteEntry?: GscSite[] }>(token, `${GSC_API}/sites`)
  return (data.siteEntry ?? []).filter((s) => s.permissionLevel !== 'siteUnverifiedUser')
}

export interface GscRow {
  keys?: string[]
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export async function searchAnalytics(
  token: string,
  siteUrl: string,
  body: { startDate: string; endDate: string; dimensions?: string[]; rowLimit?: number }
): Promise<GscRow[]> {
  const data = await gscRequest<{ rows?: GscRow[] }>(
    token,
    `${GSC_API}/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    body
  )
  return data.rows ?? []
}

export interface UrlInspection {
  verdict?: string
  coverageState?: string
  indexingState?: string
  robotsTxtState?: string
  pageFetchState?: string
  lastCrawlTime?: string
  crawledAs?: string
  userCanonical?: string
  googleCanonical?: string
  sitemap?: string[]
  referringUrls?: string[]
}

export async function inspectUrl(token: string, siteUrl: string, inspectionUrl: string): Promise<UrlInspection> {
  const data = await gscRequest<{ inspectionResult?: { indexStatusResult?: Record<string, any> } }>(
    token,
    INSPECT_API,
    { inspectionUrl, siteUrl }
  )
  const r = data.inspectionResult?.indexStatusResult ?? {}
  return {
    verdict: r.verdict,
    coverageState: r.coverageState,
    indexingState: r.indexingState,
    robotsTxtState: r.robotsTxtState,
    pageFetchState: r.pageFetchState,
    lastCrawlTime: r.lastCrawlTime,
    crawledAs: r.crawledAs,
    userCanonical: r.userCanonical,
    googleCanonical: r.googleCanonical,
    sitemap: r.sitemap,
    referringUrls: r.referringUrls,
  }
}

export const isoDate = (d: Date) => d.toISOString().slice(0, 10)

// Search Console data lags ~2-3 days, so the range ends 3 days ago.
export function dateRanges(days: number) {
  const end = new Date()
  end.setUTCDate(end.getUTCDate() - 3)
  const start = new Date(end)
  start.setUTCDate(start.getUTCDate() - (days - 1))
  const prevEnd = new Date(start)
  prevEnd.setUTCDate(prevEnd.getUTCDate() - 1)
  const prevStart = new Date(prevEnd)
  prevStart.setUTCDate(prevStart.getUTCDate() - (days - 1))
  return {
    current: { startDate: isoDate(start), endDate: isoDate(end) },
    previous: { startDate: isoDate(prevStart), endDate: isoDate(prevEnd) },
  }
}
