'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  X,
  Loader2,
  Send,
  Save,
  ChevronRight,
  ChevronLeft,
  Check,
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

const statusColors: Record<string, { bg: string; text: string }> = {
  DRAFT: { bg: 'bg-gray-100', text: 'text-gray-700' },
  SCHEDULED: { bg: 'bg-blue-100', text: 'text-blue-700' },
  ACTIVE: { bg: 'bg-green-100', text: 'text-green-700' },
  PAUSED: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  COMPLETED: { bg: 'bg-purple-100', text: 'text-purple-700' },
}

const typeLabels: Record<string, string> = {
  EMAIL_BLAST: 'Email Blast',
  DRIP: 'Drip',
  NEWSLETTER: 'Newsletter',
  PRODUCT_UPDATE: 'Product Update',
  EVENT: 'Event',
}

interface Campaign {
  id: string
  name: string
  description: string | null
  type: string
  status: string
  totalSent: number
  totalOpened: number
  totalClicked: number
  totalReplied: number
  startDate: string | null
  endDate: string | null
  createdAt: string
}

interface Template {
  id: string
  name: string
  subject: string
  body: string
  category: string | null
}

interface Lead {
  id: string
  firstName: string | null
  lastName: string | null
  email: string
  company: string | null
  status: string
  score: number
}

export default function CampaignsPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [showWizard, setShowWizard] = useState(false)
  const [wizardStep, setWizardStep] = useState(1) // 1: details, 2: template, 3: leads, 4: review
  const [campaignName, setCampaignName] = useState('')
  const [campaignDesc, setCampaignDesc] = useState('')
  const [campaignType, setCampaignType] = useState('EMAIL_BLAST')
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([])
  const [leadSearch, setLeadSearch] = useState('')

  const { data: campaignsData, isLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const res = await fetch('/api/campaigns')
      if (!res.ok) throw new Error('Failed to fetch campaigns')
      return res.json()
    },
  })

  const { data: templatesData } = useQuery({
    queryKey: ['templates-all'],
    queryFn: async () => {
      const res = await fetch('/api/templates')
      if (!res.ok) throw new Error('Failed to fetch templates')
      return res.json()
    },
    enabled: showWizard,
  })

  const { data: leadsData } = useQuery({
    queryKey: ['leads-all', leadSearch],
    queryFn: async () => {
      const q = leadSearch ? `?search=${encodeURIComponent(leadSearch)}&limit=100` : '?limit=100'
      const res = await fetch(`/api/leads${q}`)
      if (!res.ok) throw new Error('Failed to fetch leads')
      return res.json()
    },
    enabled: showWizard,
  })

  const createMutation = useMutation({
    mutationFn: async (sendNow: boolean) => {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: campaignName,
          description: campaignDesc || undefined,
          type: campaignType,
          templateId: selectedTemplateId,
          leadIds: selectedLeadIds,
          sendNow,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to create campaign')
      }
      return res.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      closeWizard()
      toast({ title: data.message || 'Campaign created' })
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    },
  })

  const closeWizard = () => {
    setShowWizard(false)
    setWizardStep(1)
    setCampaignName('')
    setCampaignDesc('')
    setCampaignType('EMAIL_BLAST')
    setSelectedTemplateId('')
    setSelectedLeadIds([])
    setLeadSearch('')
  }

  const campaigns: Campaign[] = campaignsData?.data || []
  const templates: Template[] = templatesData?.data || []
  const leads: Lead[] = leadsData?.data || []
  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId)

  const totalSent = campaigns.reduce((s, c) => s + c.totalSent, 0)
  const totalOpened = campaigns.reduce((s, c) => s + c.totalOpened, 0)
  const totalClicked = campaigns.reduce((s, c) => s + c.totalClicked, 0)

  const calculateRate = (value: number, total: number) => {
    if (total === 0) return 0
    return Math.round((value / total) * 100)
  }

  const canNext = () => {
    if (wizardStep === 1) return campaignName.trim().length > 0
    if (wizardStep === 2) return !!selectedTemplateId
    if (wizardStep === 3) return selectedLeadIds.length > 0
    return true
  }

  const toggleAllLeads = () => {
    if (selectedLeadIds.length === leads.length) {
      setSelectedLeadIds([])
    } else {
      setSelectedLeadIds(leads.map((l) => l.id))
    }
  }

  const toggleLead = (id: string) => {
    setSelectedLeadIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  return (
    <>
      <Header
        title="Campaigns"
        description="Create and manage email campaigns"
        action={
          <Button onClick={() => setShowWizard(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Campaign
          </Button>
        }
      />

      {/* Campaign Creation Wizard */}
      {showWizard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-2xl rounded-lg bg-white shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold">Create Campaign</h2>
                <p className="text-sm text-gray-500">Step {wizardStep} of 4</p>
              </div>
              <Button variant="ghost" size="icon" onClick={closeWizard}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Progress */}
            <div className="flex border-b">
              {['Details', 'Template', 'Recipients', 'Review'].map((label, i) => (
                <div
                  key={label}
                  className={`flex-1 py-2 text-center text-xs font-medium ${
                    i + 1 === wizardStep
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : i + 1 < wizardStep
                      ? 'text-green-600'
                      : 'text-gray-400'
                  }`}
                >
                  {i + 1 < wizardStep ? <Check className="inline h-3 w-3 mr-1" /> : null}
                  {label}
                </div>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Step 1: Details */}
              {wizardStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Campaign Name *</label>
                    <Input
                      value={campaignName}
                      onChange={(e) => setCampaignName(e.target.value)}
                      placeholder="e.g. Q1 Product Launch"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <textarea
                      className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={campaignDesc}
                      onChange={(e) => setCampaignDesc(e.target.value)}
                      placeholder="What is this campaign about?"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Type</label>
                    <select
                      className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={campaignType}
                      onChange={(e) => setCampaignType(e.target.value)}
                    >
                      {Object.entries(typeLabels).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Step 2: Template */}
              {wizardStep === 2 && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500">Select an email template for this campaign</p>
                  {templates.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Mail className="mx-auto h-8 w-8 mb-2" />
                      <p>No templates yet. Create one in the Templates or AI Assistant tab first.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {templates.map((t) => (
                        <div
                          key={t.id}
                          onClick={() => setSelectedTemplateId(t.id)}
                          className={`cursor-pointer rounded-lg border p-4 transition-colors ${
                            selectedTemplateId === t.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{t.name}</p>
                              <p className="text-sm text-gray-500">Subject: {t.subject}</p>
                            </div>
                            {selectedTemplateId === t.id && (
                              <Check className="h-5 w-5 text-blue-600" />
                            )}
                          </div>
                          {selectedTemplateId === t.id && (
                            <div className="mt-3 rounded border bg-white p-3">
                              <pre className="whitespace-pre-wrap text-xs text-gray-600">
                                {t.body.slice(0, 200)}
                                {t.body.length > 200 ? '...' : ''}
                              </pre>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Leads */}
              {wizardStep === 3 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                      Select recipients ({selectedLeadIds.length} selected)
                    </p>
                    <Button variant="outline" size="sm" onClick={toggleAllLeads}>
                      {selectedLeadIds.length === leads.length ? 'Deselect All' : 'Select All'}
                    </Button>
                  </div>
                  <Input
                    placeholder="Search leads..."
                    value={leadSearch}
                    onChange={(e) => setLeadSearch(e.target.value)}
                  />
                  {leads.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="mx-auto h-8 w-8 mb-2" />
                      <p>No leads found. Add leads in the Leads tab first.</p>
                    </div>
                  ) : (
                    <div className="max-h-[300px] overflow-y-auto space-y-1">
                      {leads.map((lead) => (
                        <div
                          key={lead.id}
                          onClick={() => toggleLead(lead.id)}
                          className={`flex items-center space-x-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                            selectedLeadIds.includes(lead.id)
                              ? 'border-blue-500 bg-blue-50'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedLeadIds.includes(lead.id)}
                            onChange={() => toggleLead(lead.id)}
                            className="rounded border-gray-300"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {lead.firstName || ''} {lead.lastName || ''}{' '}
                              <span className="text-gray-400 font-normal">({lead.email})</span>
                            </p>
                            {lead.company && (
                              <p className="text-xs text-gray-500">{lead.company}</p>
                            )}
                          </div>
                          <span className="text-xs text-gray-400">{lead.status}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Step 4: Review */}
              {wizardStep === 4 && (
                <div className="space-y-4">
                  <div className="rounded-lg border p-4 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Campaign</span>
                      <span className="font-medium">{campaignName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Type</span>
                      <span className="font-medium">{typeLabels[campaignType]}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Template</span>
                      <span className="font-medium">{selectedTemplate?.name || '—'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Subject</span>
                      <span className="font-medium">{selectedTemplate?.subject || '—'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Recipients</span>
                      <span className="font-medium">{selectedLeadIds.length} leads</span>
                    </div>
                    {campaignDesc && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Description</span>
                        <span className="font-medium">{campaignDesc}</span>
                      </div>
                    )}
                  </div>
                  {selectedTemplate && (
                    <div>
                      <label className="text-sm font-medium">Email Preview</label>
                      <div className="rounded-lg border bg-gray-50 p-4 mt-1">
                        <p className="font-medium text-sm">{selectedTemplate.subject}</p>
                        <hr className="my-2" />
                        <pre className="whitespace-pre-wrap text-xs text-gray-600">
                          {selectedTemplate.body.slice(0, 400)}
                          {selectedTemplate.body.length > 400 ? '...' : ''}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t px-6 py-4">
              <Button
                variant="outline"
                onClick={() => {
                  if (wizardStep === 1) closeWizard()
                  else setWizardStep(wizardStep - 1)
                }}
              >
                {wizardStep === 1 ? (
                  'Cancel'
                ) : (
                  <><ChevronLeft className="mr-1 h-4 w-4" />Back</>
                )}
              </Button>
              <div className="flex space-x-2">
                {wizardStep === 4 ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => createMutation.mutate(false)}
                      disabled={createMutation.isPending}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      Save as Draft
                    </Button>
                    <Button
                      onClick={() => createMutation.mutate(true)}
                      disabled={createMutation.isPending}
                    >
                      {createMutation.isPending ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</>
                      ) : (
                        <><Send className="mr-2 h-4 w-4" />Send Now</>
                      )}
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setWizardStep(wizardStep + 1)} disabled={!canNext()}>
                    Next <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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
                  <p className="text-2xl font-bold">{campaigns.length}</p>
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
                  <p className="text-2xl font-bold">{totalSent.toLocaleString()}</p>
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
                  <p className="text-2xl font-bold">{calculateRate(totalOpened, totalSent)}%</p>
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
                  <p className="text-2xl font-bold">{calculateRate(totalClicked, totalSent)}%</p>
                  <p className="text-sm text-muted-foreground">Avg Click Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && campaigns.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Mail className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-4 font-medium">No campaigns yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Create your first campaign to start reaching your leads.
              </p>
              <Button className="mt-4" onClick={() => setShowWizard(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Campaign
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Campaigns Grid */}
        {!isLoading && campaigns.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            {campaigns.map((campaign) => (
              <Card key={campaign.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="rounded-lg bg-gray-100 p-2">
                        <Mail className="h-4 w-4" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{campaign.name}</CardTitle>
                        <CardDescription className="text-xs">
                          {typeLabels[campaign.type] || campaign.type}
                        </CardDescription>
                      </div>
                    </div>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        (statusColors[campaign.status] || statusColors.DRAFT).bg
                      } ${(statusColors[campaign.status] || statusColors.DRAFT).text}`}
                    >
                      {campaign.status.charAt(0) + campaign.status.slice(1).toLowerCase()}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4 py-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-1 text-gray-500">
                        <Users className="h-3 w-3" />
                        <span className="text-xs">Sent</span>
                      </div>
                      <p className="mt-1 text-lg font-semibold">
                        {campaign.totalSent.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-1 text-gray-500">
                        <Eye className="h-3 w-3" />
                        <span className="text-xs">Opened</span>
                      </div>
                      <p className="mt-1 text-lg font-semibold">
                        {calculateRate(campaign.totalOpened, campaign.totalSent)}%
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-1 text-gray-500">
                        <MousePointer className="h-3 w-3" />
                        <span className="text-xs">Clicked</span>
                      </div>
                      <p className="mt-1 text-lg font-semibold">
                        {calculateRate(campaign.totalClicked, campaign.totalSent)}%
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-1 text-gray-500">
                        <MessageSquare className="h-3 w-3" />
                        <span className="text-xs">Replied</span>
                      </div>
                      <p className="mt-1 text-lg font-semibold">
                        {calculateRate(campaign.totalReplied, campaign.totalSent)}%
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    {campaign.startDate && (
                      <span>Started: {new Date(campaign.startDate).toLocaleDateString()}</span>
                    )}
                    {campaign.endDate && (
                      <span>Ended: {new Date(campaign.endDate).toLocaleDateString()}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
