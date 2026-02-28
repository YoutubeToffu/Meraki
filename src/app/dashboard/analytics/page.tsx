'use client'

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
} from 'lucide-react'

// Mock chart data
const chartData = {
  leads: [
    { month: 'Sep', value: 156 },
    { month: 'Oct', value: 234 },
    { month: 'Nov', value: 312 },
    { month: 'Dec', value: 278 },
    { month: 'Jan', value: 389 },
    { month: 'Feb', value: 456 },
  ],
  conversions: [
    { month: 'Sep', value: 12 },
    { month: 'Oct', value: 18 },
    { month: 'Nov', value: 24 },
    { month: 'Dec', value: 21 },
    { month: 'Jan', value: 32 },
    { month: 'Feb', value: 38 },
  ],
}

const channelPerformance = [
  { channel: 'LinkedIn', leads: 847, conversion: 4.2, trend: 'up' },
  { channel: 'Email Campaigns', leads: 623, conversion: 3.8, trend: 'up' },
  { channel: 'Website Forms', leads: 456, conversion: 6.1, trend: 'up' },
  { channel: 'Cold Outreach', leads: 312, conversion: 2.4, trend: 'down' },
  { channel: 'Referrals', leads: 189, conversion: 8.5, trend: 'up' },
]

const topPerformingSequences = [
  { name: 'Welcome Sequence', enrolled: 234, completed: 156, conversionRate: 12.4 },
  { name: 'Demo Follow-up', enrolled: 89, completed: 67, conversionRate: 18.2 },
  { name: 'Enterprise Outreach', enrolled: 156, completed: 89, conversionRate: 8.7 },
  { name: 'Re-engagement', enrolled: 312, completed: 156, conversionRate: 5.2 },
]

export default function AnalyticsPage() {
  const maxLeadValue = Math.max(...chartData.leads.map((d) => d.value))

  return (
    <>
      <Header
        title="Analytics"
        description="Track your growth engine performance"
        action={
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        }
      />

      <div className="p-6 space-y-6">
        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="rounded-lg bg-blue-100 p-2">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex items-center text-sm font-medium text-green-600">
                  +23.1%
                  <ArrowUpRight className="ml-1 h-4 w-4" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-bold">2,847</p>
                <p className="text-sm text-muted-foreground">Total Leads</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="rounded-lg bg-green-100 p-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex items-center text-sm font-medium text-green-600">
                  +12.5%
                  <ArrowUpRight className="ml-1 h-4 w-4" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-bold">4.2%</p>
                <p className="text-sm text-muted-foreground">Conversion Rate</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="rounded-lg bg-purple-100 p-2">
                  <Mail className="h-5 w-5 text-purple-600" />
                </div>
                <div className="flex items-center text-sm font-medium text-green-600">
                  +8.2%
                  <ArrowUpRight className="ml-1 h-4 w-4" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-bold">68%</p>
                <p className="text-sm text-muted-foreground">Email Open Rate</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="rounded-lg bg-orange-100 p-2">
                  <Calendar className="h-5 w-5 text-orange-600" />
                </div>
                <div className="flex items-center text-sm font-medium text-red-600">
                  -2.3%
                  <ArrowDownRight className="ml-1 h-4 w-4" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-bold">186</p>
                <p className="text-sm text-muted-foreground">Meetings This Month</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Lead Generation Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Lead Generation Trend</CardTitle>
              <CardDescription>Monthly lead acquisition over the last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end justify-between space-x-2">
                {chartData.leads.map((data) => (
                  <div key={data.month} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                      style={{
                        height: `${(data.value / maxLeadValue) * 200}px`,
                      }}
                    />
                    <span className="mt-2 text-xs text-muted-foreground">{data.month}</span>
                    <span className="text-sm font-medium">{data.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Channel Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Channel Performance</CardTitle>
              <CardDescription>Lead generation by source channel</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {channelPerformance.map((channel) => (
                  <div key={channel.channel} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{channel.channel}</span>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-muted-foreground">
                          {channel.leads} leads
                        </span>
                        <span
                          className={`flex items-center text-sm font-medium ${
                            channel.trend === 'up' ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {channel.conversion}%
                          {channel.trend === 'up' ? (
                            <TrendingUp className="ml-1 h-3 w-3" />
                          ) : (
                            <TrendingDown className="ml-1 h-3 w-3" />
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{
                          width: `${(channel.leads / 847) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sequence Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Sequence Performance</CardTitle>
            <CardDescription>How your automated sequences are performing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                      Sequence Name
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                      Enrolled
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                      Completed
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                      Completion Rate
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                      Conversion Rate
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {topPerformingSequences.map((sequence) => (
                    <tr key={sequence.name} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{sequence.name}</td>
                      <td className="px-4 py-3">{sequence.enrolled}</td>
                      <td className="px-4 py-3">{sequence.completed}</td>
                      <td className="px-4 py-3">
                        {Math.round((sequence.completed / sequence.enrolled) * 100)}%
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-sm font-medium text-green-700">
                          {sequence.conversionRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
