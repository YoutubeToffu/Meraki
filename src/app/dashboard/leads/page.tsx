'use client'

import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  MoreHorizontal,
  Mail,
  Phone,
  Linkedin,
  Star,
  StarOff,
  Loader2,
  X,
  Send,
  Zap,
  Check,
  ShieldOff,
  ShieldCheck,
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

const statusColors: Record<string, string> = {
  NEW: 'bg-gray-100 text-gray-700',
  CONTACTED: 'bg-blue-100 text-blue-700',
  QUALIFIED: 'bg-yellow-100 text-yellow-700',
  PROPOSAL: 'bg-purple-100 text-purple-700',
  NEGOTIATION: 'bg-orange-100 text-orange-700',
  WON: 'bg-green-100 text-green-700',
  LOST: 'bg-red-100 text-red-700',
}

const sourceLabels: Record<string, string> = {
  MANUAL: 'Manual',
  LINKEDIN: 'LinkedIn',
  WEBSITE_FORM: 'Website',
  EMAIL_CAMPAIGN: 'Email',
  COLD_OUTREACH: 'Cold Outreach',
  REFERRAL: 'Referral',
  INBOUND: 'Inbound',
  EVENT: 'Event',
  API: 'API',
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-yellow-600'
  if (score >= 40) return 'text-orange-600'
  return 'text-red-600'
}

interface Lead {
  id: string
  firstName: string | null
  lastName: string | null
  email: string
  company: string | null
  jobTitle: string | null
  status: string
  score: number
  source: string
  tags: string[]
  lastContactedAt: string | null
  doNotContact?: boolean
}

async function fetchLeads(params: {
  page: number
  search: string
  status: string
  source: string
}) {
  const query = new URLSearchParams()
  query.set('page', String(params.page))
  query.set('limit', '50')
  if (params.search) query.set('search', params.search)
  if (params.status) query.set('status', params.status)
  if (params.source) query.set('source', params.source)
  const res = await fetch(`/api/leads?${query}`)
  if (!res.ok) throw new Error('Failed to fetch leads')
  return res.json()
}

export default function LeadsPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')
  const [page, setPage] = useState(1)
  const [selectedLeads, setSelectedLeads] = useState<string[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [emailModalOpen, setEmailModalOpen] = useState(false)
  const [emailTargetLeads, setEmailTargetLeads] = useState<Lead[]>([])
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')
  const [seqModalOpen, setSeqModalOpen] = useState(false)
  const [seqTargetLeads, setSeqTargetLeads] = useState<Lead[]>([])
  const [selectedSeqId, setSelectedSeqId] = useState('')
  const [newLead, setNewLead] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    jobTitle: '',
    source: 'MANUAL' as string,
  })

  const { data, isLoading, error } = useQuery({
    queryKey: ['leads', page, searchQuery, statusFilter, sourceFilter],
    queryFn: () =>
      fetchLeads({ page, search: searchQuery, status: statusFilter, source: sourceFilter }),
  })

  const createMutation = useMutation({
    mutationFn: async (leadData: typeof newLead) => {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadData),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to create lead')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      setShowAddModal(false)
      setNewLead({ firstName: '', lastName: '', email: '', company: '', jobTitle: '', source: 'MANUAL' })
      toast({ title: 'Lead created successfully' })
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    },
  })

  const sendEmailMutation = useMutation({
    mutationFn: async (data: { leadIds: string[]; subject: string; body: string }) => {
      const res = await fetch('/api/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to send email')
      }
      return res.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      setEmailModalOpen(false)
      setEmailSubject('')
      setEmailBody('')
      setEmailTargetLeads([])
      setSelectedLeads([])
      toast({ title: data.message || 'Email sent successfully' })
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    },
  })

  const openEmailModal = (targets: Lead[]) => {
    setEmailTargetLeads(targets)
    setEmailSubject('')
    setEmailBody('')
    setEmailModalOpen(true)
  }

  const handleSendEmail = () => {
    if (!emailSubject.trim() || !emailBody.trim()) {
      toast({ title: 'Please fill in subject and body', variant: 'destructive' })
      return
    }
    sendEmailMutation.mutate({
      leadIds: emailTargetLeads.map((l) => l.id),
      subject: emailSubject,
      body: emailBody,
    })
  }

  const { data: seqListData } = useQuery({
    queryKey: ['sequences-list'],
    queryFn: async () => {
      const res = await fetch('/api/sequences')
      if (!res.ok) throw new Error('Failed to fetch sequences')
      return res.json()
    },
    enabled: seqModalOpen,
  })

  const enrollMutation = useMutation({
    mutationFn: async (data: { sequenceId: string; leadIds: string[] }) => {
      const res = await fetch('/api/sequences/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to enroll leads')
      }
      return res.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['sequences'] })
      setSeqModalOpen(false)
      setSelectedSeqId('')
      setSeqTargetLeads([])
      setSelectedLeads([])
      toast({ title: data.message || 'Leads enrolled' })
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    },
  })

  const openSeqModal = (targets: Lead[]) => {
    setSeqTargetLeads(targets)
    setSelectedSeqId('')
    setSeqModalOpen(true)
  }

  const handleEnroll = () => {
    if (!selectedSeqId) {
      toast({ title: 'Please select a sequence', variant: 'destructive' })
      return
    }
    enrollMutation.mutate({
      sequenceId: selectedSeqId,
      leadIds: seqTargetLeads.map((l) => l.id),
    })
  }

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/leads/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete lead')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      toast({ title: 'Lead deleted' })
    },
  })

  const toggleDncMutation = useMutation({
    mutationFn: async ({ id, doNotContact }: { id: string; doNotContact: boolean }) => {
      const res = await fetch(`/api/leads/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doNotContact }),
      })
      if (!res.ok) throw new Error('Failed to update lead')
      return res.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      toast({ title: variables.doNotContact ? 'Marked as Do Not Contact' : 'Removed Do Not Contact flag' })
    },
  })

  const leads: Lead[] = data?.data || []
  const pagination = data?.pagination || { page: 1, total: 0, totalPages: 1 }

  const toggleSelectAll = () => {
    if (selectedLeads.length === leads.length) {
      setSelectedLeads([])
    } else {
      setSelectedLeads(leads.map((l) => l.id))
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedLeads((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = () => {
    const allLeads: Lead[] = data?.data || []
    if (allLeads.length === 0) {
      toast({ title: 'No leads to export', variant: 'destructive' })
      return
    }
    const headers = ['First Name','Last Name','Email','Company','Job Title','Status','Score','Source','Tags','Do Not Contact','Last Contacted']
    const rows = allLeads.map((l) => [
      l.firstName || '',
      l.lastName || '',
      l.email,
      l.company || '',
      l.jobTitle || '',
      l.status,
      String(l.score),
      l.source,
      (l.tags || []).join(';'),
      l.doNotContact ? 'Yes' : 'No',
      l.lastContactedAt || '',
    ])
    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `leads-export-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast({ title: `Exported ${allLeads.length} leads` })
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    const text = await file.text()
    const lines = text.split(/\r?\n/).filter((l) => l.trim())
    if (lines.length < 2) {
      toast({ title: 'CSV must have a header row and at least one data row', variant: 'destructive' })
      return
    }

    const hdrs = parseCSVRow(lines[0]).map((h) => h.toLowerCase().trim())
    const colMap: Record<string, string[]> = {
      email: ['email', 'email address', 'e-mail'],
      firstName: ['first name', 'firstname', 'first', 'given name'],
      lastName: ['last name', 'lastname', 'last', 'surname', 'family name'],
      company: ['company', 'organization', 'org', 'company name'],
      jobTitle: ['job title', 'jobtitle', 'title', 'position', 'role'],
      phone: ['phone', 'phone number', 'mobile', 'tel'],
      linkedinUrl: ['linkedin', 'linkedin url', 'linkedinurl', 'linkedin profile'],
      source: ['source', 'lead source'],
    }
    const getIdx = (field: string): number => {
      const aliases = colMap[field] || [field]
      return hdrs.findIndex((h) => aliases.includes(h))
    }
    const emailIdx = getIdx('email')
    if (emailIdx === -1) {
      toast({ title: 'CSV must have an "Email" column', variant: 'destructive' })
      return
    }

    let imported = 0
    let failed = 0
    for (let i = 1; i < lines.length; i++) {
      const cols = parseCSVRow(lines[i])
      const email = cols[emailIdx]?.trim()
      if (!email || !email.includes('@')) { failed++; continue }

      const leadData: Record<string, string> = { email }
      const map: [string, number][] = [
        ['firstName', getIdx('firstName')],
        ['lastName', getIdx('lastName')],
        ['company', getIdx('company')],
        ['jobTitle', getIdx('jobTitle')],
        ['phone', getIdx('phone')],
        ['linkedinUrl', getIdx('linkedinUrl')],
      ]
      for (const [key, idx] of map) {
        if (idx >= 0 && cols[idx]?.trim()) leadData[key] = cols[idx].trim()
      }
      const srcIdx = getIdx('source')
      if (srcIdx >= 0 && cols[srcIdx]) {
        const v = cols[srcIdx].trim().toUpperCase().replace(/\s+/g, '_')
        if (['MANUAL','LINKEDIN','WEBSITE_FORM','EMAIL_CAMPAIGN','COLD_OUTREACH','REFERRAL','INBOUND','EVENT','API'].includes(v)) leadData.source = v
      }

      try {
        const res = await fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(leadData),
        })
        if (res.ok) imported++; else failed++
      } catch { failed++ }
    }

    queryClient.invalidateQueries({ queryKey: ['leads'] })
    toast({ title: `Import complete: ${imported} added, ${failed} skipped` })
  }

  function parseCSVRow(row: string): string[] {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < row.length; i++) {
      const ch = row[i]
      if (inQuotes) {
        if (ch === '"') {
          if (row[i + 1] === '"') { current += '"'; i++ }
          else inQuotes = false
        } else current += ch
      } else {
        if (ch === '"') inQuotes = true
        else if (ch === ',') { result.push(current); current = '' }
        else current += ch
      }
    }
    result.push(current)
    return result
  }

  return (
    <>
      <Header
        title="Leads"
        description="Manage and nurture your prospects"
        action={
          <div className="flex items-center space-x-2">
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv"
              className="hidden"
              onChange={handleImport}
            />
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Upload className="mr-2 h-4 w-4" />
              Import
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Lead
            </Button>
          </div>
        }
      />

      {/* Add Lead Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Add New Lead</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowAddModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                createMutation.mutate(newLead)
              }}
              className="space-y-3"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">First Name</label>
                  <Input
                    value={newLead.firstName}
                    onChange={(e) => setNewLead({ ...newLead, firstName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Last Name</label>
                  <Input
                    value={newLead.lastName}
                    onChange={(e) => setNewLead({ ...newLead, lastName: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Email *</label>
                <Input
                  type="email"
                  required
                  value={newLead.email}
                  onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Company</label>
                <Input
                  value={newLead.company}
                  onChange={(e) => setNewLead({ ...newLead, company: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Job Title</label>
                <Input
                  value={newLead.jobTitle}
                  onChange={(e) => setNewLead({ ...newLead, jobTitle: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Source</label>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={newLead.source}
                  onChange={(e) => setNewLead({ ...newLead, source: e.target.value })}
                >
                  {Object.entries(sourceLabels).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</>
                  ) : (
                    'Add Lead'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="p-6 space-y-4">
        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search leads by name, email, or company..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setPage(1)
                  }}
                  className="pl-9"
                />
              </div>
              <select
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
              >
                <option value="">All Statuses</option>
                <option value="NEW">New</option>
                <option value="CONTACTED">Contacted</option>
                <option value="QUALIFIED">Qualified</option>
                <option value="PROPOSAL">Proposal</option>
                <option value="NEGOTIATION">Negotiation</option>
                <option value="WON">Won</option>
                <option value="LOST">Lost</option>
              </select>
              <select
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={sourceFilter}
                onChange={(e) => { setSourceFilter(e.target.value); setPage(1) }}
              >
                <option value="">All Sources</option>
                <option value="LINKEDIN">LinkedIn</option>
                <option value="WEBSITE_FORM">Website Form</option>
                <option value="EMAIL_CAMPAIGN">Email Campaign</option>
                <option value="REFERRAL">Referral</option>
                <option value="MANUAL">Manual</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Actions */}
        {selectedLeads.length > 0 && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-700">
                  {selectedLeads.length} lead(s) selected
                </span>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const targets = leads.filter((l) => selectedLeads.includes(l.id))
                      openEmailModal(targets)
                    }}
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Send Email
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const targets = leads.filter((l) => selectedLeads.includes(l.id))
                      openSeqModal(targets)
                    }}
                  >
                    <Zap className="mr-2 h-4 w-4" />
                    Add to Sequence
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      selectedLeads.forEach((id) => deleteMutation.mutate(id))
                      setSelectedLeads([])
                    }}
                    className="text-red-600 hover:text-red-700"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-red-600">Failed to load leads. Please try again.</p>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!isLoading && !error && leads.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                <Plus className="h-6 w-6 text-gray-600" />
              </div>
              <h3 className="mt-4 font-medium">No leads yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by adding your first lead.
              </p>
              <Button className="mt-4" onClick={() => setShowAddModal(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Lead
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Leads Table */}
        {!isLoading && leads.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedLeads.length === leads.length && leads.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                      Company
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                      Score
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                      Source
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                      Tags
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedLeads.includes(lead.id)}
                          onChange={() => toggleSelect(lead.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-600">
                            {(lead.firstName?.[0] || '?')}
                            {(lead.lastName?.[0] || '')}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {lead.firstName || ''} {lead.lastName || ''}
                            </p>
                            <p className="text-sm text-gray-500">{lead.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{lead.company || '—'}</p>
                        <p className="text-sm text-gray-500">{lead.jobTitle || ''}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-1">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              statusColors[lead.status] || 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {lead.status.charAt(0) + lead.status.slice(1).toLowerCase()}
                          </span>
                          {lead.doNotContact && (
                            <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700">
                              <ShieldOff className="mr-0.5 h-3 w-3" />DNC
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <span className={`font-semibold ${getScoreColor(lead.score)}`}>
                            {lead.score}
                          </span>
                          {lead.score >= 80 ? (
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          ) : (
                            <StarOff className="h-4 w-4 text-gray-300" />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600">
                          {sourceLabels[lead.source] || lead.source}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {lead.tags?.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEmailModal([lead])}
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Phone className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Linkedin className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-8 w-8 ${lead.doNotContact ? 'text-red-500' : 'text-gray-400'}`}
                            title={lead.doNotContact ? 'Remove Do Not Contact' : 'Mark Do Not Contact'}
                            onClick={() => toggleDncMutation.mutate({ id: lead.id, doNotContact: !lead.doNotContact })}
                          >
                            {lead.doNotContact ? <ShieldCheck className="h-4 w-4" /> : <ShieldOff className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-700"
                            onClick={() => deleteMutation.mutate(lead.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t px-4 py-3">
              <p className="text-sm text-gray-500">
                Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
              </p>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        )}
      </div>

      {/* Add to Sequence Modal */}
      <Dialog open={seqModalOpen} onOpenChange={setSeqModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to Sequence</DialogTitle>
            <DialogDescription>
              Enroll {seqTargetLeads.length} lead(s) into an automated sequence
            </DialogDescription>
          </DialogHeader>
          {seqTargetLeads.length > 1 && (
            <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
              {seqTargetLeads.map((l) => (
                <span
                  key={l.id}
                  className="inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700"
                >
                  {l.firstName || ''} {l.lastName || ''}
                </span>
              ))}
            </div>
          )}
          <div className="space-y-3 pt-2">
            <div>
              <label className="text-sm font-medium">Select Sequence</label>
              {(seqListData?.data || []).length === 0 ? (
                <p className="text-sm text-gray-500 mt-1">
                  No sequences yet. Create one in the Sequences tab first.
                </p>
              ) : (
                <div className="mt-1 space-y-2 max-h-[300px] overflow-y-auto">
                  {(seqListData?.data || []).map((seq: any) => (
                    <div
                      key={seq.id}
                      onClick={() => setSelectedSeqId(seq.id)}
                      className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                        selectedSeqId === seq.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{seq.name}</p>
                          <p className="text-xs text-gray-500">
                            {seq.stepsCount} steps · {seq.enrolledCount} enrolled ·{' '}
                            <span
                              className={`font-medium ${
                                seq.status === 'ACTIVE'
                                  ? 'text-green-600'
                                  : seq.status === 'PAUSED'
                                  ? 'text-yellow-600'
                                  : 'text-gray-600'
                              }`}
                            >
                              {seq.status.charAt(0) + seq.status.slice(1).toLowerCase()}
                            </span>
                          </p>
                        </div>
                        {selectedSeqId === seq.id && (
                          <Check className="h-5 w-5 text-blue-600" />
                        )}
                      </div>
                      {seq.description && (
                        <p className="mt-1 text-xs text-gray-400">{seq.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <Button variant="outline" onClick={() => setSeqModalOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleEnroll}
                disabled={!selectedSeqId || enrollMutation.isPending}
              >
                {enrollMutation.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enrolling...</>
                ) : (
                  <><Zap className="mr-2 h-4 w-4" />Enroll</>  
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Email Compose Modal */}
      <Dialog open={emailModalOpen} onOpenChange={setEmailModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Email</DialogTitle>
            <DialogDescription>
              {emailTargetLeads.length === 1
                ? `To: ${emailTargetLeads[0].firstName || ''} ${emailTargetLeads[0].lastName || ''} (${emailTargetLeads[0].email})`
                : `To: ${emailTargetLeads.length} recipients`}
            </DialogDescription>
          </DialogHeader>
          {emailTargetLeads.length > 1 && (
            <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
              {emailTargetLeads.map((l) => (
                <span
                  key={l.id}
                  className="inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700"
                >
                  {l.email}
                </span>
              ))}
            </div>
          )}
          <div className="space-y-3 pt-2">
            <div>
              <label className="text-sm font-medium">Subject</label>
              <Input
                placeholder="Email subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Body</label>
              <textarea
                className="w-full min-h-[160px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Write your email..."
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
              />
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <Button variant="outline" onClick={() => setEmailModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSendEmail} disabled={sendEmailMutation.isPending}>
                {sendEmailMutation.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</>
                ) : (
                  <><Send className="mr-2 h-4 w-4" />Send Email</>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
