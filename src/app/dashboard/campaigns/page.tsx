'use client'

import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Plus,
  Mail,
  Users,
  Eye,
  MousePointer,
  MessageSquare,
  Target,
  TrendingUp,
  Calendar,
} from 'lucide-react'

const campaigns = [
  {
    id: '1',
    name: 'Q1 Product Launch',
    type: 'EMAIL_BLAST',
    status: 'COMPLETED',
    sentTo: 2500,
    opened: 1875,
    clicked: 425,
    replied: 89,
    startDate: '2026-01-15',
    endDate: '2026-01-20',
  },
  {
    id: '2',
    name: 'February Newsletter',
    type: 'NEWSLETTER',
    status: 'ACTIVE',
    sentTo: 5200,
    opened: 3640,
    clicked: 728,
    replied: 156,
    startDate: '2026-02-01',
    endDate: null,
  },
  {
    id: '3',
    name: 'Enterprise Outreach',
    type: 'DRIP',
    status: 'ACTIVE',
    sentTo: 350,
    opened: 245,
    clicked: 87,
    replied: 34,
    startDate: '2026-02-10',
    endDate: null,
  },
  {
    id: '4',
    name: 'Webinar Promotion',
    type: 'EVENT',
    status: 'SCHEDULED',
    sentTo: 0,
    opened: 0,
    clicked: 0,
    replied: 0,
    startDate: '2026-03-01',
    endDate: '2026-03-05',
  },
]

const statusColors: Record<string, { bg: string; text: string }> = {
  DRAFT: { bg: 'bg-gray-100', text: 'text-gray-700' },
  SCHEDULED: { bg: 'bg-blue-100', text: 'text-blue-700' },
  ACTIVE: { bg: 'bg-green-100', text: 'text-green-700' },
  PAUSED: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  COMPLETED: { bg: 'bg-purple-100', text: 'text-purple-700' },
}

const typeIcons: Record<string, React.ReactNode> = {
  EMAIL_BLAST: <Mail className="h-4 w-4" />,
  NEWSLETTER: <Mail className="h-4 w-4" />,
  DRIP: <Target className="h-4 w-4" />,
  EVENT: <Calendar className="h-4 w-4" />,
}

export default function CampaignsPage() {
  const calculateRate = (value: number, total: number) => {
    if (total === 0) return 0
    return Math.round((value / total) * 100)
  }

  return (
    <>
      <Header
        title="Campaigns"
        description="Create and manage email campaigns"
        action={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Campaign
          </Button>
        }
      />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="rounded-lg bg-blue-100 p-2">
                  <Target className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">8</p>
                  <p className="text-sm text-muted-foreground">Total Campaigns</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="rounded-lg bg-green-100 p-2">
                  <Mail className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">8,050</p>
                  <p className="text-sm text-muted-foreground">Emails Sent</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="rounded-lg bg-purple-100 p-2">
                  <Eye className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">72%</p>
                  <p className="text-sm text-muted-foreground">Avg Open Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="rounded-lg bg-orange-100 p-2">
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">15%</p>
                  <p className="text-sm text-muted-foreground">Avg Click Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Campaigns Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {campaigns.map((campaign) => (
            <Card key={campaign.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="rounded-lg bg-gray-100 p-2">
                      {typeIcons[campaign.type]}
                    </div>
                    <div>
                      <CardTitle className="text-base">{campaign.name}</CardTitle>
                      <CardDescription className="text-xs">
                        {campaign.type.replace('_', ' ').toLowerCase()}
                      </CardDescription>
                    </div>
                  </div>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      statusColors[campaign.status].bg
                    } ${statusColors[campaign.status].text}`}
                  >
                    {campaign.status.charAt(0) + campaign.status.slice(1).toLowerCase()}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                {/* Stats Grid */}
                <div className="grid grid-cols-4 gap-4 py-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1 text-gray-500">
                      <Users className="h-3 w-3" />
                      <span className="text-xs">Sent</span>
                    </div>
                    <p className="mt-1 text-lg font-semibold">{campaign.sentTo.toLocaleString()}</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1 text-gray-500">
                      <Eye className="h-3 w-3" />
                      <span className="text-xs">Opened</span>
                    </div>
                    <p className="mt-1 text-lg font-semibold">
                      {calculateRate(campaign.opened, campaign.sentTo)}%
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1 text-gray-500">
                      <MousePointer className="h-3 w-3" />
                      <span className="text-xs">Clicked</span>
                    </div>
                    <p className="mt-1 text-lg font-semibold">
                      {calculateRate(campaign.clicked, campaign.sentTo)}%
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1 text-gray-500">
                      <MessageSquare className="h-3 w-3" />
                      <span className="text-xs">Replied</span>
                    </div>
                    <p className="mt-1 text-lg font-semibold">
                      {calculateRate(campaign.replied, campaign.sentTo)}%
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                {campaign.sentTo > 0 && (
                  <div className="space-y-2">
                    <div className="flex h-2 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="bg-green-500"
                        style={{ width: `${calculateRate(campaign.replied, campaign.sentTo)}%` }}
                      />
                      <div
                        className="bg-blue-500"
                        style={{
                          width: `${calculateRate(campaign.clicked - campaign.replied, campaign.sentTo)}%`,
                        }}
                      />
                      <div
                        className="bg-purple-500"
                        style={{
                          width: `${calculateRate(campaign.opened - campaign.clicked, campaign.sentTo)}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Started: {new Date(campaign.startDate).toLocaleDateString()}</span>
                      {campaign.endDate && (
                        <span>Ended: {new Date(campaign.endDate).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-4 flex justify-end space-x-2">
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                  <Button variant="outline" size="sm">
                    Duplicate
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  )
}
