import { NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { getRequiredSession, handleAuthError } from '@/lib/auth-helpers'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'

const resend = new Resend(process.env.RESEND_API_KEY)

const sendEmailSchema = z.object({
  leadIds: z.array(z.string()).min(1, 'At least one lead is required'),
  subject: z.string().min(1, 'Subject is required'),
  body: z.string().min(1, 'Body is required'),
})

// POST /api/emails/send - Send email to one or more leads
export async function POST(request: Request) {
  try {
    const session = await getRequiredSession()
    const orgId = (session.user as any).organizationId
    const userId = (session.user as any).id

    const rawBody = await request.json()
    const { leadIds, subject, body } = sendEmailSchema.parse(rawBody)

    // Fetch leads that belong to this org
    const leads = await prisma.lead.findMany({
      where: {
        id: { in: leadIds },
        organizationId: orgId,
      },
      select: { id: true, email: true, firstName: true, lastName: true },
    })

    if (leads.length === 0) {
      return NextResponse.json(
        { error: 'No valid leads found' },
        { status: 404 }
      )
    }

    const fromAddress = process.env.EMAIL_FROM || 'noreply@meraki.app'
    const results: { leadId: string; success: boolean; error?: string }[] = []

    for (const lead of leads) {
      try {
        const { error: sendError } = await resend.emails.send({
          from: fromAddress,
          to: lead.email,
          subject,
          html: body.replace(/\n/g, '<br>'),
        })

        if (sendError) {
          results.push({ leadId: lead.id, success: false, error: sendError.message })
          continue
        }

        // Create Email record
        await prisma.email.create({
          data: {
            subject,
            body,
            status: 'SENT',
            sentAt: new Date(),
            leadId: lead.id,
            senderId: userId,
          },
        })

        // Log activity
        await prisma.activity.create({
          data: {
            type: 'EMAIL_SENT',
            title: `Email sent: ${subject}`,
            description: `Email sent to ${lead.firstName || ''} ${lead.lastName || ''} (${lead.email})`,
            leadId: lead.id,
            userId,
          },
        })

        // Update lastContactedAt
        await prisma.lead.update({
          where: { id: lead.id },
          data: { lastContactedAt: new Date() },
        })

        results.push({ leadId: lead.id, success: true })
      } catch (err) {
        results.push({
          leadId: lead.id,
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        })
      }
    }

    const successCount = results.filter((r) => r.success).length
    const failCount = results.filter((r) => !r.success).length

    return NextResponse.json({
      message: `Sent ${successCount} email(s)${failCount > 0 ? `, ${failCount} failed` : ''}`,
      results,
    })
  } catch (error) {
    try {
      return handleAuthError(error)
    } catch {}
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error sending email:', error)
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    )
  }
}
