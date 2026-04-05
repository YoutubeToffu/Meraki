'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Sparkles,
  Send,
  Mail,
  MessageSquare,
  FileText,
  Lightbulb,
  Copy,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Loader2,
  Check,
  Zap,
  BarChart3,
  MessageCircle,
  Target,
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

type TabId = 'generate' | 'first-line' | 'objection' | 'sentiment' | 'coach'

const tabs: { id: TabId; label: string; icon: any }[] = [
  { id: 'generate', label: 'Generate', icon: Sparkles },
  { id: 'first-line', label: 'First Lines', icon: Zap },
  { id: 'objection', label: 'Objections', icon: Lightbulb },
  { id: 'sentiment', label: 'Reply Analysis', icon: MessageCircle },
  { id: 'coach', label: 'Campaign Coach', icon: BarChart3 },
]

const toneOptions = [
  { value: 'professional', label: 'Professional' },
  { value: 'casual', label: 'Casual' },
  { value: 'formal', label: 'Formal' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'founder-to-founder', label: 'Founder-to-Founder' },
  { value: 'recruiter', label: 'Recruiter' },
  { value: 'executive', label: 'Executive' },
]

const generateTypes = [
  { id: 'EMAIL_BODY', icon: Mail, label: 'Cold Email', prompt: 'Write a cold outreach email' },
  { id: 'EMAIL_SUBJECT', icon: Target, label: 'Subject Lines', prompt: 'Generate subject lines' },
  { id: 'LINKEDIN_MESSAGE', icon: MessageSquare, label: 'LinkedIn DM', prompt: 'Write a LinkedIn message' },
  { id: 'FOLLOW_UP', icon: RotateCcw, label: 'Follow-up', prompt: 'Write a follow-up email' },
  { id: 'LEAD_SUMMARY', icon: FileText, label: 'Lead Brief', prompt: 'Summarize this lead' },
  { id: 'MEETING_PREP', icon: FileText, label: 'Meeting Prep', prompt: 'Prepare for meeting with' },
]

export default function AIAssistantPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<TabId>('generate')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [saveModalOpen, setSaveModalOpen] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [templateCategory, setTemplateCategory] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Generate tab state
  const [selectedType, setSelectedType] = useState('EMAIL_BODY')
  const [tone, setTone] = useState('professional')
  const [leadName, setLeadName] = useState('')
  const [leadCompany, setLeadCompany] = useState('')
  const [leadTitle, setLeadTitle] = useState('')
  const [industry, setIndustry] = useState('')
  const [customPrompt, setCustomPrompt] = useState('')

  // First-line tab state
  const [flLeadName, setFlLeadName] = useState('')
  const [flCompany, setFlCompany] = useState('')
  const [flTitle, setFlTitle] = useState('')
  const [flRecentPost, setFlRecentPost] = useState('')
  const [flCompanyNews, setFlCompanyNews] = useState('')
  const [flHiring, setFlHiring] = useState('')
  const [flTone, setFlTone] = useState('professional')

  // Objection tab state
  const [objection, setObjection] = useState('')
  const [objLeadName, setObjLeadName] = useState('')
  const [objCompany, setObjCompany] = useState('')
  const [objTone, setObjTone] = useState('professional')

  // Sentiment tab state
  const [replyText, setReplyText] = useState('')
  const [sentimentResult, setSentimentResult] = useState<any>(null)

  // Coach tab state
  const [coachSequenceName, setCoachSequenceName] = useState('')
  const [coachSubject, setCoachSubject] = useState('')
  const [coachBody, setCoachBody] = useState('')
  const [coachPersona, setCoachPersona] = useState('')
  const [coachSent, setCoachSent] = useState('')
  const [coachOpenRate, setCoachOpenRate] = useState('')
  const [coachReplyRate, setCoachReplyRate] = useState('')
  const [coachClickRate, setCoachClickRate] = useState('')

  const handleCopy = async () => {
    if (!generatedContent) return
    await navigator.clipboard.writeText(generatedContent)
    setCopied(true)
    toast({ title: 'Copied to clipboard' })
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSaveAsTemplate = async () => {
    if (!generatedContent || !templateName.trim()) {
      toast({ title: 'Please enter a template name', variant: 'destructive' })
      return
    }
    setIsSaving(true)
    try {
      let subject = templateName
      let body = generatedContent
      const subjectMatch = generatedContent.match(/^Subject:\s*(.+)/m)
      if (subjectMatch) {
        subject = subjectMatch[1].trim()
        body = generatedContent.replace(/^Subject:\s*.+\n*/m, '').trim()
      }

      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: templateName,
          subject,
          body,
          category: templateCategory || 'ai-generated',
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to save template')
      }
      toast({ title: 'Template saved successfully' })
      setSaveModalOpen(false)
      setTemplateName('')
      setTemplateCategory('')
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to save template',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const callAI = async (type: string, context: any) => {
    setIsGenerating(true)
    setGeneratedContent(null)
    setSentimentResult(null)
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, context }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Generation failed')
      }
      const { data } = await res.json()

      if (type === 'REPLY_SENTIMENT') {
        try {
          const parsed = JSON.parse(data.content)
          setSentimentResult(parsed)
        } catch {
          setSentimentResult({ summary: data.content, sentiment: 'unknown', confidence: 0 })
        }
        setGeneratedContent(data.content)
      } else {
        setGeneratedContent(data.content)
      }
    } catch (err) {
      toast({
        title: 'AI Generation Failed',
        description: err instanceof Error ? err.message : 'Something went wrong',
        variant: 'destructive',
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGenerate = () => {
    callAI(selectedType, {
      leadName, leadCompany, leadJobTitle: leadTitle, industry,
      customPrompt, tone,
    })
  }

  const handleFirstLine = () => {
    callAI('FIRST_LINE', {
      leadName: flLeadName, leadCompany: flCompany, leadJobTitle: flTitle,
      recentPost: flRecentPost, companyNews: flCompanyNews, hiringInfo: flHiring,
      tone: flTone,
    })
  }

  const handleObjection = () => {
    callAI('OBJECTION_RESPONSE', {
      customPrompt: objection, leadName: objLeadName, leadCompany: objCompany,
      tone: objTone,
    })
  }

  const handleSentiment = () => {
    callAI('REPLY_SENTIMENT', { replyText })
  }

  const handleCoach = () => {
    callAI('CAMPAIGN_COACH', {
      campaignMetrics: {
        sequenceName: coachSequenceName || undefined,
        subjectLine: coachSubject || undefined,
        emailBody: coachBody || undefined,
        targetPersona: coachPersona || undefined,
        totalSent: coachSent ? parseInt(coachSent) : undefined,
        openRate: coachOpenRate ? parseFloat(coachOpenRate) : undefined,
        replyRate: coachReplyRate ? parseFloat(coachReplyRate) : undefined,
        clickRate: coachClickRate ? parseFloat(coachClickRate) : undefined,
      },
    })
  }

  const sentimentColors: Record<string, string> = {
    interested: 'bg-green-100 text-green-800',
    meeting_likely: 'bg-green-100 text-green-800',
    needs_info: 'bg-blue-100 text-blue-800',
    forwarded: 'bg-blue-100 text-blue-800',
    not_now: 'bg-yellow-100 text-yellow-800',
    objection: 'bg-orange-100 text-orange-800',
    competitor: 'bg-orange-100 text-orange-800',
    not_interested: 'bg-red-100 text-red-800',
    unsubscribe: 'bg-red-100 text-red-800',
    wrong_contact: 'bg-gray-100 text-gray-800',
  }

  return (
    <>
      <Header
        title="AI Assistant"
        description="Generate personalized content, analyze replies, and get campaign coaching — powered by GPT-4o"
      />

      <div className="p-6 space-y-6">
        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setGeneratedContent(null); setSentimentResult(null) }}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ===== GENERATE TAB ===== */}
        {activeTab === 'generate' && (
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                  <span>Generate Content</span>
                </CardTitle>
                <CardDescription>Select a type and provide lead details for AI-powered content</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Type selector */}
                <div className="grid grid-cols-3 gap-2">
                  {generateTypes.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedType(t.id)}
                      className={`flex items-center space-x-2 p-3 rounded-lg border text-sm transition-colors ${
                        selectedType === t.id
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <t.icon className="h-4 w-4" />
                      <span>{t.label}</span>
                    </button>
                  ))}
                </div>

                {/* Lead details */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Lead Name</label>
                    <Input placeholder="Sarah Chen" value={leadName} onChange={(e) => setLeadName(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Company</label>
                    <Input placeholder="TechCorp" value={leadCompany} onChange={(e) => setLeadCompany(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Job Title</label>
                    <Input placeholder="VP of Engineering" value={leadTitle} onChange={(e) => setLeadTitle(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Industry</label>
                    <Input placeholder="SaaS / FinTech" value={industry} onChange={(e) => setIndustry(e.target.value)} />
                  </div>
                </div>

                {/* Tone selector */}
                <div>
                  <label className="text-sm font-medium text-gray-700">Tone</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {toneOptions.map((t) => (
                      <button
                        key={t.value}
                        onClick={() => setTone(t.value)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                          tone === t.value
                            ? 'bg-purple-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Additional context */}
                <div>
                  <label className="text-sm font-medium text-gray-700">Additional Context (optional)</label>
                  <textarea
                    className="w-full h-20 rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
                    placeholder="Any additional context: their pain points, your product, what you're selling..."
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                  />
                </div>

                <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">
                  {isGenerating ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating with GPT-4o...</>
                  ) : (
                    <><Sparkles className="mr-2 h-4 w-4" />Generate</>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Quick prompts sidebar */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Prompts</CardTitle>
                <CardDescription>Click to auto-fill common scenarios</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { type: 'EMAIL_BODY', label: 'Cold email for HR leaders', ctx: { leadJobTitle: 'VP of People', industry: 'Technology' } },
                  { type: 'FOLLOW_UP', label: 'Follow-up for demo no-show', ctx: { customPrompt: 'Lead attended demo signup but did not show up' } },
                  { type: 'LINKEDIN_MESSAGE', label: 'LinkedIn DM to startup founder', ctx: { leadJobTitle: 'CEO & Co-Founder', industry: 'SaaS' } },
                  { type: 'EMAIL_SUBJECT', label: 'Subject lines for recruiters', ctx: { leadJobTitle: 'Talent Acquisition Manager', industry: 'Staffing' } },
                  { type: 'LEAD_SUMMARY', label: 'Summarize a qualified lead', ctx: { customPrompt: 'Opened 3 emails, clicked pricing, visited demo page' } },
                ].map((q, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setSelectedType(q.type)
                      if (q.ctx.leadJobTitle) setLeadTitle(q.ctx.leadJobTitle)
                      if (q.ctx.industry) setIndustry(q.ctx.industry)
                      if (q.ctx.customPrompt) setCustomPrompt(q.ctx.customPrompt)
                    }}
                    className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 transition-colors text-sm"
                  >
                    {q.label}
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ===== FIRST LINE TAB ===== */}
        {activeTab === 'first-line' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-amber-500" />
                <span>Hyper-Personalized First Lines</span>
              </CardTitle>
              <CardDescription>
                Generate opening lines that reference real details about the prospect — not generic flattery
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Lead Name *</label>
                  <Input placeholder="Sarah Chen" value={flLeadName} onChange={(e) => setFlLeadName(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Company *</label>
                  <Input placeholder="TechCorp" value={flCompany} onChange={(e) => setFlCompany(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Job Title</label>
                  <Input placeholder="VP of Engineering" value={flTitle} onChange={(e) => setFlTitle(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Tone</label>
                  <select
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={flTone}
                    onChange={(e) => setFlTone(e.target.value)}
                  >
                    {toneOptions.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm font-medium text-amber-800 mb-2">Add real details for better personalization:</p>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-amber-700">Recent LinkedIn post or activity</label>
                    <textarea
                      className="w-full h-16 rounded-md border border-amber-200 bg-white px-3 py-2 text-sm resize-none"
                      placeholder="e.g., Posted about their team's AI hiring initiative, spoke at SaaStr about scaling..."
                      value={flRecentPost}
                      onChange={(e) => setFlRecentPost(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-amber-700">Company news (funding, launch, expansion)</label>
                    <Input
                      placeholder="e.g., Just raised Series B, launched new product, expanding to Europe..."
                      value={flCompanyNews}
                      onChange={(e) => setFlCompanyNews(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-amber-700">Hiring info (job openings, team growth)</label>
                    <Input
                      placeholder="e.g., 15 open engineering roles, grew team 40% this year..."
                      value={flHiring}
                      onChange={(e) => setFlHiring(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <Button onClick={handleFirstLine} disabled={isGenerating || !flLeadName || !flCompany} className="w-full">
                {isGenerating ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating personalized lines...</>
                ) : (
                  <><Zap className="mr-2 h-4 w-4" />Generate 3 First Lines</>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ===== OBJECTION TAB ===== */}
        {activeTab === 'objection' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Lightbulb className="h-5 w-5 text-orange-500" />
                <span>AI Objection Handler</span>
              </CardTitle>
              <CardDescription>
                Paste the prospect's objection and get 3 reply options: soft, confident, and value-driven
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">What did the prospect say? *</label>
                <textarea
                  className="w-full h-24 rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
                  placeholder='e.g., "We already have a recruiting vendor" or "Not interested right now" or "Too expensive"'
                  value={objection}
                  onChange={(e) => setObjection(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Lead Name</label>
                  <Input placeholder="Optional" value={objLeadName} onChange={(e) => setObjLeadName(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Company</label>
                  <Input placeholder="Optional" value={objCompany} onChange={(e) => setObjCompany(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Tone</label>
                  <select
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={objTone}
                    onChange={(e) => setObjTone(e.target.value)}
                  >
                    {toneOptions.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Common objections */}
              <div>
                <label className="text-sm font-medium text-gray-500">Common objections:</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {[
                    "We already use someone",
                    "Not interested",
                    "Too expensive",
                    "Reach out next quarter",
                    "Send more info",
                    "We're not hiring right now",
                    "I need to check with my team",
                    "We handle this internally",
                  ].map((o) => (
                    <button
                      key={o}
                      onClick={() => setObjection(o)}
                      className="px-3 py-1.5 rounded-full text-xs bg-orange-50 text-orange-700 hover:bg-orange-100 transition-colors border border-orange-200"
                    >
                      {o}
                    </button>
                  ))}
                </div>
              </div>

              <Button onClick={handleObjection} disabled={isGenerating || !objection.trim()} className="w-full">
                {isGenerating ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating replies...</>
                ) : (
                  <><Lightbulb className="mr-2 h-4 w-4" />Generate 3 Reply Options</>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ===== REPLY SENTIMENT TAB ===== */}
        {activeTab === 'sentiment' && (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageCircle className="h-5 w-5 text-blue-500" />
                  <span>Reply Sentiment Analyzer</span>
                </CardTitle>
                <CardDescription>
                  Paste a prospect's reply to classify intent and get a suggested next action
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Prospect's reply *</label>
                  <textarea
                    className="w-full h-40 rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
                    placeholder={`Paste the prospect's reply here...\n\ne.g., "Thanks for reaching out. We're currently evaluating a few options and would like to see a demo next week if possible."`}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                  />
                </div>
                <Button onClick={handleSentiment} disabled={isGenerating || !replyText.trim()} className="w-full">
                  {isGenerating ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analyzing...</>
                  ) : (
                    <><MessageCircle className="mr-2 h-4 w-4" />Analyze Reply</>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Sentiment Result */}
            {sentimentResult && (
              <Card>
                <CardHeader>
                  <CardTitle>Analysis Result</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${sentimentColors[sentimentResult.sentiment] || 'bg-gray-100 text-gray-800'}`}>
                      {sentimentResult.sentiment?.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className="text-sm text-gray-500">
                      Confidence: {sentimentResult.confidence}%
                    </span>
                  </div>

                  {sentimentResult.urgency && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-700">Urgency:</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        sentimentResult.urgency === 'high' ? 'bg-red-100 text-red-700' :
                        sentimentResult.urgency === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {sentimentResult.urgency.toUpperCase()}
                      </span>
                    </div>
                  )}

                  {sentimentResult.summary && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Summary</p>
                      <p className="text-sm text-gray-600 mt-1">{sentimentResult.summary}</p>
                    </div>
                  )}

                  {sentimentResult.suggestedAction && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm font-medium text-blue-800">Suggested Next Action</p>
                      <p className="text-sm text-blue-700 mt-1">{sentimentResult.suggestedAction}</p>
                    </div>
                  )}

                  {sentimentResult.suggestedReply && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-sm font-medium text-green-800">Draft Reply</p>
                      <p className="text-sm text-green-700 mt-1">{sentimentResult.suggestedReply}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={async () => {
                          await navigator.clipboard.writeText(sentimentResult.suggestedReply)
                          toast({ title: 'Reply copied' })
                        }}
                      >
                        <Copy className="mr-2 h-3 w-3" />Copy Reply
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* ===== CAMPAIGN COACH TAB ===== */}
        {activeTab === 'coach' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-emerald-500" />
                <span>AI Campaign Coach</span>
              </CardTitle>
              <CardDescription>
                Paste your campaign metrics and email copy to get specific, actionable coaching from AI
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Campaign / Sequence Name</label>
                  <Input placeholder="Enterprise Outreach Q1" value={coachSequenceName} onChange={(e) => setCoachSequenceName(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Target Persona</label>
                  <Input placeholder="VP of Engineering at SaaS companies" value={coachPersona} onChange={(e) => setCoachPersona(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Total Sent</label>
                  <Input type="number" placeholder="500" value={coachSent} onChange={(e) => setCoachSent(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Open Rate %</label>
                  <Input type="number" placeholder="22" value={coachOpenRate} onChange={(e) => setCoachOpenRate(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Reply Rate %</label>
                  <Input type="number" placeholder="3.5" value={coachReplyRate} onChange={(e) => setCoachReplyRate(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Click Rate %</label>
                  <Input type="number" placeholder="4" value={coachClickRate} onChange={(e) => setCoachClickRate(e.target.value)} />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Subject Line</label>
                <Input placeholder="The subject line you used" value={coachSubject} onChange={(e) => setCoachSubject(e.target.value)} />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Email Body</label>
                <textarea
                  className="w-full h-32 rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
                  placeholder="Paste the email body you sent..."
                  value={coachBody}
                  onChange={(e) => setCoachBody(e.target.value)}
                />
              </div>

              <Button onClick={handleCoach} disabled={isGenerating} className="w-full">
                {isGenerating ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analyzing campaign...</>
                ) : (
                  <><BarChart3 className="mr-2 h-4 w-4" />Get AI Coaching</>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ===== GENERATED CONTENT OUTPUT (shared across tabs except sentiment) ===== */}
        {generatedContent && activeTab !== 'sentiment' && (
          <Card>
            <CardHeader>
              <CardTitle>Generated Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg border bg-gray-50 p-4">
                <pre className="whitespace-pre-wrap text-sm leading-relaxed">{generatedContent}</pre>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={handleCopy}>
                    {copied ? (
                      <><Check className="mr-2 h-4 w-4" />Copied</>
                    ) : (
                      <><Copy className="mr-2 h-4 w-4" />Copy</>
                    )}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setSaveModalOpen(true)}>
                    <FileText className="mr-2 h-4 w-4" />
                    Save as Template
                  </Button>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">Helpful?</span>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <ThumbsUp className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <ThumbsDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Save as Template Modal */}
      <Dialog open={saveModalOpen} onOpenChange={setSaveModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save as Template</DialogTitle>
            <DialogDescription>
              Save this generated content as a reusable email template
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div>
              <label className="text-sm font-medium">Template Name *</label>
              <Input
                placeholder="e.g., Cold outreach for HR managers"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Category</label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={templateCategory}
                onChange={(e) => setTemplateCategory(e.target.value)}
              >
                <option value="">AI Generated</option>
                <option value="cold-outreach">Cold Outreach</option>
                <option value="follow-up">Follow-up</option>
                <option value="linkedin">LinkedIn</option>
                <option value="objection">Objection Handling</option>
                <option value="nurture">Nurture</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Preview</label>
              <div className="rounded-lg border bg-gray-50 p-3 max-h-40 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-xs text-gray-600">
                  {generatedContent?.slice(0, 300)}
                  {(generatedContent?.length || 0) > 300 ? '...' : ''}
                </pre>
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <Button variant="outline" onClick={() => setSaveModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveAsTemplate} disabled={isSaving}>
                {isSaving ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>
                ) : (
                  'Save Template'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
