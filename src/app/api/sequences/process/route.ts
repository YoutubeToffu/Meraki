import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const fromAddress = process.env.EMAIL_FROM || 'noreply@meraki.app'
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

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
      ? await prisma.emailTemplate.findMany({ where: { id: { in: [...new Set(templateIds)] } } })
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
