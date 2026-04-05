'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Users,
  Mail,
  Calendar,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Loader2,
  MousePointerClick,
  Reply,
  BarChart3,
  Clock,
} from 'lucide-react'

interface Analytics {
  keyMetrics: {
    totalLeads: { value: number; change: number }
    conversionRate: { value: number }
    openRate: { value: number }
    replyRate: { value: number }
    clickRate: { value: number }
    bounceRate: { value: number }
    emailsSent: { value: number; change: number }
    meetings: { value: number; change: number }
  }
  channelPerformance: { channel: string; leads: number }[]
  sequencePerformance: { name: string; enrolled: number; completed: number; completionRate: number }[]
  monthlyTrend: { month: string; value: number }[]
  pipelineSummary: { status: string; count: number }[]
}

const statusColors: Record<string, string> = {
  NEW: 'bg-blue-500',
  CONTACTED: 'bg-yellow-500',
  QUALIFIED: 'bg-emerald-500',
  PROPOSAL: 'bg-purple-500',
  NEGOTIATION: 'bg-orange-500',
  WON: 'bg-green-600',
  LOST: 'bg-red-500',
  UNSUBSCRIBED: 'bg-gray-400',
}

interface BestTimeData {
  recommendation: string
  hourlyBreakdown: { hour: number; label: string; sent: number; openRate: number; engagementScore: number }[]
  bestHours: string[]
  bestDays: string[]
  totalAnalyzed: number
}

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [bestTime, setBestTime] = useState<BestTimeData | null>(null)

  useEffect(() => {
    fetch('/api/analytics')
      .then((r) => r.json())
      .then((res) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))

    fetch('/api/analytics/best-time')
      .then((r) => r.json())
      .then((res) => setBestTime(res.data))
      .catch(console.error)
  }, [])

  if (loading) {
    return (
      <>
        <Header title="Analytics" description="Track your growth engine performance" />
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </>
    )
  }

  if (!data) {
    return (
      <>
        <Header title="Analytics" description="Track your growth engine performance" />
        <div className="flex items-center justify-center h-96 text-gray-500">
          Failed to load analytics
        </div>
      </>
    )
  }

  const { keyMetrics, channelPerformance, sequencePerformance, monthlyTrend, pipelineSummary } = data
  const maxLeadValue = Math.max(...monthlyTrend.map((d) => d.value), 1)
  const maxChannelLeads = Math.max(...channelPerformance.map((c) => c.leads), 1)
  const totalPipeline = pipelineSummary.reduce((sum, p) => sum + p.count, 0)

  const MetricCard = ({ icon: Icon, iconBg, value, label, change, suffix = '' }: {
    icon: any; iconBg: string; value: number | string; label: string; change?: number; suffix?: string
  }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className={`rounded-lg p-2 ${iconBg}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          {change !== undefined && (
            <div className={`flex items-center text-sm font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change >= 0 ? '+' : ''}{change}%
              {change >= 0 ? <ArrowUpRight className="ml-1 h-4 w-4" /> : <ArrowDownRight className="ml-1 h-4 w-4" />}
            </div>
          )}
        </div>
        <div className="mt-4">
          <p className="text-3xl font-bold">{value}{suffix}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <>
      <Header
        title="Analytics"
        description="Real-time metrics from your outreach — last 30 days"
        action={
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        }
      />

      <div className="p-6 space-y-6">
        {/* Key Metrics Row 1 */}
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard icon={Users} iconBg="bg-blue-500" value={keyMetrics.totalLeads.value} label="New Leads (30d)" change={keyMetrics.totalLeads.change} />
          <MetricCard icon={TrendingUp} iconBg="bg-green-500" value={keyMetrics.conversionRate.value} label="Conversion Rate" suffix="%" />
          <MetricCard icon={Mail} iconBg="bg-purple-500" value={keyMetrics.emailsSent.value} label="Emails Sent (30d)" change={keyMetrics.emailsSent.change} />
          <MetricCard icon={Calendar} iconBg="bg-orange-500" value={keyMetrics.meetings.value} label="Meetings (30d)" change={keyMetrics.meetings.change} />
        </div>

        {/* Email Metrics Row */}
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard icon={Mail} iconBg="bg-indigo-500" value={keyMetrics.openRate.value} label="Open Rate" suffix="%" />
          <MetricCard icon={Reply} iconBg="bg-emerald-500" value={keyMetrics.replyRate.value} label="Reply Rate" suffix="%" />
          <MetricCard icon={MousePointerClick} iconBg="bg-cyan-500" value={keyMetrics.clickRate.value} label="Click Rate" suffix="%" />
          <MetricCard icon={TrendingDown} iconBg="bg-red-500" value={keyMetrics.bounceRate.value} label="Bounce Rate" suffix="%" />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Lead Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Lead Generation Trend</CardTitle>
              <CardDescription>Monthly new leads over the last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              {monthlyTrend.every((d) => d.value === 0) ? (
                <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
                  No lead data yet — leads will appear here as you add them
                </div>
              ) : (
                <div className="h-64 flex items-end justify-between space-x-2">
                  {monthlyTrend.map((d) => (
                    <div key={d.month} className="flex-1 flex flex-col items-center">
                      <div
                        className="w-full bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                        style={{ height: `${(d.value / maxLeadValue) * 200}px`, minHeight: d.value > 0 ? '4px' : '0' }}
                      />
                      <span className="mt-2 text-xs text-muted-foreground">{d.month}</span>
                      <span className="text-sm font-medium">{d.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pipeline Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Pipeline Breakdown</CardTitle>
              <CardDescription>Leads by status ({totalPipeline} total)</CardDescription>
            </CardHeader>
            <CardContent>
              {pipelineSummary.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
                  No leads in pipeline yet
                </div>
              ) : (
                <div className="space-y-3">
                  {pipelineSummary.sort((a, b) => b.count - a.count).map((p) => (
                    <div key={p.status} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{p.status.replace('_', ' ')}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-muted-foreground">{p.count}</span>
                          <span className="text-xs text-muted-foreground">
                            ({totalPipeline > 0 ? Math.round((p.count / totalPipeline) * 100) : 0}%)
                          </span>
                        </div>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className={`h-full rounded-full ${statusColors[p.status] || 'bg-gray-400'}`}
                          style={{ width: `${totalPipeline > 0 ? (p.count / totalPipeline) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Channel Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Lead Sources</CardTitle>
              <CardDescription>Where your leads are coming from</CardDescription>
            </CardHeader>
            <CardContent>
              {channelPerformance.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-sm">No source data yet</div>
              ) : (
                <div className="space-y-4">
                  {channelPerformance.map((channel) => (
                    <div key={channel.channel} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{channel.channel}</span>
                        <span className="text-sm text-muted-foreground">{channel.leads} leads</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${(channel.leads / maxChannelLeads) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sequence Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Sequence Performance</CardTitle>
              <CardDescription>How your automated sequences are performing</CardDescription>
            </CardHeader>
            <CardContent>
              {sequencePerformance.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-sm">
                  No sequences with enrollments yet
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Sequence</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Enrolled</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Completed</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {sequencePerformance.map((seq) => (
                        <tr key={seq.name} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-sm font-medium">{seq.name}</td>
                          <td className="px-3 py-2 text-sm">{seq.enrolled}</td>
                          <td className="px-3 py-2 text-sm">{seq.completed}</td>
                          <td className="px-3 py-2">
                            <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                              {seq.completionRate}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Best Time to Send */}
        {bestTime && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="mr-2 h-5 w-5 text-blue-500" />
                Best Time to Send
              </CardTitle>
              <CardDescription>{bestTime.recommendation}</CardDescription>
            </CardHeader>
            <CardContent>
              {bestTime.hourlyBreakdown.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {bestTime.bestHours.length > 0 && (
                      <div>
                        <span className="text-xs font-medium text-gray-500">Best hours: </span>
                        {bestTime.bestHours.map((h) => (
                          <span key={h} className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700 mr-1">
                            {h}
                          </span>
                        ))}
                      </div>
                    )}
                    {bestTime.bestDays.length > 0 && (
                      <div>
                        <span className="text-xs font-medium text-gray-500 ml-4">Best days: </span>
                        {bestTime.bestDays.map((d) => (
                          <span key={d} className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 mr-1">
                            {d}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="h-32 flex items-end justify-between space-x-0.5">
                    {bestTime.hourlyBreakdown.map((h) => {
                      const maxScore = Math.max(...bestTime.hourlyBreakdown.map((x) => x.engagementScore), 1)
                      const isBest = bestTime.bestHours.includes(h.label)
                      return (
                        <div key={h.hour} className="flex-1 flex flex-col items-center" title={`${h.label}: ${h.sent} sent, ${h.openRate}% open rate`}>
                          <div
                            className={`w-full rounded-t transition-all ${isBest ? 'bg-blue-500' : 'bg-gray-200'}`}
                            style={{ height: `${Math.max((h.engagementScore / maxScore) * 100, h.sent > 0 ? 4 : 0)}px` }}
                          />
                          {h.hour % 3 === 0 && (
                            <span className="mt-1 text-[9px] text-muted-foreground">{h.hour}</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    Hourly engagement score (0-23h UTC) — based on {bestTime.totalAnalyzed} emails
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-400 py-4 text-center">
                  Send more emails to see optimal timing recommendations
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </>
  )
}
