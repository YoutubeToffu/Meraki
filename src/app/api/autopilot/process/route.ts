import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'
import OpenAI from 'openai'

export const dynamic = 'force-dynamic'

const resend = new Resend(process.env.RESEND_API_KEY)
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const fromAddress = process.env.EMAIL_FROM || 'noreply@meraki.app'
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// POST /api/autopilot/process â€” The AI Brain
// Processes all active AI campaigns autonomously.
// Called via cron or manually.
export async function POST(request: Request) {
  try {
    const cronSecret = process.env.CRON_SECRET
    const authHeader = request.headers.get('authorization')
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      const { getRequiredSession } = await import('@/lib/auth-helpers')
      try { await getRequiredSession() } catch {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const now = new Date()

    // Get all active AI campaigns
    const campaigns = await prisma.aiCampaign.findMany({
      where: { status: 'ACTIVE' },
    })

    if (campaigns.length === 0) {
      return NextResponse.json({ message: 'No active AI campaigns', processed: 0 })
    }

    let totalProcessed = 0
    let totalEmailed = 0
    let totalSkipped = 0
    let totalErrors = 0
    const details: { campaignId: string; outreachId: string; action: string; error?: string }[] = []

    for (const campaign of campaigns) {
      // Check sending window
      if (campaign.sendWindowStart != null && campaign.sendWindowEnd != null) {
        let currentHour: number
        let currentDay: number
        try {
          const hFmt = new Intl.DateTimeFormat('en-US', { timeZone: campaign.sendTimezone, hour: 'numeric', hour12: false })
          const dFmt = new Intl.DateTimeFormat('en-US', { timeZone: campaign.sendTimezone, weekday: 'short' })
          currentHour = parseInt(hFmt.format(now))
          const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
          currentDay = dayMap[dFmt.format(now)] ?? now.getDay()
        } catch {
          currentHour = now.getUTCHours()
          currentDay = now.getUTCDay()
        }
        if (currentHour < campaign.sendWindowStart || currentHour >= campaign.sendWindowEnd || !campaign.sendDays.includes(currentDay)) {
          continue // Outside window
        }
      }

      // Count today's sends to enforce daily limit
      const todayStart = new Date(now)
      todayStart.setHours(0, 0, 0, 0)
      const todaySent = await prisma.email.count({
        where: {
          sentAt: { gte: todayStart },
          lead: {
            organization: {
              aiCampaigns: { some: { id: campaign.id } },
            },
          },
        },
      })
      if (todaySent >= campaign.dailyLimit) continue

      let remainingToday = campaign.dailyLimit - todaySent

      // Get due outreaches for this campaign
      const outreaches = await prisma.aiOutreach.findMany({
        where: {
          aiCampaignId: campaign.id,
          status: { in: ['PENDING', 'ACTIVE'] },
          nextActionAt: { lte: now },
        },
        take: Math.min(remainingToday, 20), // Process max 20 per run
      })

      // Load campaign learnings
      const learnings = (campaign.learnings as any) || {}

      for (const outreach of outreaches) {
        if (remainingToday <= 0) break

        // Load lead data
        const lead = await prisma.lead.findUnique({
          where: { id: outreach.leadId },
          select: {
            id: true, email: true, firstName: true, lastName: true,
            company: true, jobTitle: true, status: true, doNotContact: true,
            tags: true, score: true, lastContactedAt: true,
          },
        })

        if (!lead || lead.doNotContact || lead.status === 'UNSUBSCRIBED') {
          await prisma.aiOutreach.update({
            where: { id: outreach.id },
            data: { status: 'STOPPED', stoppedReason: lead?.doNotContact ? 'DNC' : 'UNSUBSCRIBED', nextActionAt: null },
          })
          totalSkipped++
          details.push({ campaignId: campaign.id, outreachId: outreach.id, action: 'skipped_dnc' })
          continue
        }

        // Check if lead has bounced before
        const bounced = await prisma.email.findFirst({
          where: { leadId: lead.id, status: 'BOUNCED' },
        })
        if (bounced) {
          await prisma.aiOutreach.update({
            where: { id: outreach.id },
            data: { status: 'STOPPED', stoppedReason: 'BOUNCED', nextActionAt: null },
          })
          totalSkipped++
          details.push({ campaignId: campaign.id, outreachId: outreach.id, action: 'skipped_bounced' })
          continue
        }

        // Check max emails
        if (outreach.stepNumber >= campaign.maxEmails) {
          await prisma.aiOutreach.update({
            where: { id: outreach.id },
            data: { status: 'COMPLETED', stoppedReason: 'MAX_REACHED', nextActionAt: null },
          })
          totalSkipped++
          details.push({ campaignId: campaign.id, outreachId: outreach.id, action: 'max_reached' })
          continue
        }

        // Load email history for this lead in this campaign
        const previousEmails = await prisma.email.findMany({
          where: {
            leadId: lead.id,
            // Match emails from this campaign via activity metadata
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: { subject: true, body: true, status: true, sentAt: true, openedAt: true, clickedAt: true, repliedAt: true },
        })

        // Check if lead already replied â€” if so, stop
        const hasReplied = previousEmails.some((e) => e.repliedAt != null)
        if (hasReplied) {
          await prisma.aiOutreach.update({
            where: { id: outreach.id },
            data: { status: 'COMPLETED', stoppedReason: 'REPLIED', nextActionAt: null, totalReplied: outreach.totalReplied + 1 },
          })
          totalSkipped++
          details.push({ campaignId: campaign.id, outreachId: outreach.id, action: 'replied_stop' })
          continue
        }

        // Update engagement stats from email data
        const opened = previousEmails.filter((e) => e.openedAt != null).length
        const clicked = previousEmails.filter((e) => e.clickedAt != null).length

        try {
          // === THE AI BRAIN ===
          // Ask AI what to do next for this lead
          const aiDecision = await getAiDecision({
            campaign,
            lead,
            outreach,
            previousEmails,
            learnings,
            opened,
            clicked,
          })

          if (aiDecision.action === 'STOP') {
            await prisma.aiOutreach.update({
              where: { id: outreach.id },
              data: {
                status: 'STOPPED',
                stoppedReason: 'AI_DECIDED',
                lastAction: 'STOP',
                lastReasoning: aiDecision.reasoning,
                nextActionAt: null,
              },
            })
            details.push({ campaignId: campaign.id, outreachId: outreach.id, action: 'ai_stopped' })
            totalProcessed++
            continue
          }

          if (aiDecision.action === 'WAIT_MONTHS') {
            const resumeAt = new Date(now.getTime() + (aiDecision.waitDays || 90) * 24 * 60 * 60 * 1000)
            await prisma.aiOutreach.update({
              where: { id: outreach.id },
              data: {
                status: 'PAUSED',
                lastAction: 'WAIT_MONTHS',
                lastReasoning: aiDecision.reasoning,
                nextActionAt: resumeAt,
                resumeAt,
              },
            })
            details.push({ campaignId: campaign.id, outreachId: outreach.id, action: `wait_${aiDecision.waitDays}d` })
            totalProcessed++
            continue
          }

          if (aiDecision.action === 'SEND_EMAIL') {
            // AI generated the email â€” send it
            const trackingId = generateTrackingId()
            const subject = aiDecision.subject!
            let body = aiDecision.body!

            // Sanitize
            body = sanitizeHtml(body)

            const trackingPixel = `<img src="${appUrl}/api/track/open/${trackingId}" width="1" height="1" style="display:none" alt="" />`
            const unsubscribeLink = `${appUrl}/api/unsubscribe/${trackingId}`
            const bodyWithTracking = wrapLinks(body, trackingId)
            const htmlBody = bodyWithTracking.replace(/\n/g, '<br>')
              + trackingPixel
              + `<br><p style="font-size:11px;color:#999;margin-top:20px;">If you no longer wish to receive these emails, <a href="${unsubscribeLink}" style="color:#999;">unsubscribe here</a>.</p>`

            const { data: sendData, error: sendError } = await resend.emails.send({
              from: fromAddress,
              to: lead.email,
              subject,
              html: htmlBody,
              headers: { 'List-Unsubscribe': `<${unsubscribeLink}>` },
            })

            if (sendError) {
              details.push({ campaignId: campaign.id, outreachId: outreach.id, action: 'send_failed', error: sendError.message })
              totalErrors++
              continue
            }

            // Record email
            await prisma.email.create({
              data: {
                subject,
                body,
                status: 'SENT',
                sentAt: now,
                leadId: lead.id,
                trackingId,
                messageId: sendData?.id || null,
              },
            })

            await prisma.activity.create({
              data: {
                type: 'EMAIL_SENT',
                title: `AI Autopilot: ${subject}`,
                description: `Campaign "${campaign.name}" â€” Step ${outreach.stepNumber + 1}. AI reasoning: ${aiDecision.reasoning}`,
                leadId: lead.id,
              },
            })

            await prisma.lead.update({
              where: { id: lead.id },
              data: { lastContactedAt: now, status: lead.status === 'NEW' ? 'CONTACTED' : lead.status },
            })

            // Calculate next follow-up timing (AI told us)
            const nextDays = aiDecision.nextFollowUpDays || 3
            const nextAt = new Date(now.getTime() + nextDays * 24 * 60 * 60 * 1000)

            await prisma.aiOutreach.update({
              where: { id: outreach.id },
              data: {
                status: 'ACTIVE',
                stepNumber: outreach.stepNumber + 1,
                totalSent: outreach.totalSent + 1,
                totalOpened: opened,
                totalClicked: clicked,
                lastAction: outreach.stepNumber === 0 ? 'SEND_INITIAL' : 'FOLLOW_UP',
                lastReasoning: aiDecision.reasoning,
                nextActionAt: nextAt,
              },
            })

            remainingToday--
            totalEmailed++
            totalProcessed++
            details.push({ campaignId: campaign.id, outreachId: outreach.id, action: 'email_sent' })
          }
        } catch (err) {
          console.error(`AI autopilot error for outreach ${outreach.id}:`, err)
          details.push({
            campaignId: campaign.id,
            outreachId: outreach.id,
            action: 'error',
            error: err instanceof Error ? err.message : 'Unknown error',
          })
          totalErrors++
        }
      }

      // Update campaign learnings after processing
      const allOutreaches = await prisma.aiOutreach.findMany({
        where: { aiCampaignId: campaign.id },
        select: { totalSent: true, totalOpened: true, totalReplied: true, totalClicked: true },
      })
      const updatedLearnings = {
        ...learnings,
        totalSent: allOutreaches.reduce((s, o) => s + o.totalSent, 0),
        totalOpened: allOutreaches.reduce((s, o) => s + o.totalOpened, 0),
        totalReplied: allOutreaches.reduce((s, o) => s + o.totalReplied, 0),
        totalClicked: allOutreaches.reduce((s, o) => s + o.totalClicked, 0),
        lastProcessedAt: now.toISOString(),
      }
      await prisma.aiCampaign.update({
        where: { id: campaign.id },
        data: { learnings: updatedLearnings },
      })
    }

    return NextResponse.json({
      message: `Processed ${totalProcessed}, sent ${totalEmailed} email(s), skipped ${totalSkipped}, ${totalErrors} error(s)`,
      processed: totalProcessed,
      emailed: totalEmailed,
      skipped: totalSkipped,
      errors: totalErrors,
      details,
    })
  } catch (error) {
    console.error('AI Autopilot processor error:', error)
    return NextResponse.json({ error: 'Processor failed' }, { status: 500 })
  }
}

// ================================================================
// THE AI BRAIN â€” Decides what to do for each lead
// ================================================================
interface AiDecision {
  action: 'SEND_EMAIL' | 'WAIT_MONTHS' | 'STOP'
  reasoning: string
  subject?: string
  body?: string
  nextFollowUpDays?: number
  waitDays?: number
}

async function getAiDecision(params: {
  campaign: any
  lead: any
  outreach: any
  previousEmails: any[]
  learnings: any
  opened: number
  clicked: number
}): Promise<AiDecision> {
  const { campaign, lead, outreach, previousEmails, learnings, opened, clicked } = params

  const emailHistory = previousEmails.map((e, i) => {
    const status = []
    if (e.openedAt) status.push('opened')
    if (e.clickedAt) status.push('clicked')
    if (e.repliedAt) status.push('replied')
    return `Email ${i + 1}: Subject: "${e.subject}" | Status: ${status.length ? status.join(', ') : 'no engagement'} | Sent: ${e.sentAt?.toISOString?.() || 'unknown'}`
  }).join('\n')

  const campaignStats = `Campaign totals: ${learnings.totalSent || 0} sent, ${learnings.totalOpened || 0} opened (${learnings.totalSent ? Math.round((learnings.totalOpened / learnings.totalSent) * 100) : 0}% open rate), ${learnings.totalReplied || 0} replied (${learnings.totalSent ? Math.round((learnings.totalReplied / learnings.totalSent) * 100) : 0}% reply rate)`

  const systemPrompt = `You are an expert AI sales development representative (SDR). You autonomously manage email outreach campaigns.

Your job: Decide the BEST next action for reaching this specific lead. You can:
1. SEND_EMAIL â€” Write and send a personalized email
2. WAIT_MONTHS â€” Pause outreach and revisit in X days (use when timing isn't right)
3. STOP â€” Stop outreach to this lead entirely (use when it's clearly not a fit or you've exhausted attempts)

RULES:
- Keep emails SHORT (3-5 sentences). Be human, conversational, no corporate jargon.
- NEVER use "I hope this email finds you well" or similar clichÃ©s
- Each follow-up must take a DIFFERENT angle â€” don't repeat yourself
- If the lead hasn't opened any of 3+ emails, try a completely different subject line style
- If the lead opened but didn't reply after 2+ emails, try a shorter/more direct ask
- After ${campaign.maxEmails} emails with no engagement, recommend STOP
- Suggest follow-up timing: 2-3 days for warm leads, 4-7 for cold, 60-90 days for WAIT_MONTHS
- Use the campaign's overall performance data to improve â€” if certain angles work better, lean into those
- Tone: ${campaign.tone}
- Do NOT include sender name/signature â€” that's added separately

IMPORTANT: Respond in valid JSON format ONLY:
{
  "action": "SEND_EMAIL" | "WAIT_MONTHS" | "STOP",
  "reasoning": "Brief explanation of your decision",
  "subject": "Email subject (only for SEND_EMAIL)",
  "body": "Email body text (only for SEND_EMAIL)",
  "nextFollowUpDays": 3,
  "waitDays": 90
}`

  const userPrompt = `CAMPAIGN GOAL: ${campaign.goal}

PRODUCT/SERVICE CONTEXT: ${campaign.context}

${campaign.targetAudience ? `TARGET AUDIENCE: ${campaign.targetAudience}` : ''}

LEAD INFO:
- Name: ${lead.firstName || 'Unknown'} ${lead.lastName || ''}
- Title: ${lead.jobTitle || 'Unknown'}
- Company: ${lead.company || 'Unknown'}
- Score: ${lead.score || 0}
- Tags: ${lead.tags?.join(', ') || 'none'}

OUTREACH STATUS:
- Emails sent so far: ${outreach.stepNumber}
- Emails opened: ${opened}
- Emails clicked: ${clicked}
- Max allowed: ${campaign.maxEmails}

${emailHistory ? `PREVIOUS EMAILS:\n${emailHistory}` : 'No previous emails sent yet.'}

${campaignStats}

${learnings.bestSubjects?.length ? `BEST PERFORMING SUBJECTS: ${learnings.bestSubjects.join(', ')}` : ''}
${learnings.bestAngles?.length ? `BEST PERFORMING ANGLES: ${learnings.bestAngles.join(', ')}` : ''}
${learnings.avoidAngles?.length ? `ANGLES TO AVOID: ${learnings.avoidAngles.join(', ')}` : ''}

What should I do next for this lead?`

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 800,
    response_format: { type: 'json_object' },
  })

  const raw = completion.choices[0]?.message?.content || '{}'
  const decision: AiDecision = JSON.parse(raw)

  // Validate
  if (!decision.action || !['SEND_EMAIL', 'WAIT_MONTHS', 'STOP'].includes(decision.action)) {
    throw new Error(`Invalid AI decision action: ${decision.action}`)
  }
  if (decision.action === 'SEND_EMAIL' && (!decision.subject || !decision.body)) {
    throw new Error('AI returned SEND_EMAIL without subject or body')
  }

  return decision
}

// === Utility functions (same as sequence processor) ===--

function sanitizeHtml(text: string): string {
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^>]*\/?>/gi, '')
    .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '')
    .replace(/\bon\w+\s*=/gi, 'data-blocked=')
    .replace(/javascript:/gi, 'blocked:')
}

function wrapLinks(html: string, trackingId: string): string {
  return html.replace(
    /href=["'](https?:\/\/[^"']+)["']/gi,
    (match, url) => {
      if (url.includes('/api/track/') || url.includes('/api/unsubscribe/')) return match
      const trackUrl = `${appUrl}/api/track/click/${trackingId}?url=${encodeURIComponent(url)}`
      return `href="${trackUrl}"`
    }
  )
}

function generateTrackingId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let id = ''
  for (let i = 0; i < 24; i++) {
    id += chars[Math.floor(Math.random() * chars.length)]
  }
  return id
}
