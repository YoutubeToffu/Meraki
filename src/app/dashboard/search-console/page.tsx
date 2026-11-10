'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, Search, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

interface Site { siteUrl: string; permissionLevel: string }
interface Row { key: string; clicks: number; impressions: number; ctr: number; position: number }
interface PageRow extends Row { prevClicks: number; delta: number }
interface Totals { clicks: number; impressions: number; ctr: number; position: number }
interface Analytics {
  range: { startDate: string; endDate: string }
  totals: Totals
  previousTotals: Totals
  trend: { date: string; clicks: number; impressions: number }[]
  devices: Row[]
  countries: Row[]
  winning: { topQueries: Row[]; topPages: Row[]; growingPages: PageRow[] }
  needsAttention: {
    lowCtrQueries: Row[]
    strikingDistanceQueries: Row[]
    decliningPages: PageRow[]
    noClickPages: Row[]
  }
}
interface Inspection {
  verdict?: string
  coverageState?: string
  indexingState?: string
  robotsTxtState?: string
  pageFetchState?: string
  lastCrawlTime?: string
  userCanonical?: string
  googleCanonical?: string
}

const errorMessages: Record<string, string> = {
  denied: 'Google access was denied.',
  invalid_state: 'The connection request expired. Please try again.',
  no_org: 'No organization found for your account.',
  forbidden: 'Only owners and admins can connect Search Console.',
  callback_failed: 'Could not complete the connection. Please try again.',
}

const pct = (n: number) => `${(n * 100).toFixed(1)}%`
const num = (n: number) => n.toLocaleString()

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

function Change({ cur, prev, invert = false, ratio = false }: { cur: number; prev: number; invert?: boolean; ratio?: boolean }) {
  if (!prev) return null
  const diff = ratio ? cur - prev : ((cur - prev) / prev) * 100
  const good = invert ? diff < 0 : diff > 0
  const label = ratio ? diff.toFixed(1) : `${diff.toFixed(0)}%`
  return (
    <span className={`text-xs ${diff === 0 ? 'text-gray-500' : good ? 'text-green-600' : 'text-red-600'}`}>
      {diff > 0 ? '+' : ''}{label} vs previous period
    </span>
  )
}

function Table({ rows, empty, extra }: { rows: Row[]; empty: string; extra?: (r: any) => React.ReactNode }) {
  if (!rows.length) return <p className="text-sm text-gray-500">{empty}</p>
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-xs text-gray-500">
            <th className="py-2 pr-4 font-medium">Item</th>
            <th className="py-2 pr-4 text-right font-medium">Clicks</th>
            <th className="py-2 pr-4 text-right font-medium">Impr.</th>
            <th className="py-2 pr-4 text-right font-medium">CTR</th>
            <th className="py-2 text-right font-medium">Pos.</th>
            {extra && <th className="py-2 pl-4 text-right font-medium">Change</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} className="border-b last:border-0">
              <td className="max-w-xs truncate py-2 pr-4" title={r.key}>{r.key}</td>
              <td className="py-2 pr-4 text-right">{num(r.clicks)}</td>
              <td className="py-2 pr-4 text-right">{num(r.impressions)}</td>
              <td className="py-2 pr-4 text-right">{pct(r.ctr)}</td>
              <td className="py-2 text-right">{r.position.toFixed(1)}</td>
              {extra && <td className="py-2 pl-4 text-right">{extra(r)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const deltaCell = (r: PageRow) => (
  <span className={r.delta >= 0 ? 'text-green-600' : 'text-red-600'}>
    {r.delta > 0 ? '+' : ''}{r.delta} clicks
  </span>
)

export default function SearchConsolePage() {
  return (
    <Suspense fallback={null}>
      <SearchConsole />
    </Suspense>
  )
}

function SearchConsole() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const params = useSearchParams()

  const [site, setSite] = useState('')
  const [days, setDays] = useState(28)
  const [inspectUrl, setInspectUrl] = useState('')
  const [inspection, setInspection] = useState<Inspection | null>(null)

  useEffect(() => {
    const error = params.get('error')
    if (error) toast({ title: 'Connection failed', description: errorMessages[error] ?? 'Something went wrong.', variant: 'destructive' })
    if (params.get('connected')) toast({ title: 'Google Search Console connected' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const status = useQuery({
    queryKey: ['gsc-status'],
    queryFn: () => fetchJson<{ configured: boolean; connected: boolean; expired?: boolean; sites: Site[] }>('/api/gsc'),
  })

  useEffect(() => {
    if (!site && status.data?.sites.length) setSite(status.data.sites[0].siteUrl)
  }, [status.data, site])

  const analytics = useQuery({
    queryKey: ['gsc-analytics', site, days],
    queryFn: () => fetchJson<Analytics>(`/api/gsc/analytics?site=${encodeURIComponent(site)}&days=${days}`),
    enabled: Boolean(site),
  })

  const disconnect = useMutation({
    mutationFn: () => fetchJson('/api/gsc', { method: 'DELETE' }),
    onSuccess: () => {
      setSite('')
      queryClient.invalidateQueries({ queryKey: ['gsc-status'] })
      toast({ title: 'Search Console disconnected' })
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  })

  const inspect = useMutation({
    mutationFn: () =>
      fetchJson<{ result: Inspection }>('/api/gsc/inspect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ site, url: inspectUrl.trim() }),
      }),
    onSuccess: (d) => setInspection(d.result),
    onError: (e: Error) => {
      setInspection(null)
      toast({ title: 'Inspection failed', description: e.message, variant: 'destructive' })
    },
  })

  const a = analytics.data
  const canonicalMismatch =
    inspection?.userCanonical && inspection?.googleCanonical && inspection.userCanonical !== inspection.googleCanonical

  if (status.isLoading) {
    return (
      <div>
        <Header title="Search Console" description="Analyze your Google Search performance" />
        <div className="flex justify-center p-12"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
      </div>
    )
  }

  if (!status.data?.connected) {
    return (
      <div>
        <Header title="Search Console" description="Analyze your Google Search performance" />
        <div className="p-6">
          <Card className="mx-auto max-w-xl">
            <CardContent className="space-y-4 p-8 text-center">
              <Search className="mx-auto h-10 w-10 text-primary-600" />
              <h2 className="text-lg font-semibold">Connect Google Search Console</h2>
              <p className="text-sm text-gray-600">
                Meraki gets read-only access to see what is working (top queries, growing pages) and what is not
                (low CTR, declining pages, indexing and canonical issues).
              </p>
              {status.data?.expired && (
                <p className="text-sm text-amber-600">Your previous connection expired. Please reconnect.</p>
              )}
              {status.data && !status.data.configured && (
                <p className="text-sm text-red-600">
                  Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.
                </p>
              )}
              <Button disabled={status.data ? !status.data.configured : false}
                onClick={() => { window.location.href = '/api/gsc/connect' }}>
                Connect with Google
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Header
        title="Search Console"
        description="What is working and what is not in Google Search"
        action={
          <Button variant="outline" onClick={() => disconnect.mutate()} disabled={disconnect.isPending}>
            Disconnect
          </Button>
        }
      />
      <div className="space-y-6 p-6">
        <div className="flex flex-wrap items-center gap-3">
          <select
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            value={site}
            onChange={(e) => { setSite(e.target.value); setInspection(null) }}
          >
            {status.data.sites.map((s) => <option key={s.siteUrl} value={s.siteUrl}>{s.siteUrl}</option>)}
          </select>
          <select
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
          >
            <option value={7}>Last 7 days</option>
            <option value={28}>Last 28 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          {a && <span className="text-xs text-gray-500">{a.range.startDate} → {a.range.endDate}</span>}
        </div>

        {!status.data.sites.length && (
          <p className="text-sm text-gray-600">No verified properties found on this Google account.</p>
        )}
        {analytics.isLoading && <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>}
        {analytics.error && <p className="text-sm text-red-600">{(analytics.error as Error).message}</p>}

        {a && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: 'Clicks', value: num(a.totals.clicks), change: <Change cur={a.totals.clicks} prev={a.previousTotals.clicks} /> },
                { label: 'Impressions', value: num(a.totals.impressions), change: <Change cur={a.totals.impressions} prev={a.previousTotals.impressions} /> },
                { label: 'Avg. CTR', value: pct(a.totals.ctr), change: <Change cur={a.totals.ctr * 100} prev={a.previousTotals.ctr * 100} ratio /> },
                { label: 'Avg. position', value: a.totals.position.toFixed(1), change: <Change cur={a.totals.position} prev={a.previousTotals.position} invert ratio /> },
              ].map((k) => (
                <Card key={k.label}>
                  <CardContent className="p-4">
                    <p className="text-xs text-gray-500">{k.label}</p>
                    <p className="text-2xl font-semibold">{k.value}</p>
                    {k.change}
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader><CardTitle className="text-base">Clicks &amp; impressions</CardTitle></CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={a.trend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="c" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="i" orientation="right" tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line yAxisId="c" type="monotone" dataKey="clicks" stroke="#2563eb" dot={false} />
                    <Line yAxisId="i" type="monotone" dataKey="impressions" stroke="#9ca3af" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-6">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-green-700">
                  <CheckCircle2 className="h-5 w-5" /> What&apos;s working
                </h2>
                <Card>
                  <CardHeader><CardTitle className="text-base">Top queries</CardTitle></CardHeader>
                  <CardContent><Table rows={a.winning.topQueries} empty="No query data yet." /></CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="flex items-center gap-2 text-base"><TrendingUp className="h-4 w-4" />Growing pages</CardTitle></CardHeader>
                  <CardContent><Table rows={a.winning.growingPages} empty="No growing pages in this period." extra={deltaCell} /></CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-base">Top pages</CardTitle></CardHeader>
                  <CardContent><Table rows={a.winning.topPages} empty="No page data yet." /></CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-red-700">
                  <AlertTriangle className="h-5 w-5" /> Needs attention
                </h2>
                <Card>
                  <CardHeader><CardTitle className="flex items-center gap-2 text-base"><TrendingDown className="h-4 w-4" />Declining pages</CardTitle></CardHeader>
                  <CardContent><Table rows={a.needsAttention.decliningPages} empty="No declining pages." extra={deltaCell} /></CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-base">Low CTR for their ranking</CardTitle>
                    <p className="text-xs text-gray-500">Ranking on page 1 but few clicks — improve titles and meta descriptions.</p></CardHeader>
                  <CardContent><Table rows={a.needsAttention.lowCtrQueries} empty="No low-CTR queries found." /></CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-base">Striking distance (position 11–20)</CardTitle>
                    <p className="text-xs text-gray-500">Close to page 1 — strengthen content and internal links.</p></CardHeader>
                  <CardContent><Table rows={a.needsAttention.strikingDistanceQueries} empty="No queries in striking distance." /></CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-base">Impressions but zero clicks</CardTitle></CardHeader>
                  <CardContent><Table rows={a.needsAttention.noClickPages} empty="No pages with zero clicks." /></CardContent>
                </Card>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader><CardTitle className="text-base">Devices</CardTitle></CardHeader>
                <CardContent><Table rows={a.devices} empty="No data." /></CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base">Top countries</CardTitle></CardHeader>
                <CardContent><Table rows={a.countries} empty="No data." /></CardContent>
              </Card>
            </div>
          </>
        )}

        {site && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Check indexing &amp; canonical for a URL</CardTitle>
              <p className="text-xs text-gray-500">Diagnoses issues like &quot;Duplicate, Google chose different canonical than user&quot;.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <form
                className="flex gap-2"
                onSubmit={(e) => { e.preventDefault(); if (inspectUrl.trim()) inspect.mutate() }}
              >
                <Input placeholder="https://example.com/page" value={inspectUrl} onChange={(e) => setInspectUrl(e.target.value)} />
                <Button type="submit" disabled={inspect.isPending || !inspectUrl.trim()}>
                  {inspect.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Inspect'}
                </Button>
              </form>
              {inspection && (
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Status:</span> {inspection.coverageState ?? 'Unknown'} ({inspection.verdict ?? '—'})</p>
                  <p><span className="font-medium">Indexing:</span> {inspection.indexingState ?? '—'} · <span className="font-medium">Robots.txt:</span> {inspection.robotsTxtState ?? '—'} · <span className="font-medium">Fetch:</span> {inspection.pageFetchState ?? '—'}</p>
                  <p><span className="font-medium">Last crawl:</span> {inspection.lastCrawlTime ? new Date(inspection.lastCrawlTime).toLocaleString() : 'Never'}</p>
                  <p className="break-all"><span className="font-medium">Your canonical:</span> {inspection.userCanonical ?? 'None declared'}</p>
                  <p className="break-all"><span className="font-medium">Google&apos;s canonical:</span> {inspection.googleCanonical ?? '—'}</p>
                  {canonicalMismatch && (
                    <p className="rounded-md bg-amber-50 p-3 text-amber-800">
                      Google chose a different canonical than the one you declared. If Google&apos;s choice is not the URL you want
                      indexed, make your canonical tag, sitemap and internal links all point to the same preferred URL.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
