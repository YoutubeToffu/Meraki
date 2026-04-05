'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  Bot,
  Plus,
  Play,
  Pause,
  Trash2,
  X,
  Loader2,
  Users,
  Mail,
  Eye,
  MessageSquare,
  Sparkles,
  Zap,
  Brain,
  Target,
  TrendingUp,
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  ACTIVE: { bg: 'bg-green-100', text: 'text-green-700', label: 'Running' },
  PAUSED: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Paused' },
  COMPLETED: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Done' },
}

const toneOptions = [
  { value: 'professional', label: 'Professional' },
  { value: 'casual', label: 'Casual' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'formal', label: 'Formal' },
  { value: 'founder-to-founder', label: 'Founder-to-Founder' },
  { value: 'recruiter', label: 'Recruiter' },
  { value: 'executive', label: 'Executive' },
]

interface AiCampaign {
  id: string
  name: string
  goal: string
  context: string
  targetAudience: string | null
  tone: string
  maxEmails: number
  dailyLimit: number
  status: string
  learnings: any
  createdAt: string
  stats: {
    totalLeads: number
    activeLeads: number
    stoppedLeads: number
    totalSent: number
    totalOpened: number
    totalReplied: number
  }
}

export default function AutopilotPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const [showWizard, setShowWizard] = useState(false)
  const [wizardStep, setWizardStep] = useState(1)

  // Form state
  const [name, setName] = useState('')
  const [goal, setGoal] = useState('')
  const [context, setContext] = useState('')
  const [targetAudience, setTargetAudience] = useState('')
  const [tone, setTone] = useState('professional')
  const [maxEmails, setMaxEmails] = useState(7)
  const [dailyLimit, setDailyLimit] = useState(50)
  const [useAllLeads, setUseAllLeads] = useState(true)
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([])
  const [leadSearch, setLeadSearch] = useState('')

  const { data: campaignsData, isLoading } = useQuery({
    queryKey: ['autopilot-campaigns'],
    queryFn: async () => {
      const res = await fetch('/api/autopilot')
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    },
  })

  const { data: leadsData } = useQuery({
    queryKey: ['autopilot-leads', leadSearch],
    queryFn: async () => {
      const q = leadSearch ? `?search=${encodeURIComponent(leadSearch)}&limit=200` : '?limit=200'
      const res = await fetch(`/api/leads${q}`)
      if (!res.ok) throw new Error('Failed to fetch leads')
      return res.json()
    },
    enabled: showWizard && !useAllLeads,
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/autopilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          goal,
          context,
          targetAudience: targetAudience || undefined,
          tone,
          maxEmails,
          dailyLimit,
          leadIds: useAllLeads ? undefined : selectedLeadIds,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to create')
      }
      return res.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['autopilot-campaigns'] })
      closeWizard()
      toast({ title: data.message || 'AI Autopilot launched!' })
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    },
  })

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch('/api/autopilot', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      if (!res.ok) throw new Error('Failed to update')
      return res.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['autopilot-campaigns'] })
      toast({ title: data.message })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/autopilot?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      return res.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['autopilot-campaigns'] })
      toast({ title: data.message })
    },
  })

  const processMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/autopilot/process', { method: 'POST' })
      if (!res.ok) throw new Error('Failed to process')
      return res.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['autopilot-campaigns'] })
      toast({ title: data.message })
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    },
  })

  const closeWizard = () => {
    setShowWizard(false)
    setWizardStep(1)
    setName('')
    setGoal('')
    setContext('')
    setTargetAudience('')
    setTone('professional')
    setMaxEmails(7)
    setDailyLimit(50)
    setUseAllLeads(true)
    setSelectedLeadIds([])
    setLeadSearch('')
  }

  const campaigns: AiCampaign[] = campaignsData?.data || []
  const leads: any[] = leadsData?.data || []

  const totalLeads = campaigns.reduce((s, c) => s + c.stats.totalLeads, 0)
  const totalSent = campaigns.reduce((s, c) => s + c.stats.totalSent, 0)
  const totalReplied = campaigns.reduce((s, c) => s + c.stats.totalReplied, 0)

  const canNext = () => {
    if (wizardStep === 1) return name.trim().length > 0
    if (wizardStep === 2) return goal.trim().length >= 10 && context.trim().length >= 10
    if (wizardStep === 3) return useAllLeads || selectedLeadIds.length > 0
    return true
  }

  return (
    <>
      <Header title="AI Autopilot" />
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Bot className="h-7 w-7 text-purple-600" /> AI Autopilot
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Tell AI your goal — it handles everything: picks leads, writes emails, follows up, adapts, and stops when done.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => processMutation.mutate()}
              disabled={processMutation.isPending}
            >
              {processMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
              Run Now
            </Button>
            <Button onClick={() => setShowWizard(true)}>
              <Plus className="mr-2 h-4 w-4" /> New Autopilot
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Active Campaigns</p>
                  <p className="text-2xl font-bold">{campaigns.filter((c) => c.status === 'ACTIVE').length}</p>
                </div>
                <Bot className="h-8 w-8 text-purple-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Leads Enrolled</p>
                  <p className="text-2xl font-bold">{totalLeads}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">AI Emails Sent</p>
                  <p className="text-2xl font-bold">{totalSent}</p>
                </div>
                <Mail className="h-8 w-8 text-green-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Replies</p>
                  <p className="text-2xl font-bold">{totalReplied}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-orange-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Wizard Modal */}
        {showWizard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-600" /> Launch AI Autopilot
                </h2>
                <Button variant="ghost" size="icon" onClick={closeWizard}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Progress */}
              <div className="flex items-center mb-6 space-x-2">
                {[1, 2, 3, 4].map((s) => (
                  <div key={s} className="flex items-center">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      wizardStep >= s ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-500'
                    }`}>
                      {s}
                    </div>
                    {s < 4 && <div className={`w-12 h-0.5 ${wizardStep > s ? 'bg-purple-600' : 'bg-gray-200'}`} />}
                  </div>
                ))}
                <div className="text-xs text-gray-500 ml-2">
                  {wizardStep === 1 && 'Name'}
                  {wizardStep === 2 && 'Goal & Context'}
                  {wizardStep === 3 && 'Leads'}
                  {wizardStep === 4 && 'Review & Launch'}
                </div>
              </div>

              {/* Step 1: Name & Tone */}
              {wizardStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Campaign Name</label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. VP HR Outreach Q2"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email Tone</label>
                    <select
                      className="w-full h-10 rounded-md border bg-white px-3 text-sm"
                      value={tone}
                      onChange={(e) => setTone(e.target.value)}
                    >
                      {toneOptions.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Max Emails per Lead</label>
                      <Input
                        type="number"
                        min={1}
                        max={20}
                        value={maxEmails}
                        onChange={(e) => setMaxEmails(parseInt(e.target.value) || 7)}
                      />
                      <p className="text-[10px] text-gray-400 mt-1">AI will stop after this many emails if no reply</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Daily Email Limit</label>
                      <Input
                        type="number"
                        min={1}
                        max={500}
                        value={dailyLimit}
                        onChange={(e) => setDailyLimit(parseInt(e.target.value) || 50)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Goal & Context */}
              {wizardStep === 2 && (
                <div className="space-y-4">
                  <div className="rounded-md bg-purple-50 border border-purple-200 p-3 text-sm text-purple-800">
                    <Sparkles className="inline h-4 w-4 mr-1" />
                    Tell AI what you want to achieve. Be specific — the better the context, the better the emails.
                  </div>
                  <div>
                    <label className="text-sm font-medium">Goal — What do you want to achieve?</label>
                    <textarea
                      className="w-full min-h-[80px] rounded-md border bg-white px-3 py-2 text-sm"
                      value={goal}
                      onChange={(e) => setGoal(e.target.value)}
                      placeholder="e.g. Book demo calls with VP-level HR leaders at mid-market companies (500-5000 employees) to show them our AI recruiting platform that reduces time-to-hire by 40%"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Context — Tell AI about your product/service</label>
                    <textarea
                      className="w-full min-h-[100px] rounded-md border bg-white px-3 py-2 text-sm"
                      value={context}
                      onChange={(e) => setContext(e.target.value)}
                      placeholder="e.g. We are TalentPro, an AI-powered recruiting platform. Our key benefits: 40% faster time-to-hire, AI resume screening, automated interview scheduling, diversity-focused sourcing. We serve companies with 500-5000 employees. Pricing starts at $499/mo. We have case studies from Acme Corp (reduced hiring costs by 60%) and TechFlow (hired 50 engineers in 3 months)."
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Target Audience (optional)</label>
                    <textarea
                      className="w-full min-h-[60px] rounded-md border bg-white px-3 py-2 text-sm"
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value)}
                      placeholder="e.g. VP of HR, CHRO, Head of Talent Acquisition at mid-market SaaS companies in the US"
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Leads */}
              {wizardStep === 3 && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <button
                      className={`flex-1 rounded-lg border-2 p-4 text-left transition-colors ${
                        useAllLeads ? 'border-purple-600 bg-purple-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setUseAllLeads(true)}
                    >
                      <Users className="h-5 w-5 text-purple-600 mb-1" />
                      <p className="font-medium text-sm">All Eligible Leads</p>
                      <p className="text-[11px] text-gray-500">AI will scan all your leads and decide who to email</p>
                    </button>
                    <button
                      className={`flex-1 rounded-lg border-2 p-4 text-left transition-colors ${
                        !useAllLeads ? 'border-purple-600 bg-purple-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setUseAllLeads(false)}
                    >
                      <Target className="h-5 w-5 text-purple-600 mb-1" />
                      <p className="font-medium text-sm">Select Specific Leads</p>
                      <p className="text-[11px] text-gray-500">Choose which leads to include in this campaign</p>
                    </button>
                  </div>

                  {!useAllLeads && (
                    <div className="space-y-2">
                      <Input
                        value={leadSearch}
                        onChange={(e) => setLeadSearch(e.target.value)}
                        placeholder="Search leads..."
                      />
                      <div className="max-h-60 overflow-y-auto rounded-md border">
                        {leads.map((lead: any) => (
                          <label
                            key={lead.id}
                            className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                          >
                            <input
                              type="checkbox"
                              checked={selectedLeadIds.includes(lead.id)}
                              onChange={() =>
                                setSelectedLeadIds((prev) =>
                                  prev.includes(lead.id) ? prev.filter((i) => i !== lead.id) : [...prev, lead.id]
                                )
                              }
                              className="rounded"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {lead.firstName || ''} {lead.lastName || ''} {!lead.firstName && !lead.lastName && lead.email}
                              </p>
                              <p className="text-[11px] text-gray-500 truncate">
                                {lead.jobTitle ? `${lead.jobTitle} at ` : ''}{lead.company || lead.email}
                              </p>
                            </div>
                          </label>
                        ))}
                        {leads.length === 0 && (
                          <p className="text-sm text-gray-400 text-center py-4">No leads found</p>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{selectedLeadIds.length} selected</p>
                    </div>
                  )}
                </div>
              )}

              {/* Step 4: Review */}
              {wizardStep === 4 && (
                <div className="space-y-4">
                  <div className="rounded-lg border bg-gradient-to-r from-purple-50 to-blue-50 p-4 space-y-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Brain className="h-4 w-4 text-purple-600" /> Review & Launch
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500">Name:</span>{' '}
                        <span className="font-medium">{name}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Tone:</span>{' '}
                        <span className="font-medium capitalize">{tone}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Max Emails:</span>{' '}
                        <span className="font-medium">{maxEmails} per lead</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Daily Limit:</span>{' '}
                        <span className="font-medium">{dailyLimit}/day</span>
                      </div>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-500">Goal:</span>
                      <p className="mt-1 text-gray-800">{goal}</p>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-500">Context:</span>
                      <p className="mt-1 text-gray-800">{context}</p>
                    </div>
                    {targetAudience && (
                      <div className="text-sm">
                        <span className="text-gray-500">Target:</span>
                        <p className="mt-1 text-gray-800">{targetAudience}</p>
                      </div>
                    )}
                    <div className="text-sm">
                      <span className="text-gray-500">Leads:</span>{' '}
                      <span className="font-medium">{useAllLeads ? 'All eligible leads' : `${selectedLeadIds.length} selected`}</span>
                    </div>
                  </div>

                  <div className="rounded-md bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
                    <Sparkles className="inline h-4 w-4 mr-1" />
                    Once launched, AI will autonomously email your leads, adapt follow-ups based on engagement, and stop when it gets a reply or exhausts attempts. You can pause or stop anytime.
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between mt-6">
                <Button
                  variant="outline"
                  onClick={() => wizardStep > 1 ? setWizardStep(wizardStep - 1) : closeWizard()}
                >
                  {wizardStep === 1 ? 'Cancel' : 'Back'}
                </Button>
                {wizardStep < 4 ? (
                  <Button onClick={() => setWizardStep(wizardStep + 1)} disabled={!canNext()}>
                    Next
                  </Button>
                ) : (
                  <Button
                    onClick={() => createMutation.mutate()}
                    disabled={createMutation.isPending}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {createMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Bot className="mr-2 h-4 w-4" />
                    )}
                    Launch Autopilot
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Campaign List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : campaigns.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-20">
              <Bot className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600">No AI Autopilot campaigns yet</h3>
              <p className="text-sm text-gray-400 mt-1 max-w-md text-center">
                Launch your first autonomous campaign. Tell AI your goal and context — it handles everything else.
              </p>
              <Button className="mt-4" onClick={() => setShowWizard(true)}>
                <Plus className="mr-2 h-4 w-4" /> Launch First Autopilot
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {campaigns.map((campaign) => {
              const sc = statusColors[campaign.status] || statusColors.ACTIVE
              const openRate = campaign.stats.totalSent > 0
                ? Math.round((campaign.stats.totalOpened / campaign.stats.totalSent) * 100)
                : 0
              const replyRate = campaign.stats.totalSent > 0
                ? Math.round((campaign.stats.totalReplied / campaign.stats.totalSent) * 100)
                : 0

              return (
                <Card key={campaign.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="p-5">
                      {/* Title row */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                            <Bot className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{campaign.name}</h3>
                            <p className="text-xs text-gray-500 max-w-md truncate">{campaign.goal}</p>
                          </div>
                        </div>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${sc.bg} ${sc.text}`}>
                          {campaign.status === 'ACTIVE' && <span className="mr-1 h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />}
                          {sc.label}
                        </span>
                      </div>

                      {/* Stats grid */}
                      <div className="grid grid-cols-5 gap-4 mb-4">
                        <div className="text-center">
                          <p className="text-lg font-bold">{campaign.stats.totalLeads}</p>
                          <p className="text-[10px] text-gray-500">Leads</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold">{campaign.stats.totalSent}</p>
                          <p className="text-[10px] text-gray-500">Sent</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold">{openRate}%</p>
                          <p className="text-[10px] text-gray-500">Open Rate</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-green-600">{campaign.stats.totalReplied}</p>
                          <p className="text-[10px] text-gray-500">Replies</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold">{replyRate}%</p>
                          <p className="text-[10px] text-gray-500">Reply Rate</p>
                        </div>
                      </div>

                      {/* AI Learning indicator */}
                      {campaign.learnings?.lastProcessedAt && (
                        <div className="rounded-md bg-gray-50 border px-3 py-2 text-[11px] text-gray-500 mb-3 flex items-center gap-1">
                          <Brain className="h-3 w-3" />
                          Last processed: {new Date(campaign.learnings.lastProcessedAt).toLocaleString()}
                          {campaign.stats.activeLeads > 0 && ` · ${campaign.stats.activeLeads} leads actively being worked`}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {campaign.status === 'ACTIVE' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => statusMutation.mutate({ id: campaign.id, status: 'PAUSED' })}
                          >
                            <Pause className="mr-1 h-3 w-3" /> Pause
                          </Button>
                        )}
                        {campaign.status === 'PAUSED' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => statusMutation.mutate({ id: campaign.id, status: 'ACTIVE' })}
                          >
                            <Play className="mr-1 h-3 w-3" /> Resume
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => {
                            if (confirm(`Delete "${campaign.name}"? This cannot be undone.`)) {
                              deleteMutation.mutate(campaign.id)
                            }
                          }}
                        >
                          <Trash2 className="mr-1 h-3 w-3" /> Delete
                        </Button>
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
