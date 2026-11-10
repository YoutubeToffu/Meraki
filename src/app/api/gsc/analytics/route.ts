import { NextRequest, NextResponse } from 'next/server'
import { getRequiredSession, handleAuthError } from '@/lib/auth-helpers'
import { GscNotConnectedError, GscRow, dateRanges, getAccessToken, searchAnalytics } from '@/lib/gsc'

export const dynamic = 'force-dynamic'

// Rough average CTR by position; used to flag pages/queries underperforming for their rank.
function expectedCtr(position: number) {
  if (position <= 1.5) return 0.28
  if (position <= 2.5) return 0.15
  if (position <= 3.5) return 0.10
  if (position <= 5.5) return 0.06
  if (position <= 10.5) return 0.025
  return 0.01
}

const pick = (r: GscRow) => ({
  key: r.keys?.[0] ?? '',
  clicks: r.clicks,
  impressions: r.impressions,
  ctr: r.ctr,
  position: r.position,
})

// GET /api/gsc/analytics?site=...&days=28
export async function GET(request: NextRequest) {
  try {
    const session = await getRequiredSession()
    const organizationId = (session.user as { organizationId?: string }).organizationId
    if (!organizationId) return NextResponse.json({ error: 'Organization not found' }, { status: 400 })

    const { searchParams } = new URL(request.url)
    const site = searchParams.get('site')
    if (!site) return NextResponse.json({ error: 'site is required' }, { status: 400 })
    const days = [7, 28, 90].includes(Number(searchParams.get('days'))) ? Number(searchParams.get('days')) : 28

    const token = await getAccessToken(organizationId)
    const { current, previous } = dateRanges(days)

    const [totals, prevTotals, byDate, queries, pages, prevPages, devices, countries] = await Promise.all([
      searchAnalytics(token, site, current),
      searchAnalytics(token, site, previous),
      searchAnalytics(token, site, { ...current, dimensions: ['date'], rowLimit: 100 }),
      searchAnalytics(token, site, { ...current, dimensions: ['query'], rowLimit: 250 }),
      searchAnalytics(token, site, { ...current, dimensions: ['page'], rowLimit: 250 }),
      searchAnalytics(token, site, { ...previous, dimensions: ['page'], rowLimit: 250 }),
      searchAnalytics(token, site, { ...current, dimensions: ['device'] }),
      searchAnalytics(token, site, { ...current, dimensions: ['country'], rowLimit: 10 }),
    ])

    const queryRows = queries.map(pick)
    const pageRows = pages.map(pick)

    const prevPageMap = new Map(prevPages.map((r) => [r.keys?.[0] ?? '', r]))
    const pageChanges = pageRows.map((p) => {
      const prev = prevPageMap.get(p.key)
      return { ...p, prevClicks: prev?.clicks ?? 0, delta: p.clicks - (prev?.clicks ?? 0) }
    })
    // Pages that were getting clicks previously but vanished from the current top results.
    const currentPageKeys = new Set(pageRows.map((p) => p.key))
    const lostPages = prevPages
      .filter((r) => !currentPageKeys.has(r.keys?.[0] ?? '') && r.clicks >= 5)
      .map((r) => ({ key: r.keys?.[0] ?? '', prevClicks: r.clicks, clicks: 0, delta: -r.clicks }))

    const winning = {
      topQueries: [...queryRows].sort((a, b) => b.clicks - a.clicks).slice(0, 10),
      topPages: [...pageRows].sort((a, b) => b.clicks - a.clicks).slice(0, 10),
      growingPages: pageChanges.filter((p) => p.delta > 0).sort((a, b) => b.delta - a.delta).slice(0, 5),
    }

    const needsAttention = {
      lowCtrQueries: queryRows
        .filter((q) => q.impressions >= 50 && q.position <= 10.5 && q.ctr < expectedCtr(q.position) * 0.6)
        .sort((a, b) => b.impressions - a.impressions)
        .slice(0, 10),
      strikingDistanceQueries: queryRows
        .filter((q) => q.position > 10.5 && q.position <= 20 && q.impressions >= 30)
        .sort((a, b) => b.impressions - a.impressions)
        .slice(0, 10),
      decliningPages: [...pageChanges.filter((p) => p.delta < 0), ...lostPages]
        .sort((a, b) => a.delta - b.delta)
        .slice(0, 10),
      noClickPages: pageRows
        .filter((p) => p.impressions >= 100 && p.clicks === 0)
        .sort((a, b) => b.impressions - a.impressions)
        .slice(0, 10),
    }

    const t = totals[0] ?? { clicks: 0, impressions: 0, ctr: 0, position: 0 }
    const pt = prevTotals[0] ?? { clicks: 0, impressions: 0, ctr: 0, position: 0 }

    return NextResponse.json({
      range: current,
      previousRange: previous,
      totals: { clicks: t.clicks, impressions: t.impressions, ctr: t.ctr, position: t.position },
      previousTotals: { clicks: pt.clicks, impressions: pt.impressions, ctr: pt.ctr, position: pt.position },
      trend: byDate.map((r) => ({ date: r.keys?.[0], clicks: r.clicks, impressions: r.impressions })),
      devices: devices.map(pick),
      countries: countries.map(pick),
      winning,
      needsAttention,
    })
  } catch (error) {
    try { return handleAuthError(error) } catch {}
    if (error instanceof GscNotConnectedError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error('GSC analytics error:', error)
    return NextResponse.json({ error: 'Failed to load Search Console data' }, { status: 502 })
  }
}
