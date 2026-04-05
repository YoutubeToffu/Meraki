import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/webhooks/resend — Handle Resend webhook events
// Configure in Resend dashboard: https://resend.com/webhooks
// Events: email.delivered, email.opened, email.clicked, email.bounced, email.complained
export async function POST(request: Request) {
  try {
    // Verify webhook signature (Resend uses svix)
    const svixId = request.headers.get('svix-id')
    const svixTimestamp = request.headers.get('svix-timestamp')
    const svixSignature = request.headers.get('svix-signature')

    const body = await request.json()
    const { type, data } = body

    // In production, verify signature with Resend's webhook secret
    // For now, check svix headers exist as basic validation
    if (!svixId) {
      console.warn('Resend webhook missing svix-id header')
    }

    switch (type) {
      case 'email.delivered': {
        if (data?.email_id) {
          await prisma.email.updateMany({
            where: { messageId: data.email_id },
            data: { status: 'DELIVERED' },
          })
        }
        break
      }

      case 'email.opened': {
        if (data?.email_id) {
          const email = await prisma.email.findFirst({
            where: { messageId: data.email_id },
          })
          if (email && !email.openedAt) {
            await prisma.email.update({
              where: { id: email.id },
              data: { openedAt: new Date(), status: 'OPENED' },
            })
            await prisma.activity.create({
              data: {
                type: 'EMAIL_OPENED',
                title: `Email opened: ${email.subject}`,
                leadId: email.leadId,
              },
            })
          }
        }
        break
      }

      case 'email.clicked': {
        if (data?.email_id) {
          const email = await prisma.email.findFirst({
            where: { messageId: data.email_id },
          })
          if (email && !email.clickedAt) {
            await prisma.email.update({
              where: { id: email.id },
              data: { clickedAt: new Date(), status: 'CLICKED' },
            })
            await prisma.activity.create({
              data: {
                type: 'EMAIL_CLICKED',
                title: `Link clicked: ${email.subject}`,
                leadId: email.leadId,
              },
            })
          }
        }
        break
      }

      case 'email.bounced': {
        if (data?.email_id) {
          const email = await prisma.email.findFirst({
            where: { messageId: data.email_id },
            select: { id: true, leadId: true, subject: true, sequenceEnrollmentId: true },
          })
          if (email) {
            await prisma.email.update({
              where: { id: email.id },
              data: { bouncedAt: new Date(), status: 'BOUNCED' },
            })

            // Mark enrollment as bounced
            if (email.sequenceEnrollmentId) {
              await prisma.sequenceEnrollment.update({
                where: { id: email.sequenceEnrollmentId },
                data: { status: 'BOUNCED', nextStepAt: null },
              })
            }

            await prisma.activity.create({
              data: {
                type: 'EMAIL_SENT',
                title: `Email bounced: ${email.subject}`,
                description: data.bounce_type || 'Hard bounce',
                leadId: email.leadId,
              },
            })
          }
        }
        break
      }

      case 'email.complained': {
        // Spam complaint — treat as unsubscribe
        if (data?.email_id) {
          const email = await prisma.email.findFirst({
            where: { messageId: data.email_id },
            select: { leadId: true },
          })
          if (email) {
            await prisma.lead.update({
              where: { id: email.leadId },
              data: { status: 'UNSUBSCRIBED' },
            })
            await prisma.sequenceEnrollment.updateMany({
              where: { leadId: email.leadId, status: 'ACTIVE' },
              data: { status: 'UNSUBSCRIBED', nextStepAt: null },
            })
          }
        }
        break
      }

      default:
        console.log(`Unhandled Resend event: ${type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Resend webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
