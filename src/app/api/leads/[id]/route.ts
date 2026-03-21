import { NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { getRequiredSession, handleAuthError } from '@/lib/auth-helpers'

const updateLeadSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  company: z.string().optional(),
  jobTitle: z.string().optional(),
  phone: z.string().optional(),
  linkedinUrl: z.string().url().optional().nullable(),
  website: z.string().url().optional().nullable(),
  status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST', 'UNSUBSCRIBED']).optional(),
  score: z.number().min(0).max(100).optional(),
  stage: z.enum(['AWARENESS', 'INTEREST', 'CONSIDERATION', 'INTENT', 'EVALUATION', 'PURCHASE']).optional(),
  source: z.enum(['MANUAL', 'LINKEDIN', 'WEBSITE_FORM', 'EMAIL_CAMPAIGN', 'REFERRAL', 'COLD_OUTREACH', 'INBOUND', 'EVENT', 'API']).optional(),
  tags: z.array(z.string()).optional(),
  customFields: z.record(z.string(), z.any()).optional(),
  assignedToId: z.string().optional().nullable(),
})

// GET /api/leads/[id]
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getRequiredSession()
    const orgId = (session.user as any).organizationId

    const lead = await prisma.lead.findFirst({
      where: { id: params.id, organizationId: orgId },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        activities: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    })

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    return NextResponse.json({ data: lead })
  } catch (error) {
    try { return handleAuthError(error) } catch {}
    console.error('Error fetching lead:', error)
    return NextResponse.json({ error: 'Failed to fetch lead' }, { status: 500 })
  }
}

// PUT /api/leads/[id]
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getRequiredSession()
    const orgId = (session.user as any).organizationId
    const userId = (session.user as any).id

    const existing = await prisma.lead.findFirst({
      where: { id: params.id, organizationId: orgId },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    const body = await request.json()
    const validatedData = updateLeadSchema.parse(body)

    const lead = await prisma.lead.update({
      where: { id: params.id },
      data: validatedData,
    })

    // Log status change
    if (validatedData.status && validatedData.status !== existing.status) {
      await prisma.activity.create({
        data: {
          type: 'STATUS_CHANGED',
          title: `Status changed to ${validatedData.status}`,
          description: `Status changed from ${existing.status} to ${validatedData.status}`,
          leadId: lead.id,
          userId,
        },
      })
    }

    return NextResponse.json({ data: lead })
  } catch (error) {
    try { return handleAuthError(error) } catch {}
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 })
    }
    console.error('Error updating lead:', error)
    return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 })
  }
}

// DELETE /api/leads/[id]
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getRequiredSession()
    const orgId = (session.user as any).organizationId

    const existing = await prisma.lead.findFirst({
      where: { id: params.id, organizationId: orgId },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    await prisma.lead.delete({ where: { id: params.id } })

    return NextResponse.json({ message: 'Lead deleted successfully' })
  } catch (error) {
    try { return handleAuthError(error) } catch {}
    console.error('Error deleting lead:', error)
    return NextResponse.json({ error: 'Failed to delete lead' }, { status: 500 })
  }
}
