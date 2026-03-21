'use client'

import { useQuery } from '@tanstack/react-query'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Users,
  Mail,
  Calendar,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Sparkles,
  Loader2,
} from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const router = useRouter()

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await fetch('/api/leads?limit=1')
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      return { totalLeads: data.pagination?.total || 0 }
    },
  })

  const { data: leadsData } = useQuery({
    queryKey: ['dashboard-leads'],
    queryFn: async () => {
      const res = await fetch('/api/leads?limit=5&sortBy=createdAt&sortOrder=desc')
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
  })

  const totalLeads = stats?.totalLeads || 0
  const recentLeads = leadsData?.data || []
  const statCards = [
    {
      name: 'Total Leads',
      value: totalLeads.toLocaleString(),
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      name: 'Emails Sent',
      value: '0',
      icon: Mail,
      color: 'bg-green-500',
    },
    {
      name: 'Meetings Booked',
      value: '0',
      icon: Calendar,
      color: 'bg-purple-500',
    },
    {
      name: 'Templates',
      value: '—',
      icon: TrendingUp,
      color: 'bg-orange-500',
    },
  ]

  return (
    <>
      <Header
        title="Dashboard"
        description="Welcome back! Here's what's happening with your leads."
        action={
          <Button onClick={() => router.push('/dashboard/leads')}>
            <Plus className="mr-2 h-4 w-4" />
            Add Lead
          </Button>
        }
      />

      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <Card key={stat.name}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className={`rounded-lg p-2 ${stat.color}`}>
                    <stat.icon className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-bold">
                    {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stat.value}
                  </p>
                  <p className="text-sm text-muted-foreground">{stat.name}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent Leads */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Recent Leads</CardTitle>
              <CardDescription>
                Latest leads added to your pipeline
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentLeads.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="mx-auto h-8 w-8 mb-2" />
                  <p>No leads yet. Add your first lead to get started.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentLeads.map((lead: any) => (
                    <div
                      key={lead.id}
                      className="flex items-start space-x-4 rounded-lg border p-4"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-600">
                        {(lead.firstName?.[0] || '?')}
                        {(lead.lastName?.[0] || '')}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">
                            {lead.firstName || ''} {lead.lastName || ''}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {new Date(lead.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {lead.company || lead.email}
                        </p>
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          lead.status === 'NEW' ? 'bg-gray-100 text-gray-700' :
                          lead.status === 'CONTACTED' ? 'bg-blue-100 text-blue-700' :
                          lead.status === 'QUALIFIED' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {lead.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                <span>Quick Actions</span>
              </CardTitle>
              <CardDescription>
                Get started with common tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start" onClick={() => router.push('/dashboard/leads')}>
                  <Users className="mr-2 h-4 w-4" />
                  Manage Leads
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => router.push('/dashboard/templates')}>
                  <Mail className="mr-2 h-4 w-4" />
                  Email Templates
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => router.push('/dashboard/sequences')}>
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Sequences
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => router.push('/dashboard/ai')}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  AI Assistant
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pipeline Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Pipeline Overview</CardTitle>
            <CardDescription>
              Track your leads through the sales funnel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between space-x-4">
              {[
                { stage: 'New', count: 0, color: 'bg-gray-500' },
                { stage: 'Contacted', count: 0, color: 'bg-blue-500' },
                { stage: 'Qualified', count: 0, color: 'bg-yellow-500' },
                { stage: 'Proposal', count: 0, color: 'bg-purple-500' },
                { stage: 'Negotiation', count: 0, color: 'bg-orange-500' },
                { stage: 'Won', count: 0, color: 'bg-green-500' },
              ].map((stage, index) => (
                <div key={stage.stage} className="flex-1 text-center">
                  <div className="relative">
                    <div className={`h-2 ${stage.color} rounded-full`} />
                    {index < 5 && (
                      <div className="absolute -right-2 top-1/2 -translate-y-1/2">
                        <svg
                          className="h-4 w-4 text-gray-300"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                  <p className="mt-2 text-2xl font-bold">{stage.count}</p>
                  <p className="text-sm text-muted-foreground">{stage.stage}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
