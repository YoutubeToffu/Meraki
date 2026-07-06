import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getRequiredSession, handleAuthError } from '@/lib/auth-helpers'

// GET /api/agent-logs
// Returns: recent agent actions, upcoming scheduled actions, sequence next steps
export async function GET(_request: Request) {
  try {
    const session = await getRequiredSession()
    const orgId = (session.user as any).organizationId
    const now = new Date()

    // ── Recent agent actions (last 50 from Activity table) ────────────────────
    const recentActivities = await prisma.activity.findMany({
      where: {
        lead: { organizationId: orgId },
        type: {
          in: ['EMAIL_SENT', 'EMAIL_OPENED', 'EMAIL_CLICKED', 'EMAIL_REPLIED',
               'LINKEDIN_CONNECT', 'LINKEDIN_MESSAGE', 'MEETING_SCHEDULED',
               'MEETING_COMPLETED', 'STATUS_CHANGED', 'STAGE_CHANGED'],
        },
      },
      include: {
        lead: { select: { id: true, firstName: true, lastName: true, email: true, company: true } },
        user: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    // ── Upcoming AI outreach actions ──────────────────────────────────────────
    const upcomingOutreaches = await prisma.aiOutreach.findMany({
      where: {
        aiCampaign: { organizationId: orgId },
        status: { in: ['PENDING', 'ACTIVE'] },
        nextActionAt: { gte: now, lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) },
      },
      include: {
        aiCampaign: { select: { id: true, name: true } },
      },
      orderBy: { nextActionAt: 'asc' },
      take: 20,
    })

    // Fetch leads for outreaches separately
    const outreachLeadIds = Array.from(new Set(upcomingOutreaches.map((o) => o.leadId)))
    const outreachLeads = await prisma.lead.findMany({
      where: { id: { in: outreachLeadIds } },
      select: { id: true, firstName: true, lastName: true, email: true, company: true },
    })
    const outreachLeadMap = Object.fromEntries(outreachLeads.map((l) => [l.id, l]))

    // ── Upcoming sequence steps ───────────────────────────────────────────────
    const upcomingSequenceSteps = await prisma.sequenceEnrollment.findMany({
      where: {
        sequence: { organizationId: orgId },
        status: 'ACTIVE',
        nextStepAt: { gte: now, lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) },
      },
      include: {
        lead: { select: { id: true, firstName: true, lastName: true, email: true, company: true } },
        sequence: {
          select: {
            id: true, name: true,
            steps: { orderBy: { order: 'asc' } },
          },
        },
      },
      orderBy: { nextStepAt: 'asc' },
      take: 20,
    })

    // ── Currently overdue (should have run but hasn't yet) ────────────────────
    const overdueOutreaches = await prisma.aiOutreach.count({
      where: {
        aiCampaign: { organizationId: orgId },
        status: { in: ['PENDING', 'ACTIVE'] },
        nextActionAt: { lt: now },
      },
    })

    // ── Aggregate stats for last 24h ──────────────────────────────────────────
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const stats24h = await prisma.activity.groupBy({
      by: ['type'],
      where: {
        lead: { organizationId: orgId },
        createdAt: { gte: last24h },
        type: { in: ['EMAIL_SENT', 'EMAIL_OPENED', 'EMAIL_REPLIED', 'EMAIL_CLICKED'] },
      },
      _count: { type: true },
    })

    const statsMap: Record<string, number> = {}
    for (const s of stats24h) {
      statsMap[s.type] = s._count.type
    }

    return NextResponse.json({
      recent: recentActivities.map((a) => ({
        id: a.id,
        type: a.type,
        title: a.title,
        description: a.description,
        createdAt: a.createdAt.toISOString(),
        lead: a.lead,
        user: a.user,
        isAgentAction: a.title.startsWith('AI Autopilot:') || a.description?.includes('Campaign') || false,
      })),
      upcoming: [
        ...upcomingOutreaches.map((o) => ({
          id: o.id,
          type: 'AI_EMAIL',
          label: `AI email (step ${o.stepNumber + 1})`,
          campaignName: o.aiCampaign.name,
          lead: outreachLeadMap[o.leadId] ?? null,
          scheduledAt: o.nextActionAt!.toISOString(),
        })),
        ...upcomingSequenceSteps.map((e) => {
          const nextStep = e.sequence.steps[e.currentStep]
          return {
            id: e.id,
            type: 'SEQUENCE_STEP',
            label: nextStep ? `${nextStep.type} step ${e.currentStep + 1}` : `Sequence step`,
            campaignName: e.sequence.name,
            lead: e.lead,
            scheduledAt: e.nextStepAt!.toISOString(),
          }
        }),
      ].sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()),
      overdueCount: overdueOutreaches,
      stats24h: {
        emailsSent: statsMap['EMAIL_SENT'] ?? 0,
        emailsOpened: statsMap['EMAIL_OPENED'] ?? 0,
        emailsReplied: statsMap['EMAIL_REPLIED'] ?? 0,
        emailsClicked: statsMap['EMAIL_CLICKED'] ?? 0,
      },
    })
  } catch (error) {
    try { return handleAuthError(error) } catch {}
    console.error('[agent-logs] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch agent logs' }, { status: 500 })
  }
}
