import { NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { getRequiredSession, handleAuthError } from '@/lib/auth-helpers'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'

const resend = new Resend(process.env.RESEND_API_KEY)

const createCampaignSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  type: z.enum(['EMAIL_BLAST', 'DRIP', 'NEWSLETTER', 'PRODUCT_UPDATE', 'EVENT']).default('EMAIL_BLAST'),
  templateId: z.string().min(1, 'Template is required'),
  leadIds: z.array(z.string()).min(1, 'At least one lead is required'),
  sendNow: z.boolean().default(false),
})

// GET /api/campaigns - List campaigns
export async function GET() {
  try {
    const session = await getRequiredSession()
    const orgId = (session.user as any).organizationId

    const campaigns = await prisma.campaign.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
      include: {
        emails: {
          select: { id: true, status: true },
        },
      },
    })

    const data = campaigns.map((c) => ({
      ...c,
      totalSent: c.emails.filter((e) => e.status !== 'DRAFT').length,
      emails: undefined,
    }))

    return NextResponse.json({ data })
  } catch (error) {
    try { return handleAuthError(error) } catch {}
    console.error('Error fetching campaigns:', error)
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 })
  }
}

// POST /api/campaigns - Create and optionally send a campaign
export async function POST(request: Request) {
  try {
    const session = await getRequiredSession()
    const orgId = (session.user as any).organizationId
    const userId = (session.user as any).id

    const body = await request.json()
    const { name, description, type, templateId, leadIds, sendNow } = createCampaignSchema.parse(body)

    // Verify template belongs to this org
    const template = await prisma.emailTemplate.findFirst({
      where: { id: templateId, organizationId: orgId },
    })
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Verify leads belong to this org
    const leads = await prisma.lead.findMany({
      where: { id: { in: leadIds }, organizationId: orgId },
      select: { id: true, email: true, firstName: true, lastName: true, company: true },
    })
    if (leads.length === 0) {
      return NextResponse.json({ error: 'No valid leads found' }, { status: 404 })
    }

    // Create campaign
    const campaign = await prisma.campaign.create({
      data: {
        name,
        description,
        type,
        status: sendNow ? 'ACTIVE' : 'DRAFT',
        startDate: sendNow ? new Date() : null,
        organizationId: orgId,
        settings: { templateId },
      },
    })

    if (sendNow) {
      const fromAddress = process.env.EMAIL_FROM || 'noreply@meraki.app'
      let sentCount = 0

      for (const lead of leads) {
        try {
          // Personalize template
          let subject = template.subject
          let emailBody = template.body
          const vars: Record<string, string> = {
            firstName: lead.firstName || '',
            lastName: lead.lastName || '',
            email: lead.email,
            company: lead.company || '',
            name: [lead.firstName, lead.lastName].filter(Boolean).join(' ') || 'there',
          }
          for (const [key, val] of Object.entries(vars)) {
            subject = subject.replace(new RegExp(`{{${key}}}`, 'gi'), val)
            emailBody = emailBody.replace(new RegExp(`{{${key}}}`, 'gi'), val)
          }

          const { error: sendError } = await resend.emails.send({
            from: fromAddress,
            to: lead.email,
            subject,
            html: emailBody.replace(/\n/g, '<br>'),
          })

          const emailStatus = sendError ? 'FAILED' : 'SENT'

          await prisma.email.create({
            data: {
              subject,
              body: emailBody,
              status: emailStatus,
              sentAt: sendError ? null : new Date(),
              leadId: lead.id,
              senderId: userId,
              campaignId: campaign.id,
              templateId: template.id,
            },
          })

          if (!sendError) {
            sentCount++
            await prisma.activity.create({
              data: {
                type: 'EMAIL_SENT',
                title: `Campaign email sent: ${name}`,
                description: `Email "${subject}" sent to ${lead.email}`,
                leadId: lead.id,
                userId,
              },
            })

            await prisma.lead.update({
              where: { id: lead.id },
              data: { lastContactedAt: new Date() },
            })
          }
        } catch {
          // individual send failure, continue
        }
      }

      // Update campaign stats
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: {
          totalSent: sentCount,
          status: 'COMPLETED',
          endDate: new Date(),
        },
      })

      return NextResponse.json({
        data: campaign,
        message: `Campaign sent to ${sentCount} of ${leads.length} leads`,
      }, { status: 201 })
    }

    return NextResponse.json({
      data: campaign,
      message: 'Campaign created as draft',
    }, { status: 201 })
  } catch (error) {
    try { return handleAuthError(error) } catch {}
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 })
    }
    console.error('Error creating campaign:', error)
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 })
  }
}
