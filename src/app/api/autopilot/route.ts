import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getRequiredSession, handleAuthError } from '@/lib/auth-helpers'

export const dynamic = 'force-dynamic'

const createSchema = z.object({
  name: z.string().min(1),
  goal: z.string().min(10, 'Goal must be at least 10 characters'),
  context: z.string().min(10, 'Context must be at least 10 characters'),
  targetAudience: z.string().optional(),
  tone: z.enum(['formal', 'casual', 'friendly', 'professional', 'founder-to-founder', 'recruiter', 'executive']).default('professional'),
  maxEmails: z.number().min(1).max(20).default(7),
  dailyLimit: z.number().min(1).max(500).default(50),
  sendWindowStart: z.number().min(0).max(23).nullable().default(9),
  sendWindowEnd: z.number().min(0).max(23).nullable().default(17),
  sendTimezone: z.string().default('America/New_York'),
  sendDays: z.array(z.number().min(0).max(6)).default([1, 2, 3, 4, 5]),
  leadIds: z.array(z.string()).optional(), // Specific leads to target, or empty = all eligible leads
})

// GET /api/autopilot â€” List AI campaigns
export async function GET(request: Request) {
  try {
    const session = await getRequiredSession()
    const orgId = (session.user as any).organizationId

    const campaigns = await prisma.aiCampaign.findMany({
      where: { organizationId: orgId },
      include: {
        outreaches: {
          select: { id: true, status: true, totalSent: true, totalOpened: true, totalReplied: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const data = campaigns.map((c) => ({
      id: c.id,
      name: c.name,
      goal: c.goal,
      context: c.context,
      targetAudience: c.targetAudience,
      tone: c.tone,
      maxEmails: c.maxEmails,
      dailyLimit: c.dailyLimit,
      status: c.status,
      learnings: c.learnings,
      sendWindowStart: c.sendWindowStart,
      sendWindowEnd: c.sendWindowEnd,
      sendTimezone: c.sendTimezone,
      sendDays: c.sendDays,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      stats: {
        totalLeads: c.outreaches.length,
        activeLeads: c.outreaches.filter((o) => o.status === 'ACTIVE' || o.status === 'PENDING').length,
        stoppedLeads: c.outreaches.filter((o) => o.status === 'STOPPED' || o.status === 'COMPLETED').length,
        totalSent: c.outreaches.reduce((s, o) => s + o.totalSent, 0),
        totalOpened: c.outreaches.reduce((s, o) => s + o.totalOpened, 0),
        totalReplied: c.outreaches.reduce((s, o) => s + o.totalReplied, 0),
      },
    }))

    return NextResponse.json({ data })
  } catch (error) {
    try { return handleAuthError(error) } catch {}
    console.error('Error fetching AI campaigns:', error)
    return NextResponse.json({ error: 'Failed to fetch AI campaigns' }, { status: 500 })
  }
}

// POST /api/autopilot â€” Create AI campaign + enroll leads
export async function POST(request: Request) {
  try {
    const session = await getRequiredSession()
    const orgId = (session.user as any).organizationId

    const body = await request.json()
    const data = createSchema.parse(body)

    // Create the AI campaign
    const campaign = await prisma.aiCampaign.create({
      data: {
        name: data.name,
        goal: data.goal,
        context: data.context,
        targetAudience: data.targetAudience,
        tone: data.tone,
        maxEmails: data.maxEmails,
        dailyLimit: data.dailyLimit,
        sendWindowStart: data.sendWindowStart,
        sendWindowEnd: data.sendWindowEnd,
        sendTimezone: data.sendTimezone,
        sendDays: data.sendDays,
        organizationId: orgId,
        learnings: {
          totalSent: 0,
          totalOpened: 0,
          totalReplied: 0,
          totalBounced: 0,
          bestSubjects: [],
          bestAngles: [],
          avoidAngles: [],
        },
      },
    })

    // Enroll leads
    let enrolledCount = 0
    if (data.leadIds && data.leadIds.length > 0) {
      // Specific leads
      const leads = await prisma.lead.findMany({
        where: {
          id: { in: data.leadIds },
          organizationId: orgId,
          doNotContact: false,
          status: { notIn: ['UNSUBSCRIBED', 'WON', 'LOST'] },
        },
        select: { id: true },
      })
      if (leads.length > 0) {
        await prisma.aiOutreach.createMany({
          data: leads.map((l) => ({
            leadId: l.id,
            aiCampaignId: campaign.id,
            status: 'PENDING',
            nextActionAt: new Date(),
          })),
          skipDuplicates: true,
        })
        enrolledCount = leads.length
      }
    } else {
      // All eligible leads
      const leads = await prisma.lead.findMany({
        where: {
          organizationId: orgId,
          doNotContact: false,
          status: { notIn: ['UNSUBSCRIBED', 'WON', 'LOST'] },
        },
        select: { id: true },
      })
      if (leads.length > 0) {
        await prisma.aiOutreach.createMany({
          data: leads.map((l) => ({
            leadId: l.id,
            aiCampaignId: campaign.id,
            status: 'PENDING',
            nextActionAt: new Date(),
          })),
          skipDuplicates: true,
        })
        enrolledCount = leads.length
      }
    }

    return NextResponse.json(
      { data: campaign, message: `AI Autopilot created â€” ${enrolledCount} leads enrolled` },
      { status: 201 },
    )
  } catch (error) {
    try { return handleAuthError(error) } catch {}
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
    }
    console.error('Error creating AI campaign:', error)
    return NextResponse.json({ error: 'Failed to create AI campaign' }, { status: 500 })
  }
}

// PATCH /api/autopilot â€” Pause / Resume / Stop
export async function PATCH(request: Request) {
  try {
    const session = await getRequiredSession()
    const orgId = (session.user as any).organizationId

    const { id, status } = await request.json()
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const campaign = await prisma.aiCampaign.findFirst({
      where: { id, organizationId: orgId },
    })
    if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })

    await prisma.aiCampaign.update({
      where: { id },
      data: { status },
    })

    return NextResponse.json({ message: `Campaign ${status.toLowerCase()}` })
  } catch (error) {
    try { return handleAuthError(error) } catch {}
    console.error('Error updating AI campaign:', error)
    return NextResponse.json({ error: 'Failed to update campaign' }, { status: 500 })
  }
}

// DELETE /api/autopilot â€” Delete campaign
export async function DELETE(request: Request) {
  try {
    const session = await getRequiredSession()
    const orgId = (session.user as any).organizationId

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const campaign = await prisma.aiCampaign.findFirst({
      where: { id, organizationId: orgId },
    })
    if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })

    await prisma.$transaction([
      prisma.aiOutreach.deleteMany({ where: { aiCampaignId: id } }),
      prisma.aiCampaign.delete({ where: { id } }),
    ])

    return NextResponse.json({ message: 'AI Campaign deleted' })
  } catch (error) {
    try { return handleAuthError(error) } catch {}
    console.error('Error deleting AI campaign:', error)
    return NextResponse.json({ error: 'Failed to delete campaign' }, { status: 500 })
  }
}
