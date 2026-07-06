'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Calendar,
  Plus,
  Loader2,
  Video,
  Phone,
  Users,
  MapPin,
  CheckCircle2,
  XCircle,
  Clock,
  X,
  ExternalLink,
  ChevronDown,
  Trash2,
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

const meetingTypeIcons: Record<string, React.ReactNode> = {
  DEMO: <Video className="h-4 w-4 text-blue-600" />,
  VIDEO_CALL: <Video className="h-4 w-4 text-purple-600" />,
  CALL: <Phone className="h-4 w-4 text-green-600" />,
  IN_PERSON: <MapPin className="h-4 w-4 text-orange-600" />,
}

const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
  SCHEDULED: { label: 'Scheduled', bg: 'bg-blue-100', text: 'text-blue-700' },
  CONFIRMED: { label: 'Confirmed', bg: 'bg-green-100', text: 'text-green-700' },
  COMPLETED: { label: 'Completed', bg: 'bg-gray-100', text: 'text-gray-700' },
  CANCELLED: { label: 'Cancelled', bg: 'bg-red-100', text: 'text-red-700' },
  NO_SHOW: { label: 'No Show', bg: 'bg-yellow-100', text: 'text-yellow-700' },
}

interface Lead {
  id: string
  firstName: string | null
  lastName: string | null
  email: string
  company: string | null
  jobTitle: string | null
}

interface Meeting {
  id: string
  title: string
  description: string | null
  type: string
  status: string
  startTime: string
  endTime: string
  timezone: string
  meetingUrl: string | null
  outcome: string | null
  notes: string | null
  createdAt: string
  lead: Lead
  host: { id: string; name: string | null; email: string }
}

export default function MeetingsPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState<'upcoming' | 'all'>('upcoming')
  const [showCreate, setShowCreate] = useState(false)
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null)
  const [leadSearch, setLeadSearch] = useState('')

  // Create form state
  const [form, setForm] = useState({
    leadId: '',
    title: '',
    description: '',
    type: 'DEMO',
    startTime: '',
    endTime: '',
    meetingUrl: '',
    notes: '',
  })

  const { data, isLoading } = useQuery({
    queryKey: ['meetings', activeTab],
    queryFn: async () => {
      const url = activeTab === 'upcoming' ? '/api/meetings?upcoming=true' : '/api/meetings'
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch meetings')
      return res.json()
    },
  })

  const { data: allMeetings } = useQuery({
    queryKey: ['meetings-all-stats'],
    queryFn: async () => {
      const res = await fetch('/api/meetings')
      if (!res.ok) throw new Error('Failed to fetch meetings')
      return res.json()
    },
  })

  const { data: leadsData } = useQuery({
    queryKey: ['leads-for-meeting'],
    queryFn: async () => {
      const res = await fetch('/api/leads?limit=200')
      if (!res.ok) throw new Error('Failed to fetch leads')
      return res.json()
    },
    enabled: showCreate,
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!form.startTime || !form.endTime) throw new Error('Start and end time required')
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          startTime: new Date(form.startTime).toISOString(),
          endTime: new Date(form.endTime).toISOString(),
          meetingUrl: form.meetingUrl || null,
          notes: form.notes || null,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to create meeting')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] })
      setShowCreate(false)
      setForm({ leadId: '', title: '', description: '', type: 'DEMO', startTime: '', endTime: '', meetingUrl: '', notes: '' })
      toast({ title: 'Meeting scheduled' })
    },
    onError: (err: Error) => {
      toast({ title: err.message, variant: 'destructive' })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (payload: { id: string; status?: string; outcome?: string; notes?: string }) => {
      const res = await fetch('/api/meetings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to update meeting')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] })
      setSelectedMeeting(null)
      toast({ title: 'Meeting updated' })
    },
    onError: (err: Error) => {
      toast({ title: err.message, variant: 'destructive' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/meetings?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] })
      setSelectedMeeting(null)
      toast({ title: 'Meeting deleted' })
    },
    onError: (err: Error) => {
      toast({ title: err.message, variant: 'destructive' })
    },
  })

  const meetings: Meeting[] = data?.data ?? []
  const stats = allMeetings?.stats ?? {}
  const leads: Lead[] = leadsData?.data ?? []

  const filteredLeads = leads.filter((l) => {
    const q = leadSearch.toLowerCase()
    return !q || `${l.firstName} ${l.lastName} ${l.email} ${l.company}`.toLowerCase().includes(q)
  })

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })

  const durationMins = (start: string, end: string) =>
    Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000)

  return (
    <>
      <Header
        title="Meetings"
        description="Schedule and track calls, demos, and meetings with your leads"
        action={
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Schedule Meeting
          </Button>
        }
      />

      {/* Create Meeting Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-lg bg-white shadow-xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-base font-semibold">Schedule Meeting</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowCreate(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {/* Lead picker */}
              <div>
                <label className="text-sm font-medium">Lead *</label>
                <Input
                  className="mt-1 mb-1"
                  placeholder="Search leads..."
                  value={leadSearch}
                  onChange={(e) => setLeadSearch(e.target.value)}
                />
                {form.leadId ? (
                  <div className="flex items-center justify-between rounded-md border bg-blue-50 px-3 py-2 text-sm">
                    <span className="font-medium">{leads.find((l) => l.id === form.leadId)?.email ?? form.leadId}</span>
                    <button className="text-gray-400 hover:text-red-500" onClick={() => setForm((f) => ({ ...f, leadId: '' }))}>
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="max-h-40 overflow-y-auto rounded-md border">
                    {filteredLeads.slice(0, 20).map((lead) => (
                      <button
                        key={lead.id}
                        className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-gray-50"
                        onClick={() => { setForm((f) => ({ ...f, leadId: lead.id })); setLeadSearch('') }}
                      >
                        <div>
                          <p className="font-medium">{lead.firstName} {lead.lastName}</p>
                          <p className="text-xs text-gray-400">{lead.email}{lead.company ? ` · ${lead.company}` : ''}</p>
                        </div>
                      </button>
                    ))}
                    {filteredLeads.length === 0 && (
                      <p className="px-3 py-4 text-sm text-gray-400">No leads found</p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium">Title *</label>
                <Input className="mt-1" placeholder="e.g. Product Demo with Acme" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <select
                    className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={form.type}
                    onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                  >
                    <option value="DEMO">Demo</option>
                    <option value="VIDEO_CALL">Video Call</option>
                    <option value="CALL">Phone Call</option>
                    <option value="IN_PERSON">In Person</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Meeting Link</label>
                  <Input className="mt-1" placeholder="https://cal.com/..." value={form.meetingUrl} onChange={(e) => setForm((f) => ({ ...f, meetingUrl: e.target.value }))} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Start *</label>
                  <Input
                    className="mt-1"
                    type="datetime-local"
                    value={form.startTime}
                    onChange={(e) => {
                      const start = e.target.value
                      // Auto-set end to +30min
                      const end = form.endTime || new Date(new Date(start).getTime() + 30 * 60000).toISOString().slice(0, 16)
                      setForm((f) => ({ ...f, startTime: start, endTime: f.endTime || end }))
                    }}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">End *</label>
                  <Input className="mt-1" type="datetime-local" value={form.endTime} onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))} />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Notes</label>
                <textarea
                  className="mt-1 w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Agenda, context, or prep notes..."
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 border-t px-6 py-4">
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button
                onClick={() => createMutation.mutate()}
                disabled={!form.leadId || !form.title || !form.startTime || !form.endTime || createMutation.isPending}
              >
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Schedule Meeting
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Meeting Detail / Update Modal */}
      {selectedMeeting && (
        <MeetingDetailModal
          meeting={selectedMeeting}
          onClose={() => setSelectedMeeting(null)}
          onUpdate={(payload) => updateMutation.mutate(payload)}
          onDelete={(id) => {
            if (confirm('Delete this meeting?')) deleteMutation.mutate(id)
          }}
          isPending={updateMutation.isPending || deleteMutation.isPending}
        />
      )}

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-5">
          {[
            { label: 'Total', value: stats.total ?? 0, icon: Calendar, color: 'blue' },
            { label: 'Upcoming', value: stats.upcoming ?? 0, icon: Clock, color: 'purple' },
            { label: 'This Week', value: stats.thisWeek ?? 0, icon: Calendar, color: 'indigo' },
            { label: 'Completed', value: stats.completed ?? 0, icon: CheckCircle2, color: 'green' },
            { label: 'No Show', value: stats.noShow ?? 0, icon: XCircle, color: 'red' },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label}>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className={`rounded-lg bg-${color}-100 p-2`}>
                    <Icon className={`h-5 w-5 text-${color}-600`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{value}</p>
                    <p className="text-sm text-muted-foreground">{label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b">
          {(['upcoming', 'all'] as const).map((tab) => (
            <button
              key={tab}
              className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'upcoming' ? 'Upcoming' : 'All Meetings'}
            </button>
          ))}
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        )}

        {/* Empty */}
        {!isLoading && meetings.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Calendar className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-4 font-medium text-gray-900">
                {activeTab === 'upcoming' ? 'No upcoming meetings' : 'No meetings yet'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">Schedule a call or demo with a lead to get started.</p>
              <Button className="mt-4" onClick={() => setShowCreate(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Schedule Meeting
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Meeting list */}
        {!isLoading && meetings.length > 0 && (
          <div className="space-y-3">
            {meetings.map((meeting) => {
              const sc = statusConfig[meeting.status] ?? statusConfig.SCHEDULED
              const isPast = new Date(meeting.startTime) < new Date()
              return (
                <Card
                  key={meeting.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedMeeting(meeting)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                          meeting.type === 'DEMO' ? 'bg-blue-50' :
                          meeting.type === 'CALL' ? 'bg-green-50' :
                          meeting.type === 'IN_PERSON' ? 'bg-orange-50' : 'bg-purple-50'
                        }`}>
                          {meetingTypeIcons[meeting.type]}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900">{meeting.title}</h3>
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${sc.bg} ${sc.text}`}>
                              {sc.label}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mt-0.5">
                            {meeting.lead.firstName} {meeting.lead.lastName}
                            {meeting.lead.company && <> · <span className="text-gray-400">{meeting.lead.company}</span></>}
                          </p>
                          <p className="text-sm text-gray-400 mt-1">
                            <Clock className="inline h-3.5 w-3.5 mr-1" />
                            {formatTime(meeting.startTime)} · {durationMins(meeting.startTime, meeting.endTime)} min
                          </p>
                          {meeting.outcome && (
                            <p className="mt-1 text-xs text-green-700 bg-green-50 rounded px-2 py-0.5 inline-block">
                              Outcome: {meeting.outcome}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {meeting.meetingUrl && (
                          <a
                            href={meeting.meetingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-gray-50"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="h-3 w-3" />
                            Join
                          </a>
                        )}
                        {!isPast && meeting.status === 'SCHEDULED' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); updateMutation.mutate({ id: meeting.id, status: 'CONFIRMED' }) }}
                          >
                            Confirm
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}

// ─── Meeting Detail Modal ─────────────────────────────────────────────────────

function MeetingDetailModal({
  meeting,
  onClose,
  onUpdate,
  onDelete,
  isPending,
}: {
  meeting: Meeting
  onClose: () => void
  onUpdate: (p: { id: string; status?: string; outcome?: string; notes?: string }) => void
  onDelete: (id: string) => void
  isPending: boolean
}) {
  const [outcome, setOutcome] = useState(meeting.outcome ?? '')
  const [notes, setNotes] = useState(meeting.notes ?? '')

  const sc = statusConfig[meeting.status] ?? statusConfig.SCHEDULED
  const durationMins = Math.round((new Date(meeting.endTime).getTime() - new Date(meeting.startTime).getTime()) / 60000)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white shadow-xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-2">
            {meetingTypeIcons[meeting.type]}
            <h2 className="text-base font-semibold">{meeting.title}</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${sc.bg} ${sc.text}`}>{sc.label}</span>
            <span className="text-xs text-gray-400">{meeting.type.replace('_', ' ')}</span>
          </div>

          <div className="rounded-lg border p-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Lead</span>
              <span className="font-medium">{meeting.lead.firstName} {meeting.lead.lastName} {meeting.lead.company ? `· ${meeting.lead.company}` : ''}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Time</span>
              <span className="font-medium">{new Date(meeting.startTime).toLocaleString()} ({durationMins} min)</span>
            </div>
            {meeting.meetingUrl && (
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Link</span>
                <a href={meeting.meetingUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline text-xs">
                  Open link <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-medium">Outcome</label>
            <Input className="mt-1" placeholder="e.g. Interested, moving to proposal" value={outcome} onChange={(e) => setOutcome(e.target.value)} />
          </div>

          <div>
            <label className="text-sm font-medium">Notes</label>
            <textarea
              className="mt-1 w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Meeting notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Status actions */}
          {meeting.status !== 'COMPLETED' && meeting.status !== 'CANCELLED' && (
            <div className="flex flex-wrap gap-2">
              {meeting.status !== 'CONFIRMED' && (
                <Button variant="outline" size="sm" onClick={() => onUpdate({ id: meeting.id, status: 'CONFIRMED' })}>
                  Confirm
                </Button>
              )}
              <Button variant="outline" size="sm" className="text-green-700 border-green-300 hover:bg-green-50" onClick={() => onUpdate({ id: meeting.id, status: 'COMPLETED', outcome, notes })}>
                <CheckCircle2 className="mr-1 h-4 w-4" /> Mark Completed
              </Button>
              <Button variant="outline" size="sm" className="text-yellow-700 border-yellow-300 hover:bg-yellow-50" onClick={() => onUpdate({ id: meeting.id, status: 'NO_SHOW' })}>
                No Show
              </Button>
              <Button variant="outline" size="sm" className="text-red-600 border-red-300 hover:bg-red-50" onClick={() => onUpdate({ id: meeting.id, status: 'CANCELLED' })}>
                Cancel
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t px-6 py-4">
          <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => onDelete(meeting.id)} disabled={isPending}>
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Close</Button>
            <Button onClick={() => onUpdate({ id: meeting.id, outcome, notes })} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Notes
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
