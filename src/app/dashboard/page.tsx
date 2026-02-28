'use client'

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
} from 'lucide-react'

const stats = [
  {
    name: 'Total Leads',
    value: '2,847',
    change: '+12.5%',
    trend: 'up',
    icon: Users,
    color: 'bg-blue-500',
  },
  {
    name: 'Emails Sent',
    value: '12,543',
    change: '+8.2%',
    trend: 'up',
    icon: Mail,
    color: 'bg-green-500',
  },
  {
    name: 'Meetings Booked',
    value: '186',
    change: '+23.1%',
    trend: 'up',
    icon: Calendar,
    color: 'bg-purple-500',
  },
  {
    name: 'Conversion Rate',
    value: '4.2%',
    change: '-0.5%',
    trend: 'down',
    icon: TrendingUp,
    color: 'bg-orange-500',
  },
]

const recentActivity = [
  {
    id: 1,
    type: 'email_opened',
    lead: 'Sarah Chen',
    company: 'TechCorp Inc',
    message: 'Opened your email "Introduction to TalentMeta"',
    time: '2 minutes ago',
  },
  {
    id: 2,
    type: 'meeting_scheduled',
    lead: 'Michael Rodriguez',
    company: 'Startup Labs',
    message: 'Scheduled a demo for tomorrow at 2:00 PM',
    time: '15 minutes ago',
  },
  {
    id: 3,
    type: 'form_submitted',
    lead: 'Emma Thompson',
    company: 'Global Staffing',
    message: 'Submitted the contact form on your website',
    time: '1 hour ago',
  },
  {
    id: 4,
    type: 'linkedin_reply',
    lead: 'James Wilson',
    company: 'HR Solutions',
    message: 'Replied to your LinkedIn message',
    time: '2 hours ago',
  },
  {
    id: 5,
    type: 'email_clicked',
    lead: 'Lisa Park',
    company: 'RecruitPro',
    message: 'Clicked on "View Pricing" link in your email',
    time: '3 hours ago',
  },
]

const aiSuggestions = [
  {
    id: 1,
    type: 'follow_up',
    title: 'Follow up with Sarah Chen',
    description: 'She opened your email 3 times but hasn\'t responded. Try a personalized follow-up.',
    priority: 'high',
  },
  {
    id: 2,
    type: 'content',
    title: 'Create case study content',
    description: 'Leads in the "Staffing" industry have 2x higher conversion when shown case studies.',
    priority: 'medium',
  },
  {
    id: 3,
    type: 'timing',
    title: 'Optimize send times',
    description: 'Your emails get 40% more opens when sent on Tuesday mornings.',
    priority: 'medium',
  },
]

export default function DashboardPage() {
  return (
    <>
      <Header
        title="Dashboard"
        description="Welcome back! Here's what's happening with your leads."
        action={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Lead
          </Button>
        }
      />

      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.name}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className={`rounded-lg p-2 ${stat.color}`}>
                    <stat.icon className="h-5 w-5 text-white" />
                  </div>
                  <div
                    className={`flex items-center text-sm font-medium ${
                      stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {stat.change}
                    {stat.trend === 'up' ? (
                      <ArrowUpRight className="ml-1 h-4 w-4" />
                    ) : (
                      <ArrowDownRight className="ml-1 h-4 w-4" />
                    )}
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.name}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent Activity */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest interactions from your leads
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start space-x-4 rounded-lg border p-4"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-600">
                      {activity.lead
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{activity.lead}</p>
                        <span className="text-xs text-muted-foreground">
                          {activity.time}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {activity.company}
                      </p>
                      <p className="text-sm">{activity.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* AI Suggestions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                <span>AI Suggestions</span>
              </CardTitle>
              <CardDescription>
                Smart recommendations to improve your results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {aiSuggestions.map((suggestion) => (
                  <div
                    key={suggestion.id}
                    className="rounded-lg border p-4 space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <h4 className="font-medium">{suggestion.title}</h4>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          suggestion.priority === 'high'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {suggestion.priority}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {suggestion.description}
                    </p>
                    <Button variant="outline" size="sm" className="w-full">
                      Take Action
                    </Button>
                  </div>
                ))}
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
                { stage: 'New', count: 847, color: 'bg-gray-500' },
                { stage: 'Contacted', count: 523, color: 'bg-blue-500' },
                { stage: 'Qualified', count: 312, color: 'bg-yellow-500' },
                { stage: 'Proposal', count: 156, color: 'bg-purple-500' },
                { stage: 'Negotiation', count: 89, color: 'bg-orange-500' },
                { stage: 'Won', count: 67, color: 'bg-green-500' },
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
