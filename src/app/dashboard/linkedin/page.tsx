'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  MessageSquare,
  Users,
  UserCheck,
  Eye,
  Send,
  ExternalLink,
  Loader2,
  Plus,
  X,
  Link2,
  TrendingUp,
  Clock,
  Search,
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

const activityConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  LINKEDIN_CONNECT: { label: 'Connection Sent', color: 'bg-blue-100 text-blue-700', icon: <UserCheck className="h-3.5 w-3.5" /> },
  LINKEDIN_MESSAGE: { label: 'Message Sent', color: 'bg-purple-100 text-purple-700', icon: <MessageSquare className="h-3.5 w-3.5" /> },
  LINKEDIN_VIEW: { label: 'Profile Viewed', color: 'bg-gray-100 text-gray-600', icon: <Eye className="h-3.5 w-3.5" /> },
}

interface Lead {
  id: string
  firstName: string | null
  lastName: string | null
  email: string
  company: string | null
  jobTitle: string | null
  linkedinUrl: string
  status: string
  score: number
}

interface Activity {
  id: string
  type: string
  title: string
  description: string | null
  createdAt: string
  lead: { id: string; firstName: string | null; lastName: string | null; company: string | null }
  user: { id: string; name: string | null; avatar: string | null } | null
}

export default function LinkedInPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState<'leads' | 'activity'>('leads')
  const [search, setSearch] = useState('')
  const [logModal, setLogModal] = useState<Lead | null>(null)
  const [logType, setLogType] = useState('LINKEDIN_CONNECT')
  const [logMessage, setLogMessage] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['linkedin'],
    queryFn: async () => {
      const res = await fetch('/api/linkedin')
      if (!res.ok) throw new Error('Failed to fetch LinkedIn data')
      return res.json()
    },
  })

  const logMutation = useMutation({
    mutationFn: async ({ leadId, type, message }: { leadId: string; type: string; message: string }) => {
      const res = await fetch('/api/linkedin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, type, message: message || null }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to log activity')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['linkedin'] })
      setLogModal(null)
      setLogMessage('')
      toast({ title: 'Activity logged' })
    },
    onError: (err: Error) => {
      toast({ title: err.message, variant: 'destructive' })
    },
  })

  const stats = data?.stats ?? {}
  const leads: Lead[] = data?.leads ?? []
  const activities: Activity[] = data?.activities ?? []

  const filteredLeads = leads.filter((l) => {
    const q = search.toLowerCase()
    return !q || `${l.firstName} ${l.lastName} ${l.email} ${l.company} ${l.jobTitle}`.toLowerCase().includes(q)
  })

  const formatRelative = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  return (
    <>
      <Header
        title="LinkedIn"
        description="Manage LinkedIn outreach, track activities, and find leads with profiles"
      />

      {/* Log Activity Modal */}
      {logModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <h2 className="text-base font-semibold">Log LinkedIn Activity</h2>
                <p className="text-xs text-gray-500">{logModal.firstName} {logModal.lastName}{logModal.company ? ` · ${logModal.company}` : ''}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setLogModal(null)}><X className="h-4 w-4" /></Button>
            </div>
            <div className="px-5 py-4 space-y-4">
              <div>
                <label className="text-sm font-medium">Activity Type</label>
                <select
                  className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={logType}
                  onChange={(e) => setLogType(e.target.value)}
                >
                  <option value="LINKEDIN_CONNECT">Connection request sent</option>
                  <option value="LINKEDIN_MESSAGE">Message sent</option>
                  <option value="LINKEDIN_VIEW">Profile viewed</option>
                </select>
              </div>
              {(logType === 'LINKEDIN_MESSAGE' || logType === 'LINKEDIN_CONNECT') && (
                <div>
                  <label className="text-sm font-medium">Message / Note (optional)</label>
                  <textarea
                    className="mt-1 w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder={logType === 'LINKEDIN_MESSAGE' ? 'Paste the message you sent...' : 'Connection note...'}
                    value={logMessage}
                    onChange={(e) => setLogMessage(e.target.value)}
                  />
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 border-t px-5 py-4">
              <Button variant="outline" onClick={() => setLogModal(null)}>Cancel</Button>
              <Button
                onClick={() => logMutation.mutate({ leadId: logModal.id, type: logType, message: logMessage })}
                disabled={logMutation.isPending}
              >
                {logMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Log Activity
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { label: 'Leads with Profile', value: stats.leadsWithProfiles ?? 0, sub: `${stats.profileCoverage ?? 0}% coverage`, icon: Link2, color: 'blue' },
            { label: 'Connections Sent', value: stats.connectionsSent ?? 0, sub: 'Total', icon: UserCheck, color: 'green' },
            { label: 'Messages Sent', value: stats.messagesSent ?? 0, sub: 'Total', icon: MessageSquare, color: 'purple' },
            { label: 'Profile Views', value: stats.profileViews ?? 0, sub: 'Logged', icon: Eye, color: 'orange' },
          ].map(({ label, value, sub, icon: Icon, color }) => (
            <Card key={label}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-2xl font-bold">{value}</p>
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
                  </div>
                  <div className={`rounded-lg bg-${color}-100 p-2`}>
                    <Icon className={`h-5 w-5 text-${color}-600`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Integration notice */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600">
                <MessageSquare className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-blue-900">LinkedIn Integration</p>
                <p className="text-xs text-blue-700">Connect your LinkedIn account to automate outreach and track responses.</p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="border-blue-300 text-blue-700 hover:bg-blue-100"
              onClick={() => window.location.href = '/dashboard/integrations'}
            >
              Connect
            </Button>
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="flex gap-1 border-b">
          {([
            { id: 'leads', label: `Leads with Profiles (${stats.leadsWithProfiles ?? 0})` },
            { id: 'activity', label: `Activity Feed (${stats.totalActivities ?? 0})` },
          ] as const).map(({ id, label }) => (
            <button
              key={id}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab(id)}
            >
              {label}
            </button>
          ))}
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        )}

        {/* Leads Tab */}
        {!isLoading && activeTab === 'leads' && (
          <>
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  className="pl-9"
                  placeholder="Search leads..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {filteredLeads.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Link2 className="mx-auto h-12 w-12 text-gray-300" />
                  <h3 className="mt-4 font-medium text-gray-900">No LinkedIn profiles yet</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Add LinkedIn profile URLs to your leads to enable LinkedIn outreach tracking.
                  </p>
                  <Button className="mt-4" onClick={() => window.location.href = '/dashboard/leads'}>
                    <Users className="mr-2 h-4 w-4" />
                    Go to Leads
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {filteredLeads.map((lead) => (
                  <Card key={lead.id} className="hover:shadow-sm transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-semibold text-sm">
                            {(lead.firstName?.[0] ?? lead.email[0]).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{lead.firstName} {lead.lastName}</p>
                            <p className="text-xs text-gray-500">
                              {lead.jobTitle ? `${lead.jobTitle} · ` : ''}{lead.company ?? lead.email}
                            </p>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <a
                            href={lead.linkedinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Profile
                          </a>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => { setLogModal(lead); setLogType('LINKEDIN_CONNECT'); setLogMessage('') }}
                          >
                            <Plus className="mr-1 h-3 w-3" />
                            Log Activity
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* Activity Tab */}
        {!isLoading && activeTab === 'activity' && (
          <>
            {activities.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <TrendingUp className="mx-auto h-12 w-12 text-gray-300" />
                  <h3 className="mt-4 font-medium text-gray-900">No LinkedIn activity yet</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Log connection requests, messages, and profile views to track your outreach.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {activities.map((activity) => {
                  const cfg = activityConfig[activity.type] ?? activityConfig.LINKEDIN_VIEW
                  return (
                    <div key={activity.id} className="flex items-start gap-3 rounded-lg border p-3 hover:bg-gray-50 transition-colors">
                      <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${cfg.color}`}>
                        {cfg.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cfg.color}`}>
                            {cfg.label}
                          </span>
                          <span className="text-xs text-gray-400">{formatRelative(activity.createdAt)}</span>
                        </div>
                        <p className="text-sm font-medium text-gray-800 mt-0.5">
                          {activity.lead.firstName} {activity.lead.lastName}
                          {activity.lead.company && <span className="text-gray-400 font-normal"> · {activity.lead.company}</span>}
                        </p>
                        {activity.description && (
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{activity.description}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}
