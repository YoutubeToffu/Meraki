import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getRequiredSession, handleAuthError } from '@/lib/auth-helpers'

export const dynamic = 'force-dynamic'

// GET /api/analytics/best-time â€” Analyze email engagement data to find optimal send times
export async function GET() {
  try {
    const session = await getRequiredSession()
    const orgId = (session.user as any).organizationId

    // Get all sent emails with open/click/reply data for this org (last 90 days)
    const since = new Date()
    since.setDate(since.getDate() - 90)

    const emails = await prisma.email.findMany({
      where: {
        lead: { organizationId: orgId },
        sentAt: { not: null, gte: since },
        status: { not: 'DRAFT' },
      },
      select: {
        sentAt: true,
        openedAt: true,
        clickedAt: true,
        repliedAt: true,
      },
    })

    if (emails.length < 5) {
      return NextResponse.json({
        data: {
          recommendation: 'Not enough data yet. Send at least 5 emails to get recommendations.',
          hourlyBreakdown: [],
          dayBreakdown: [],
          bestHours: [],
          bestDays: [],
          totalAnalyzed: emails.length,
        },
      })
    }

    // Aggregate by hour (0-23)
    const hourBuckets: Record<number, { sent: number; opened: number; clicked: number; replied: number }> = {}
    for (let h = 0; h < 24; h++) {
      hourBuckets[h] = { sent: 0, opened: 0, clicked: 0, replied: 0 }
    }

    // Aggregate by day (0-6, Sun-Sat)
    const dayBuckets: Record<number, { sent: number; opened: number; clicked: number; replied: number }> = {}
    for (let d = 0; d < 7; d++) {
      dayBuckets[d] = { sent: 0, opened: 0, clicked: 0, replied: 0 }
    }

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

    for (const email of emails) {
      if (!email.sentAt) continue
      const hour = email.sentAt.getUTCHours()
      const day = email.sentAt.getUTCDay()

      hourBuckets[hour].sent++
      dayBuckets[day].sent++

      if (email.openedAt) {
        hourBuckets[hour].opened++
        dayBuckets[day].opened++
      }
      if (email.clickedAt) {
        hourBuckets[hour].clicked++
        dayBuckets[day].clicked++
      }
      if (email.repliedAt) {
        hourBuckets[hour].replied++
        dayBuckets[day].replied++
      }
    }

    // Calculate engagement score per hour: weighted (opens*1 + clicks*3 + replies*5) / sent
    const hourlyBreakdown = Object.entries(hourBuckets)
      .map(([h, data]) => ({
        hour: parseInt(h),
        label: `${parseInt(h).toString().padStart(2, '0')}:00`,
        ...data,
        openRate: data.sent > 0 ? Math.round((data.opened / data.sent) * 100) : 0,
        engagementScore: data.sent > 0
          ? Math.round(((data.opened * 1 + data.clicked * 3 + data.replied * 5) / data.sent) * 100)
          : 0,
      }))
      .sort((a, b) => b.engagementScore - a.engagementScore)

    const dayBreakdown = Object.entries(dayBuckets)
      .map(([d, data]) => ({
        day: parseInt(d),
        dayName: dayNames[parseInt(d)],
        ...data,
        openRate: data.sent > 0 ? Math.round((data.opened / data.sent) * 100) : 0,
        engagementScore: data.sent > 0
          ? Math.round(((data.opened * 1 + data.clicked * 3 + data.replied * 5) / data.sent) * 100)
          : 0,
      }))
      .sort((a, b) => b.engagementScore - a.engagementScore)

    // Top 3 hours and top 3 days with enough data (at least 3 sends)
    const bestHours = hourlyBreakdown
      .filter((h) => h.sent >= 3)
      .slice(0, 3)
      .map((h) => h.label)

    const bestDays = dayBreakdown
      .filter((d) => d.sent >= 3)
      .slice(0, 3)
      .map((d) => d.dayName)

    const recommendation = bestHours.length > 0
      ? `Based on ${emails.length} emails, your best send times are ${bestHours.join(', ')} UTC on ${bestDays.join(', ')}.`
      : 'Not enough send volume per time slot to make a recommendation. Keep sending!'

    return NextResponse.json({
      data: {
        recommendation,
        hourlyBreakdown: hourlyBreakdown.sort((a, b) => a.hour - b.hour),
        dayBreakdown: dayBreakdown.sort((a, b) => a.day - b.day),
        bestHours,
        bestDays,
        totalAnalyzed: emails.length,
      },
    })
  } catch (error) {
    try { return handleAuthError(error) } catch {}
    console.error('Error analyzing best time:', error)
    return NextResponse.json({ error: 'Failed to analyze send times' }, { status: 500 })
  }
}
