import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getRequiredSession, handleAuthError } from '@/lib/auth-helpers'

export const dynamic = 'force-dynamic'

// GET /api/linkedin â€” LinkedIn outreach overview
// Returns: stats, recent LinkedIn activities, leads with LinkedIn profiles
export async function GET(request: Request) {
  try {
    const session = await getRequiredSession()
    const orgId = (session.user as any).organizationId

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') ?? '1')
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100)
    const skip = (page - 1) * limit

    // Leads with LinkedIn profiles
    const [leadsWithLinkedin, totalLeadsWithLinkedin] = await Promise.all([
      prisma.lead.findMany({
        where: {
          organizationId: orgId,
          linkedinUrl: { not: null },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          company: true,
          jobTitle: true,
          linkedinUrl: true,
          status: true,
          score: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      prisma.lead.count({
        where: { organizationId: orgId, linkedinUrl: { not: null } },
      }),
    ])

    // LinkedIn activity feed
    const linkedinActivities = await prisma.activity.findMany({
      where: {
        lead: { organizationId: orgId },
        type: { in: ['LINKEDIN_CONNECT', 'LINKEDIN_MESSAGE', 'LINKEDIN_VIEW'] },
      },
      include: {
        lead: { select: { id: true, firstName: true, lastName: true, company: true } },
        user: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    // Stats
    const [connectCount, messageCount, viewCount, totalLeads] = await Promise.all([
      prisma.activity.count({ where: { lead: { organizationId: orgId }, type: 'LINKEDIN_CONNECT' } }),
      prisma.activity.count({ where: { lead: { organizationId: orgId }, type: 'LINKEDIN_MESSAGE' } }),
      prisma.activity.count({ where: { lead: { organizationId: orgId }, type: 'LINKEDIN_VIEW' } }),
      prisma.lead.count({ where: { organizationId: orgId } }),
    ])

    // Sequence steps with LinkedIn type (for task tracking)
    const linkedinTasks = await prisma.activity.findMany({
      where: {
        lead: { organizationId: orgId },
        type: 'LINKEDIN_CONNECT',
      },
      select: { id: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 1,
    })

    const lastActivityAt = linkedinActivities[0]?.createdAt ?? null

    return NextResponse.json({
      stats: {
        leadsWithProfiles: totalLeadsWithLinkedin,
        totalLeads,
        profileCoverage: totalLeads > 0 ? Math.round((totalLeadsWithLinkedin / totalLeads) * 100) : 0,
        connectionsSent: connectCount,
        messagesSent: messageCount,
        profileViews: viewCount,
        totalActivities: connectCount + messageCount + viewCount,
        lastActivityAt: lastActivityAt?.toISOString() ?? null,
      },
      leads: leadsWithLinkedin.map((l) => ({
        ...l,
        createdAt: l.createdAt.toISOString(),
      })),
      totalLeads: totalLeadsWithLinkedin,
      activities: linkedinActivities.map((a) => ({
        id: a.id,
        type: a.type,
        title: a.title,
        description: a.description,
        createdAt: a.createdAt.toISOString(),
        lead: a.lead,
        user: a.user,
      })),
    })
  } catch (error) {
    try { return handleAuthError(error) } catch {}
    console.error('Error fetching LinkedIn data:', error)
    return NextResponse.json({ error: 'Failed to fetch LinkedIn data' }, { status: 500 })
  }
}

// POST /api/linkedin â€” Log a LinkedIn activity manually
export async function POST(request: Request) {
  try {
    const session = await getRequiredSession()
    const orgId = (session.user as any).organizationId
    const userId = (session.user as any).id

    const { leadId, type, message } = await request.json()

    if (!leadId || !type) {
      return NextResponse.json({ error: 'leadId and type required' }, { status: 400 })
    }

    const validTypes = ['LINKEDIN_CONNECT', 'LINKEDIN_MESSAGE', 'LINKEDIN_VIEW']
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid activity type' }, { status: 400 })
    }

    // Verify lead belongs to org
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, organizationId: orgId },
      select: { id: true, firstName: true, lastName: true },
    })
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    const typeLabels: Record<string, string> = {
      LINKEDIN_CONNECT: 'Connection request sent',
      LINKEDIN_MESSAGE: 'LinkedIn message sent',
      LINKEDIN_VIEW: 'Profile viewed on LinkedIn',
    }

    const activity = await prisma.activity.create({
      data: {
        type,
        title: typeLabels[type],
        description: message ?? null,
        leadId,
        userId,
      },
    })

    return NextResponse.json({ data: activity, message: 'Activity logged' }, { status: 201 })
  } catch (error) {
    try { return handleAuthError(error) } catch {}
    console.error('Error logging LinkedIn activity:', error)
    return NextResponse.json({ error: 'Failed to log activity' }, { status: 500 })
  }
}
