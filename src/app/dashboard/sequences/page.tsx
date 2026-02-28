'use client'

import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Plus,
  Play,
  Pause,
  MoreHorizontal,
  Mail,
  MessageSquare,
  Clock,
  Users,
  TrendingUp,
  Zap,
} from 'lucide-react'

const sequences = [
  {
    id: '1',
    name: 'Welcome Sequence',
    description: 'Onboard new leads with a 5-part email series',
    status: 'ACTIVE',
    steps: 5,
    enrolledCount: 234,
    completedCount: 156,
    openRate: 68,
    replyRate: 12,
    lastUpdated: '2026-02-25',
  },
  {
    id: '2',
    name: 'Demo Follow-up',
    description: 'Nurture leads who attended a demo but haven\'t converted',
    status: 'ACTIVE',
    steps: 4,
    enrolledCount: 89,
    completedCount: 45,
    openRate: 72,
    replyRate: 18,
    lastUpdated: '2026-02-20',
  },
  {
    id: '3',
    name: 'Cold Outreach - HR Managers',
    description: 'Multi-channel outreach targeting HR managers',
    status: 'PAUSED',
    steps: 7,
    enrolledCount: 567,
    completedCount: 234,
    openRate: 45,
    replyRate: 8,
    lastUpdated: '2026-02-15',
  },
  {
    id: '4',
    name: 'Re-engagement Campaign',
    description: 'Win back inactive leads who haven\'t responded in 30+ days',
    status: 'DRAFT',
    steps: 3,
    enrolledCount: 0,
    completedCount: 0,
    openRate: 0,
    replyRate: 0,
    lastUpdated: '2026-02-28',
  },
]

const statusColors: Record<string, { bg: string; text: string }> = {
  ACTIVE: { bg: 'bg-green-100', text: 'text-green-700' },
  PAUSED: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  DRAFT: { bg: 'bg-gray-100', text: 'text-gray-700' },
  ARCHIVED: { bg: 'bg-red-100', text: 'text-red-700' },
}

export default function SequencesPage() {
  return (
    <>
      <Header
        title="Sequences"
        description="Automate your lead nurturing with multi-step sequences"
        action={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Sequence
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
                  <Zap className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">4</p>
                  <p className="text-sm text-muted-foreground">Active Sequences</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="rounded-lg bg-green-100 p-2">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">890</p>
                  <p className="text-sm text-muted-foreground">Leads Enrolled</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="rounded-lg bg-purple-100 p-2">
                  <Mail className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">58%</p>
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
                  <p className="text-2xl font-bold">12%</p>
                  <p className="text-sm text-muted-foreground">Avg Reply Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sequences List */}
        <div className="grid gap-4">
          {sequences.map((sequence) => (
            <Card key={sequence.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-semibold">{sequence.name}</h3>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          statusColors[sequence.status].bg
                        } ${statusColors[sequence.status].text}`}
                      >
                        {sequence.status.charAt(0) + sequence.status.slice(1).toLowerCase()}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {sequence.description}
                    </p>

                    {/* Sequence Steps Preview */}
                    <div className="mt-4 flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1">
                          {Array.from({ length: Math.min(sequence.steps, 5) }).map((_, i) => (
                            <div
                              key={i}
                              className={`flex h-8 w-8 items-center justify-center rounded-lg border-2 ${
                                i % 2 === 0
                                  ? 'border-blue-200 bg-blue-50'
                                  : 'border-purple-200 bg-purple-50'
                              }`}
                            >
                              {i % 2 === 0 ? (
                                <Mail className="h-4 w-4 text-blue-600" />
                              ) : (
                                <MessageSquare className="h-4 w-4 text-purple-600" />
                              )}
                            </div>
                          ))}
                          {sequence.steps > 5 && (
                            <span className="ml-2 text-sm text-muted-foreground">
                              +{sequence.steps - 5} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="mt-4 flex items-center space-x-6 text-sm">
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span>
                          <strong>{sequence.enrolledCount}</strong> enrolled
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span>
                          <strong>{sequence.completedCount}</strong> completed
                        </span>
                      </div>
                      {sequence.openRate > 0 && (
                        <>
                          <div>
                            Open rate: <strong>{sequence.openRate}%</strong>
                          </div>
                          <div>
                            Reply rate: <strong>{sequence.replyRate}%</strong>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    {sequence.status === 'ACTIVE' ? (
                      <Button variant="outline" size="sm">
                        <Pause className="mr-2 h-4 w-4" />
                        Pause
                      </Button>
                    ) : sequence.status === 'PAUSED' || sequence.status === 'DRAFT' ? (
                      <Button variant="outline" size="sm">
                        <Play className="mr-2 h-4 w-4" />
                        {sequence.status === 'DRAFT' ? 'Activate' : 'Resume'}
                      </Button>
                    ) : null}
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  )
}
