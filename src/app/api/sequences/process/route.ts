import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'
import OpenAI from 'openai'

const resend = new Resend(process.env.RESEND_API_KEY)
const fromAddress = process.env.EMAIL_FROM || 'noreply@meraki.app'
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// POST /api/sequences/process — Process pending sequence steps
// Called via cron job or manually. Secured by CRON_SECRET header.
export async function POST(request: Request) {
  try {
    // Auth: either CRON_SECRET header or valid session
    const cronSecret = process.env.CRON_SECRET
    const authHeader = request.headers.get('authorization')

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      const { getRequiredSession } = await import('@/lib/auth-helpers')
      try {
        await getRequiredSession()
      } catch {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const now = new Date()
    const lockExpiry = new Date(now.getTime() - 5 * 60 * 1000) // 5 min lock timeout

    // === RACE CONDITION FIX ===
    // Claim enrollments by setting lockedAt atomically.
    // Only grab rows that are unlocked or have an expired lock.
    const claimed = await prisma.$executeRaw`
      UPDATE "SequenceEnrollment"
      SET "lockedAt" = ${now}
      WHERE id IN (
        SELECT id FROM "SequenceEnrollment"
        WHERE status = 'ACTIVE'
          AND "nextStepAt" <= ${now}
          AND ("lockedAt" IS NULL OR "lockedAt" < ${lockExpiry})
        LIMIT 50
      )
    `

    if (claimed === 0) {
      return NextResponse.json({ message: 'No pending steps', processed: 0 })
    }

    // Fetch the enrollments we just locked
    const dueEnrollments = await prisma.sequenceEnrollment.findMany({
      where: {
        status: 'ACTIVE',
        lockedAt: now,
      },
      include: {
        sequence: {
          include: {
            steps: { orderBy: { order: 'asc' } },
          },
        },
        lead: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            company: true,
            jobTitle: true,
            status: true,
            organizationId: true,
            doNotContact: true,
          },
        },
      },
    })

    let processed = 0
    let emailed = 0
    let skipped = 0
    let errors = 0
    const details: { enrollmentId: string; action: string; error?: string }[] = []

    // Pre-load templates to avoid N+1
    const templateIds = dueEnrollments
      .flatMap((e) => e.sequence.steps.map((s) => s.templateId))
      .filter((id): id is string => !!id)
    const templates = templateIds.length > 0
      ? await prisma.emailTemplate.findMany({ where: { id: { in: Array.from(new Set(templateIds)) } } })
      : []
    const templateMap = new Map(templates.map((t) => [t.id, t]))

    // Check daily send count per sequence for throttling
    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0)
    const sequenceIds = [...new Set(dueEnrollments.map((e) => e.sequenceId))]
    const dailyCounts = new Map<string, number>()
    for (const seqId of sequenceIds) {
      const count = await prisma.email.count({
        where: {
          sequenceEnrollmentId: { not: null },
          sentAt: { gte: todayStart },
          lead: {
            sequenceEnrollments: { some: { sequenceId: seqId } },
          },
        },
      })
      dailyCounts.set(seqId, count)
    }

    for (const enrollment of dueEnrollments) {
      const { sequence, lead } = enrollment
      const steps = sequence.steps
      const currentStepIndex = enrollment.currentStep

      // === UNSUBSCRIBE CHECK ===
      if (lead.status === 'UNSUBSCRIBED') {
        await prisma.sequenceEnrollment.update({
          where: { id: enrollment.id },
          data: { status: 'UNSUBSCRIBED', nextStepAt: null, lockedAt: null },
        })
        details.push({ enrollmentId: enrollment.id, action: 'unsubscribed_skip' })
        skipped++
        continue
      }

      // === DO NOT CONTACT FILTER ===
      if ((lead as any).doNotContact === true) {
        await prisma.sequenceEnrollment.update({
          where: { id: enrollment.id },
          data: { status: 'COMPLETED', completedAt: now, nextStepAt: null, lockedAt: null },
        })
        details.push({ enrollmentId: enrollment.id, action: 'do_not_contact_skip' })
        skipped++
        continue
      }

      // === BOUNCED LEAD FILTER ===
      // If the last email to this lead bounced, stop emailing them
      const lastBounce = await prisma.email.findFirst({
        where: { leadId: lead.id, status: 'BOUNCED' },
        orderBy: { createdAt: 'desc' },
      })
      if (lastBounce) {
        await prisma.sequenceEnrollment.update({
          where: { id: enrollment.id },
          data: { status: 'BOUNCED', nextStepAt: null, lockedAt: null },
        })
        details.push({ enrollmentId: enrollment.id, action: 'bounced_skip' })
        skipped++
        continue
      }

      const step = steps[currentStepIndex]
      if (!step) {
        await prisma.sequenceEnrollment.update({
          where: { id: enrollment.id },
          data: { status: 'COMPLETED', completedAt: now, nextStepAt: null, lockedAt: null },
        })
        details.push({ enrollmentId: enrollment.id, action: 'completed' })
        processed++
        continue
      }

      // === SENDING WINDOW CHECK ===
      if (step.type === 'EMAIL' && sequence.sendWindowStart != null && sequence.sendWindowEnd != null) {
        const tz = sequence.sendTimezone || 'UTC'
        let currentHour: number
        let currentDay: number
        try {
          const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: tz,
            hour: 'numeric',
            hour12: false,
          })
          const dayFormatter = new Intl.DateTimeFormat('en-US', {
            timeZone: tz,
            weekday: 'short',
          })
          currentHour = parseInt(formatter.format(now))
          const dayStr = dayFormatter.format(now)
          const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
          currentDay = dayMap[dayStr] ?? new Date().getDay()
        } catch {
          currentHour = now.getUTCHours()
          currentDay = now.getUTCDay()
        }

        const inWindow = currentHour >= sequence.sendWindowStart && currentHour < sequence.sendWindowEnd
        const isAllowedDay = sequence.sendDays.includes(currentDay)

        if (!inWindow || !isAllowedDay) {
          // Defer — unlock and don't advance
          await prisma.sequenceEnrollment.update({
            where: { id: enrollment.id },
            data: { lockedAt: null },
          })
          details.push({ enrollmentId: enrollment.id, action: 'deferred_window' })
          skipped++
          continue
        }
      }

      // === DAILY THROTTLE CHECK ===
      if (step.type === 'EMAIL') {
        const todaySent = dailyCounts.get(sequence.id) || 0
        if (todaySent >= sequence.dailySendLimit) {
          await prisma.sequenceEnrollment.update({
            where: { id: enrollment.id },
            data: { lockedAt: null },
          })
          details.push({ enrollmentId: enrollment.id, action: 'throttled' })
          skipped++
          continue
        }
      }

      try {
        if (step.type === 'EMAIL') {
          let subject = step.subject || ''
          let body = step.body || ''

          if (step.templateId) {
            const template = templateMap.get(step.templateId)
            if (template) {
              subject = template.subject
              body = template.body
            }
          }

          // === AI AUTO-GENERATE ===
          // If useAiPersonalization is enabled and no subject/body, generate via GPT-4o
          if (step.useAiPersonalization && (!subject || !body)) {
            try {
              const generated = await generateAiEmail(
                lead,
                sequence.name,
                currentStepIndex,
                steps.length,
                step.aiPrompt || undefined,
              )
              subject = generated.subject
              body = generated.body
            } catch (aiErr) {
              console.error(`AI generation failed for enrollment ${enrollment.id}:`, aiErr)
              details.push({
                enrollmentId: enrollment.id,
                action: 'ai_generation_failed',
                error: aiErr instanceof Error ? aiErr.message : 'AI generation failed',
              })
              errors++
              await prisma.sequenceEnrollment.update({
                where: { id: enrollment.id },
                data: { lockedAt: null },
              })
              continue
            }
          }

          if (!subject || !body) {
            details.push({
              enrollmentId: enrollment.id,
              action: 'skipped',
              error: 'Email step missing subject or body',
            })
          } else {
            const personalizedSubject = personalize(subject, lead)
            let personalizedBody = personalize(body, lead)

            // === SANITIZE HTML ===
            personalizedBody = sanitizeHtml(personalizedBody)

            // Generate tracking ID for this email
            const trackingId = generateTrackingId()

            // === ADD TRACKING PIXEL + UNSUBSCRIBE LINK ===
            const trackingPixel = `<img src="${appUrl}/api/track/open/${trackingId}" width="1" height="1" style="display:none" alt="" />`
            const unsubscribeLink = `${appUrl}/api/unsubscribe/${trackingId}`

            // Wrap links for click tracking
            const bodyWithTracking = wrapLinks(personalizedBody, trackingId)

            const htmlBody = bodyWithTracking.replace(/\n/g, '<br>')
              + trackingPixel
              + `<br><p style="font-size:11px;color:#999;margin-top:20px;">If you no longer wish to receive these emails, <a href="${unsubscribeLink}" style="color:#999;">unsubscribe here</a>.</p>`

            const { data: sendData, error: sendError } = await resend.emails.send({
              from: fromAddress,
              to: lead.email,
              subject: personalizedSubject,
              html: htmlBody,
              headers: {
                'List-Unsubscribe': `<${unsubscribeLink}>`,
              },
            })

            if (sendError) {
              details.push({ enrollmentId: enrollment.id, action: 'email_failed', error: sendError.message })
              errors++
              // Unlock for retry
              await prisma.sequenceEnrollment.update({
                where: { id: enrollment.id },
                data: { lockedAt: null },
              })
              continue
            }

            // Create Email record with tracking + sequence link
            await prisma.email.create({
              data: {
                subject: personalizedSubject,
                body: personalizedBody,
                status: 'SENT',
                sentAt: now,
                leadId: lead.id,
                trackingId,
                messageId: sendData?.id || null,
                sequenceEnrollmentId: enrollment.id,
              },
            })

            await prisma.activity.create({
              data: {
                type: 'EMAIL_SENT',
                title: `Sequence email: ${personalizedSubject}`,
                description: `Step ${currentStepIndex + 1} of "${sequence.name}"`,
                leadId: lead.id,
              },
            })

            await prisma.lead.update({
              where: { id: lead.id },
              data: { lastContactedAt: now },
            })

            // Increment daily count
            dailyCounts.set(sequence.id, (dailyCounts.get(sequence.id) || 0) + 1)

            emailed++
            details.push({ enrollmentId: enrollment.id, action: 'email_sent' })
          }
        } else if (step.type === 'WAIT') {
          details.push({ enrollmentId: enrollment.id, action: 'wait_completed' })
        } else if (step.type === 'TASK') {
          await prisma.activity.create({
            data: {
              type: 'NOTE_ADDED',
              title: step.taskTitle || `Task from sequence "${sequence.name}"`,
              description: step.taskDescription || `Step ${currentStepIndex + 1}`,
              leadId: lead.id,
            },
          })
          details.push({ enrollmentId: enrollment.id, action: 'task_created' })
        } else if (step.type === 'LINKEDIN') {
          await prisma.activity.create({
            data: {
              type: 'LINKEDIN_MESSAGE',
              title: `LinkedIn ${step.linkedinAction?.toLowerCase() || 'action'}: ${sequence.name}`,
              description: step.linkedinMessage || `Step ${currentStepIndex + 1}`,
              leadId: lead.id,
            },
          })
          details.push({ enrollmentId: enrollment.id, action: 'linkedin_logged' })
        } else if (step.type === 'CONDITION') {
          // === CONDITIONAL BRANCHING ===
          const conditionMet = await evaluateCondition(
            step as any,
            lead,
            enrollment,
          )
          const gotoStep = conditionMet
            ? (step as any).trueGotoStep
            : (step as any).falseGotoStep

          if (gotoStep != null) {
            // Jump to specified step order
            const targetIndex = steps.findIndex((s) => s.order === gotoStep)
            if (targetIndex >= 0) {
              const targetStep = steps[targetIndex]
              const delayMs = (targetStep.delayDays * 24 * 60 * 60 * 1000) + (targetStep.delayHours * 60 * 60 * 1000)
              await prisma.sequenceEnrollment.update({
                where: { id: enrollment.id },
                data: {
                  currentStep: targetIndex,
                  nextStepAt: delayMs > 0 ? new Date(now.getTime() + delayMs) : now,
                  lockedAt: null,
                },
              })
              details.push({
                enrollmentId: enrollment.id,
                action: `condition_${conditionMet ? 'true' : 'false'}_goto_${gotoStep}`,
              })
              processed++
              continue // skip normal advance logic
            }
          }
          // If no goto specified or target not found, fall through to normal advance
          details.push({
            enrollmentId: enrollment.id,
            action: `condition_${conditionMet ? 'true' : 'false'}_next`,
          })
        }

        // Advance to next step
        const nextStepIndex = currentStepIndex + 1
        if (nextStepIndex >= steps.length) {
          await prisma.sequenceEnrollment.update({
            where: { id: enrollment.id },
            data: { status: 'COMPLETED', completedAt: now, currentStep: nextStepIndex, nextStepAt: null, lockedAt: null },
          })
        } else {
          const nextStep = steps[nextStepIndex]
          const delayMs = (nextStep.delayDays * 24 * 60 * 60 * 1000) + (nextStep.delayHours * 60 * 60 * 1000)
          const nextStepAt = new Date(now.getTime() + Math.max(delayMs, 0))
          await prisma.sequenceEnrollment.update({
            where: { id: enrollment.id },
            data: { currentStep: nextStepIndex, nextStepAt: delayMs > 0 ? nextStepAt : now, lockedAt: null },
          })
        }

        processed++
      } catch (err) {
        console.error(`Error processing enrollment ${enrollment.id}:`, err)
        details.push({ enrollmentId: enrollment.id, action: 'error', error: err instanceof Error ? err.message : 'Unknown error' })
        errors++
        // Unlock on error
        await prisma.sequenceEnrollment.update({
          where: { id: enrollment.id },
          data: { lockedAt: null },
        }).catch(() => {})
      }
    }

    return NextResponse.json({
      message: `Processed ${processed}, sent ${emailed} email(s), skipped ${skipped}, ${errors} error(s)`,
      processed,
      emailed,
      skipped,
      errors,
      details,
    })
  } catch (error) {
    console.error('Sequence processor error:', error)
    return NextResponse.json({ error: 'Processor failed' }, { status: 500 })
  }
}

// === PERSONALIZATION WITH FALLBACKS ===
// Supports {{variable}} and {{variable | fallback}}
function personalize(text: string, lead: {
  firstName: string | null
  lastName: string | null
  email: string
  company: string | null
  jobTitle: string | null
}): string {
  const vars: Record<string, string> = {
    firstname: lead.firstName || '',
    lastname: lead.lastName || '',
    email: lead.email,
    company: lead.company || '',
    jobtitle: lead.jobTitle || '',
    fullname: `${lead.firstName || ''} ${lead.lastName || ''}`.trim(),
  }

  // Handle {{var | fallback}} syntax
  return text.replace(/\{\{(\w+)(?:\s*\|\s*([^}]+))?\}\}/gi, (_, varName, fallback) => {
    const value = vars[varName.toLowerCase()]
    if (value) return value
    if (fallback) return fallback.trim()
    return ''
  })
}

// === HTML SANITIZATION ===
function sanitizeHtml(text: string): string {
  // Strip dangerous tags but keep safe formatting
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^>]*\/?>/gi, '')
    .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '')
    .replace(/\bon\w+\s*=/gi, 'data-blocked=')
    .replace(/javascript:/gi, 'blocked:')
}

// === LINK WRAPPING FOR CLICK TRACKING ===
function wrapLinks(html: string, trackingId: string): string {
  // Match href="..." in anchor tags, skip unsubscribe and tracking URLs
  return html.replace(
    /href=["'](https?:\/\/[^"']+)["']/gi,
    (match, url) => {
      // Don't wrap our own tracking/unsubscribe URLs
      if (url.includes('/api/track/') || url.includes('/api/unsubscribe/')) {
        return match
      }
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

// === CONDITION EVALUATION ENGINE ===
// Checks lead activity data to determine if a condition step passes
async function evaluateCondition(
  step: { conditionType?: string | null; conditionValue?: string | null },
  lead: { id: string; email: string; score?: number; tags?: string[]; status?: string },
  enrollment: { id: string; sequenceId: string; currentStep: number },
): Promise<boolean> {
  const conditionType = (step.conditionType || '').toUpperCase()

  switch (conditionType) {
    case 'EMAIL_OPENED': {
      // Did the lead open the most recent sequence email?
      const lastEmail = await prisma.email.findFirst({
        where: { leadId: lead.id, sequenceEnrollmentId: enrollment.id },
        orderBy: { createdAt: 'desc' },
      })
      return lastEmail?.openedAt != null
    }
    case 'EMAIL_CLICKED': {
      const lastEmail = await prisma.email.findFirst({
        where: { leadId: lead.id, sequenceEnrollmentId: enrollment.id },
        orderBy: { createdAt: 'desc' },
      })
      return lastEmail?.clickedAt != null
    }
    case 'EMAIL_REPLIED': {
      const lastEmail = await prisma.email.findFirst({
        where: { leadId: lead.id, sequenceEnrollmentId: enrollment.id },
        orderBy: { createdAt: 'desc' },
      })
      return lastEmail?.repliedAt != null
    }
    case 'SCORE_ABOVE': {
      const threshold = parseInt(step.conditionValue || '0', 10)
      const freshLead = await prisma.lead.findUnique({
        where: { id: lead.id },
        select: { score: true },
      })
      return (freshLead?.score || 0) > threshold
    }
    case 'HAS_TAG': {
      const tag = (step.conditionValue || '').toLowerCase()
      const freshLead = await prisma.lead.findUnique({
        where: { id: lead.id },
        select: { tags: true },
      })
      return (freshLead?.tags || []).some((t) => t.toLowerCase() === tag)
    }
    case 'STATUS_IS': {
      const freshLead = await prisma.lead.findUnique({
        where: { id: lead.id },
        select: { status: true },
      })
      return freshLead?.status === (step.conditionValue || '').toUpperCase()
    }
    default:
      // Unknown condition → treat as true (continue)
      return true
  }
}

// === AI EMAIL GENERATION ===
// Generates a personalized cold email or follow-up using GPT-4o
async function generateAiEmail(
  lead: {
    firstName: string | null
    lastName: string | null
    email: string
    company: string | null
    jobTitle: string | null
  },
  sequenceName: string,
  stepIndex: number,
  totalSteps: number,
  customPrompt?: string,
): Promise<{ subject: string; body: string }> {
  const isFirstEmail = stepIndex === 0
  const isLastEmail = stepIndex === totalSteps - 1
  const followUpNumber = stepIndex // 0-based: step 0 = initial, step 1+ = follow-ups

  const systemPrompt = `You are an expert cold email copywriter. Write highly personalized, concise business emails.

Rules:
- Keep emails short (3-5 sentences for the body)
- Be conversational and human — no corporate jargon
- Include a clear, soft call-to-action
- Never use generic openings like "I hope this email finds you well"
- Reference the lead's company and role naturally
- Do NOT include the sender's name/signature — that's added automatically
- Respond in valid JSON format: {"subject": "...", "body": "..."}`

  let userPrompt = ''

  if (isFirstEmail) {
    userPrompt = `Write an initial cold outreach email.

Lead: ${lead.firstName || 'there'} ${lead.lastName || ''}
Title: ${lead.jobTitle || 'Unknown'}
Company: ${lead.company || 'Unknown'}
Sequence: ${sequenceName}`
  } else if (isLastEmail) {
    userPrompt = `Write a final breakup email (follow-up #${followUpNumber}). This is the last email in the sequence, so keep it brief, friendly, and give them an easy way to say "not interested."

Lead: ${lead.firstName || 'there'} ${lead.lastName || ''}
Title: ${lead.jobTitle || 'Unknown'}
Company: ${lead.company || 'Unknown'}
Sequence: ${sequenceName}`
  } else {
    userPrompt = `Write follow-up email #${followUpNumber}. Reference that you reached out before but don't be pushy. Add new value or a different angle.

Lead: ${lead.firstName || 'there'} ${lead.lastName || ''}
Title: ${lead.jobTitle || 'Unknown'}
Company: ${lead.company || 'Unknown'}
Sequence: ${sequenceName}`
  }

  if (customPrompt) {
    userPrompt += `\n\nAdditional context from the user:\n${customPrompt}`
  }

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 500,
    response_format: { type: 'json_object' },
  })

  const raw = completion.choices[0]?.message?.content || '{}'
  const parsed = JSON.parse(raw)

  if (!parsed.subject || !parsed.body) {
    throw new Error('AI returned incomplete email (missing subject or body)')
  }

  return { subject: parsed.subject, body: parsed.body }
}
