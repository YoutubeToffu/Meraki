import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getRequiredSession, handleAuthError } from '@/lib/auth-helpers'

const createSchema = z.object({
  leadId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['CALL', 'VIDEO_CALL', 'IN_PERSON', 'DEMO']).default('DEMO'),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  timezone: z.string().default('America/New_York'),
  meetingUrl: z.string().url().optional().nullable(),
  notes: z.string().optional().nullable(),
})

const updateSchema = z.object({
  id: z.string().min(1),
  status: z.enum(['SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).optional(),
  outcome: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  meetingUrl: z.string().url().optional().nullable(),
})

// GET /api/meetings — List meetings for org
export async function GET(request: Request) {
  try {
    const session = await getRequiredSession()
    const orgId = (session.user as any).organizationId
    const userId = (session.user as any).id

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const upcoming = searchParams.get('upcoming')

    const where: any = {
      lead: { organizationId: orgId },
    }
    if (status) where.status = status.toUpperCase()
    if (upcoming === 'true') {
      where.startTime = { gte: new Date() }
      where.status = { in: ['SCHEDULED', 'CONFIRMED'] }
    }

    const meetings = await prisma.meeting.findMany({
      where,
      include: {
        lead: { select: { id: true, firstName: true, lastName: true, email: true, company: true, jobTitle: true } },
        host: { select: { id: true, name: true, email: true, avatar: true } },
      },
      orderBy: { startTime: 'asc' },
      take: 200,
    })

    const now = new Date()
    const upcoming7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    const stats = {
      total: meetings.length,
      upcoming: meetings.filter((m) => m.startTime >= now && ['SCHEDULED', 'CONFIRMED'].includes(m.status)).length,
      thisWeek: meetings.filter((m) => m.startTime >= now && m.startTime <= upcoming7Days).length,
      completed: meetings.filter((m) => m.status === 'COMPLETED').length,
      cancelled: meetings.filter((m) => m.status === 'CANCELLED').length,
      noShow: meetings.filter((m) => m.status === 'NO_SHOW').length,
    }

    return NextResponse.json({
      data: meetings.map((m) => ({
        id: m.id,
        title: m.title,
        description: m.description,
        type: m.type,
        status: m.status,
        startTime: m.startTime.toISOString(),
        endTime: m.endTime.toISOString(),
        timezone: m.timezone,
        meetingUrl: m.meetingUrl,
        outcome: m.outcome,
        notes: m.notes,
        createdAt: m.createdAt.toISOString(),
        lead: m.lead,
        host: m.host,
      })),
      stats,
    })
  } catch (error) {
    try { return handleAuthError(error) } catch {}
    console.error('Error fetching meetings:', error)
    return NextResponse.json({ error: 'Failed to fetch meetings' }, { status: 500 })
  }
}

// POST /api/meetings — Create meeting
export async function POST(request: Request) {
  try {
    const session = await getRequiredSession()
    const orgId = (session.user as any).organizationId
    const userId = (session.user as any).id

    const body = await request.json()
    const data = createSchema.parse(body)

    // Verify lead belongs to org
    const lead = await prisma.lead.findFirst({
      where: { id: data.leadId, organizationId: orgId },
    })
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    const meeting = await prisma.meeting.create({
      data: {
        title: data.title,
        description: data.description,
        type: data.type,
        status: 'SCHEDULED',
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        timezone: data.timezone,
        meetingUrl: data.meetingUrl ?? null,
        notes: data.notes ?? null,
        leadId: data.leadId,
        hostId: userId,
      },
      include: {
        lead: { select: { id: true, firstName: true, lastName: true, email: true, company: true } },
        host: { select: { id: true, name: true, email: true } },
      },
    })

    // Log activity
    await prisma.activity.create({
      data: {
        type: 'MEETING_SCHEDULED',
        title: `Meeting scheduled: ${data.title}`,
        description: `${data.type.replace('_', ' ')} on ${new Date(data.startTime).toLocaleDateString()}`,
        leadId: data.leadId,
        userId,
      },
    })

    return NextResponse.json({ data: meeting, message: 'Meeting scheduled' }, { status: 201 })
  } catch (error) {
    try { return handleAuthError(error) } catch {}
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
    }
    console.error('Error creating meeting:', error)
    return NextResponse.json({ error: 'Failed to create meeting' }, { status: 500 })
  }
}

// PATCH /api/meetings — Update meeting status / outcome / notes
export async function PATCH(request: Request) {
  try {
    const session = await getRequiredSession()
    const orgId = (session.user as any).organizationId
    const userId = (session.user as any).id

    const body = await request.json()
    const data = updateSchema.parse(body)

    // Verify ownership via lead's org
    const meeting = await prisma.meeting.findFirst({
      where: { id: data.id, lead: { organizationId: orgId } },
    })
    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })
    }

    const updated = await prisma.meeting.update({
      where: { id: data.id },
      data: {
        ...(data.status && { status: data.status }),
        ...(data.outcome !== undefined && { outcome: data.outcome }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.meetingUrl !== undefined && { meetingUrl: data.meetingUrl }),
      },
    })

    // Log completion/cancellation
    if (data.status === 'COMPLETED' || data.status === 'NO_SHOW' || data.status === 'CANCELLED') {
      const activityType = data.status === 'COMPLETED' ? 'MEETING_COMPLETED' : 'STATUS_CHANGED'
      await prisma.activity.create({
        data: {
          type: activityType,
          title: `Meeting ${data.status.toLowerCase().replace('_', '-')}: ${meeting.title}`,
          description: data.outcome ?? undefined,
          leadId: meeting.leadId,
          userId,
        },
      }).catch(() => {}) // non-critical
    }

    return NextResponse.json({ data: updated, message: 'Meeting updated' })
  } catch (error) {
    try { return handleAuthError(error) } catch {}
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
    }
    console.error('Error updating meeting:', error)
    return NextResponse.json({ error: 'Failed to update meeting' }, { status: 500 })
  }
}

// DELETE /api/meetings — Delete meeting
export async function DELETE(request: Request) {
  try {
    const session = await getRequiredSession()
    const orgId = (session.user as any).organizationId

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const meeting = await prisma.meeting.findFirst({
      where: { id, lead: { organizationId: orgId } },
    })
    if (!meeting) return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })

    await prisma.meeting.delete({ where: { id } })

    return NextResponse.json({ message: 'Meeting deleted' })
  } catch (error) {
    try { return handleAuthError(error) } catch {}
    console.error('Error deleting meeting:', error)
    return NextResponse.json({ error: 'Failed to delete meeting' }, { status: 500 })
  }
}
