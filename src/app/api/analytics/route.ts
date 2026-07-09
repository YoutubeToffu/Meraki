import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getRequiredSession, handleAuthError } from '@/lib/auth-helpers'

export const dynamic = 'force-dynamic'

// GET /api/analytics â€” Real-time analytics from database
export async function GET() {
  try {
    const session = await getRequiredSession()
    const orgId = (session.user as any).organizationId
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

    // === KEY METRICS (current 30 days vs previous 30 days) ===
    const [
      totalLeads,
      previousLeads,
      currentEmails,
      previousEmails,
      currentMeetings,
      previousMeetings,
    ] = await Promise.all([
      prisma.lead.count({
        where: { organizationId: orgId, createdAt: { gte: thirtyDaysAgo } },
      }),
      prisma.lead.count({
        where: { organizationId: orgId, createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
      }),
      prisma.email.count({
        where: {
          lead: { organizationId: orgId },
          sentAt: { gte: thirtyDaysAgo },
          status: { not: 'DRAFT' },
        },
      }),
      prisma.email.count({
        where: {
          lead: { organizationId: orgId },
          sentAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
          status: { not: 'DRAFT' },
        },
      }),
      prisma.meeting.count({
        where: {
          lead: { organizationId: orgId },
          startTime: { gte: thirtyDaysAgo },
        },
      }),
      prisma.meeting.count({
        where: {
          lead: { organizationId: orgId },
          startTime: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
        },
      }),
    ])

    // Email engagement metrics
    const [emailsOpened, emailsClicked, emailsReplied, emailsBounced] = await Promise.all([
      prisma.email.count({
        where: { lead: { organizationId: orgId }, sentAt: { gte: thirtyDaysAgo }, openedAt: { not: null } },
      }),
      prisma.email.count({
        where: { lead: { organizationId: orgId }, sentAt: { gte: thirtyDaysAgo }, clickedAt: { not: null } },
      }),
      prisma.email.count({
        where: { lead: { organizationId: orgId }, sentAt: { gte: thirtyDaysAgo }, repliedAt: { not: null } },
      }),
      prisma.email.count({
        where: { lead: { organizationId: orgId }, sentAt: { gte: thirtyDaysAgo }, bouncedAt: { not: null } },
      }),
    ])

    const openRate = currentEmails > 0 ? Math.round((emailsOpened / currentEmails) * 1000) / 10 : 0
    const replyRate = currentEmails > 0 ? Math.round((emailsReplied / currentEmails) * 1000) / 10 : 0
    const clickRate = currentEmails > 0 ? Math.round((emailsClicked / currentEmails) * 1000) / 10 : 0
    const bounceRate = currentEmails > 0 ? Math.round((emailsBounced / currentEmails) * 1000) / 10 : 0

    // Conversion rate (leads that moved to WON)
    const wonLeads = await prisma.lead.count({
      where: { organizationId: orgId, status: 'WON', updatedAt: { gte: thirtyDaysAgo } },
    })
    const allLeadsTotal = await prisma.lead.count({ where: { organizationId: orgId } })
    const conversionRate = allLeadsTotal > 0 ? Math.round((wonLeads / allLeadsTotal) * 1000) / 10 : 0

    const pctChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0
      return Math.round(((current - previous) / previous) * 1000) / 10
    }

    // === LEAD SOURCE BREAKDOWN ===
    const leadsBySource = await prisma.lead.groupBy({
      by: ['source'],
      where: { organizationId: orgId },
      _count: { id: true },
    })

    const sourceMap: Record<string, string> = {
      MANUAL: 'Manual Entry',
      LINKEDIN: 'LinkedIn',
      WEBSITE_FORM: 'Website Forms',
      EMAIL_CAMPAIGN: 'Email Campaigns',
      REFERRAL: 'Referrals',
      COLD_OUTREACH: 'Cold Outreach',
      INBOUND: 'Inbound',
      EVENT: 'Events',
      API: 'API',
    }

    const channelPerformance = leadsBySource.map((s) => ({
      channel: sourceMap[s.source] || s.source,
      leads: s._count.id,
    })).sort((a, b) => b.leads - a.leads)

    // === SEQUENCE PERFORMANCE ===
    const sequences = await prisma.sequence.findMany({
      where: { organizationId: orgId },
      select: {
        id: true,
        name: true,
        enrollments: {
          select: { status: true },
        },
      },
    })

    const sequencePerformance = sequences.map((seq) => {
      const enrolled = seq.enrollments.length
      const completed = seq.enrollments.filter((e) => e.status === 'COMPLETED').length
      return {
        name: seq.name,
        enrolled,
        completed,
        completionRate: enrolled > 0 ? Math.round((completed / enrolled) * 100) : 0,
      }
    }).filter((s) => s.enrolled > 0).sort((a, b) => b.enrolled - a.enrolled)

    // === MONTHLY LEAD TREND (last 6 months) ===
    const monthlyTrend: { month: string; value: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
      const count = await prisma.lead.count({
        where: { organizationId: orgId, createdAt: { gte: start, lt: end } },
      })
      monthlyTrend.push({
        month: start.toLocaleString('en-US', { month: 'short' }),
        value: count,
      })
    }

    // === PIPELINE SUMMARY ===
    const pipeline = await prisma.lead.groupBy({
      by: ['status'],
      where: { organizationId: orgId },
      _count: { id: true },
    })

    const pipelineSummary = pipeline.map((p) => ({
      status: p.status,
      count: p._count.id,
    }))

    return NextResponse.json({
      data: {
        keyMetrics: {
          totalLeads: { value: totalLeads, change: pctChange(totalLeads, previousLeads) },
          conversionRate: { value: conversionRate },
          openRate: { value: openRate },
          replyRate: { value: replyRate },
          clickRate: { value: clickRate },
          bounceRate: { value: bounceRate },
          emailsSent: { value: currentEmails, change: pctChange(currentEmails, previousEmails) },
          meetings: { value: currentMeetings, change: pctChange(currentMeetings, previousMeetings) },
        },
        channelPerformance,
        sequencePerformance,
        monthlyTrend,
        pipelineSummary,
      },
    })
  } catch (error) {
    try { return handleAuthError(error) } catch {}
    console.error('Analytics error:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
