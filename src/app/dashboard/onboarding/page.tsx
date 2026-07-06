'use client'

import { useState, useEffect, useRef } from 'react'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Send,
  Loader2,
  Target,
  Sparkles,
  RotateCcw,
  ChevronRight,
  CheckCircle2,
  Rocket,
  ArrowRight,
  Bot,
  Globe,
  ScanLine,
  X,
  MessageSquare,
  Zap,
  Layers,
  ExternalLink,
  Mail,
  GitBranch,
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'

// ─── Types ────────────────────────────────────────────────────────────────────

type Stage =
  | 'company_basics'
  | 'product_offer'
  | 'target_customer'
  | 'funnel_state'
  | 'goal_timeline'
  | 'channel_preferences'
  | 'complete'

type Message = { role: 'user' | 'assistant'; content: string }

interface Answers {
  companyName?: string
  industry?: string
  productCategory?: string
  launchAge?: string
  teamSize?: string
  productDescription?: string
  coreValuePromise?: string
  pricing?: string
  primaryCTA?: string
  targetRole?: string
  targetCompanyProfile?: string
  corePain?: string
  existingCustomers?: string
  currentAcquisition?: string
  whatWorked?: string
  inboundTraffic?: string
  customerGoal?: string
  revenueTarget?: string
  urgency?: string
  deadline?: string
  preferredChannels?: string
  channelsToAvoid?: string
  outreachOwner?: string
}

// ─── Stage Config ─────────────────────────────────────────────────────────────

const STAGES: { id: Stage; label: string; description: string }[] = [
  { id: 'company_basics', label: 'Company', description: 'Tell us about your business' },
  { id: 'product_offer', label: 'Product', description: 'Your offer and value promise' },
  { id: 'target_customer', label: 'Customers', description: 'Who buys from you' },
  { id: 'funnel_state', label: 'Current State', description: 'Where your funnel stands today' },
  { id: 'goal_timeline', label: 'Goals', description: 'What you want to achieve' },
  { id: 'channel_preferences', label: 'Channels', description: 'How you want to reach customers' },
]

const STAGE_OPENERS: Record<Stage, string> = {
  company_basics: "Hi! I'm your Growth Planner. I'll ask you a few questions about your business, then generate a custom acquisition plan with actionable steps.\n\nLet's start: **What's your company name**, and what industry are you in?",
  product_offer: "Great! Now let's dig into your product. **What does it do**, and what's the core outcome or result it delivers for customers?",
  target_customer: "Perfect. Now I want to understand your ideal buyer. **Who is your target customer** — what's their role and what kind of company do they work at?",
  funnel_state: "Let's assess where you are today. **Do you have any paying customers yet?** If yes, how did you get them? If not, what acquisition approaches have you tried so far?",
  goal_timeline: "Almost there. **How many customers do you want in the next 30-90 days**, and what's the revenue milestone that matters most right now?",
  channel_preferences: "Last one! **What channels do you prefer for reaching customers** — email outreach, LinkedIn, referrals, content, paid ads? And is this founder-led or do you have someone dedicated to outreach?",
  complete: '',
}

// ─── Answer extraction helper ─────────────────────────────────────────────────

function extractAnswers(
  stage: Stage,
  transcript: Message[],
  existing: Answers
): Answers {
  const userMessages = transcript
    .filter((m) => m.role === 'user')
    .map((m) => m.content)
    .join(' | ')

  const updated: Answers = { ...existing }

  if (stage === 'company_basics') {
    updated.companyName = existing.companyName || userMessages.slice(0, 100)
    updated.industry = existing.industry || userMessages.slice(0, 120)
    updated.teamSize = existing.teamSize || userMessages.slice(0, 80)
    updated.launchAge = existing.launchAge || userMessages.slice(0, 80)
    updated.productCategory = existing.productCategory || userMessages.slice(0, 80)
  } else if (stage === 'product_offer') {
    updated.productDescription = userMessages.slice(0, 300)
    updated.coreValuePromise = userMessages.slice(0, 200)
    updated.pricing = userMessages.slice(0, 100)
    updated.primaryCTA = userMessages.slice(0, 80)
  } else if (stage === 'target_customer') {
    updated.targetRole = userMessages.slice(0, 150)
    updated.targetCompanyProfile = userMessages.slice(0, 200)
    updated.corePain = userMessages.slice(0, 200)
    updated.existingCustomers = userMessages.slice(0, 150)
  } else if (stage === 'funnel_state') {
    updated.currentAcquisition = userMessages.slice(0, 300)
    updated.whatWorked = userMessages.slice(0, 200)
    updated.inboundTraffic = userMessages.slice(0, 150)
  } else if (stage === 'goal_timeline') {
    updated.customerGoal = userMessages.slice(0, 100)
    updated.revenueTarget = userMessages.slice(0, 100)
    updated.urgency = userMessages.slice(0, 150)
    updated.deadline = userMessages.slice(0, 100)
  } else if (stage === 'channel_preferences') {
    updated.preferredChannels = userMessages.slice(0, 200)
    updated.channelsToAvoid = userMessages.slice(0, 150)
    updated.outreachOwner = userMessages.slice(0, 100)
  }

  return updated
}

// ─── Inline bold/italic renderer ──────────────────────────────────────────────

function renderInline(text: string): React.ReactNode {
  // Handle **bold** inline markers
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  if (parts.length === 1) return text
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**')
          ? <strong key={i} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>
          : part
      )}
    </>
  )
}

// ─── Table row parser ──────────────────────────────────────────────────────────

function parseTableRows(lines: string[]): { headers: string[]; rows: string[][] } {
  const dataLines = lines.filter((l) => l.trim().startsWith('|') && !/^\|[-| ]+\|?$/.test(l.trim()))
  const parse = (line: string) =>
    line.split('|').slice(1, -1).map((c) => c.trim()).filter((_, i, a) => i < a.length)
  const [headerLine, ...rowLines] = dataLines
  return {
    headers: headerLine ? parse(headerLine) : [],
    rows: rowLines.map(parse),
  }
}

// ─── Markdown renderer ────────────────────────────────────────────────────────

function renderPlan(text: string): React.ReactNode[] {
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []
  let key = 0
  let i = 0

  const sectionColors: Record<number, string> = {
    0: 'bg-blue-100 text-blue-800',
    1: 'bg-purple-100 text-purple-800',
    2: 'bg-orange-100 text-orange-800',
    3: 'bg-green-100 text-green-800',
    4: 'bg-pink-100 text-pink-800',
    5: 'bg-yellow-100 text-yellow-800',
    6: 'bg-red-100 text-red-800',
  }
  let sectionIndex = 0

  while (i < lines.length) {
    const line = lines[i]

    // H2 section headers — styled pill
    if (line.startsWith('## ')) {
      const colorClass = sectionColors[sectionIndex % Object.keys(sectionColors).length]
      sectionIndex++
      elements.push(
        <div key={key++} className="flex items-center gap-2 mt-8 mb-3">
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${colorClass}`}>
            {line.replace(/^##\s*/, '')}
          </span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>
      )
      i++
      continue
    }

    // H3 sub-headers
    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={key++} className="font-semibold text-gray-800 text-sm mt-4 mb-1">
          {renderInline(line.replace(/^###\s*/, ''))}
        </h3>
      )
      i++
      continue
    }

    // Table block — collect all | lines and render as a real table
    if (line.trim().startsWith('|')) {
      const tableLines: string[] = []
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i])
        i++
      }
      const { headers, rows } = parseTableRows(tableLines)
      if (headers.length > 0) {
        elements.push(
          <div key={key++} className="my-3 overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {headers.map((h, hi) => (
                    <th key={hi} className="px-4 py-2 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row, ri) => (
                  <tr key={ri} className={ri % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                    {row.map((cell, ci) => (
                      <td key={ci} className="px-4 py-2 text-gray-700 text-xs">
                        {renderInline(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }
      continue
    }

    // Numbered list — collect consecutive items and render as styled steps
    if (/^\d+\.\s/.test(line)) {
      const listItems: string[] = []
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        listItems.push(lines[i].replace(/^\d+\.\s/, ''))
        i++
      }
      elements.push(
        <ol key={key++} className="my-2 space-y-1.5">
          {listItems.map((item, li) => (
            <li key={li} className="flex items-start gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white mt-0.5">
                {li + 1}
              </span>
              <span className="text-sm text-gray-700 leading-relaxed">{renderInline(item)}</span>
            </li>
          ))}
        </ol>
      )
      continue
    }

    // Bullet list — collect consecutive items
    if (line.startsWith('- ') || line.startsWith('* ')) {
      const listItems: string[] = []
      while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('* '))) {
        listItems.push(lines[i].replace(/^[-*]\s/, ''))
        i++
      }
      elements.push(
        <ul key={key++} className="my-2 space-y-1">
          {listItems.map((item, li) => (
            <li key={li} className="flex items-start gap-2 text-sm text-gray-700">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
              <span className="leading-relaxed">{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      )
      continue
    }

    // Blank line
    if (line.trim() === '') {
      elements.push(<div key={key++} className="h-1" />)
      i++
      continue
    }

    // Paragraph
    elements.push(
      <p key={key++} className="text-sm text-gray-700 leading-relaxed my-1">
        {renderInline(line)}
      </p>
    )
    i++
  }

  return elements
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const { toast } = useToast()
  const router = useRouter()

  const [stage, setStage] = useState<Stage>('company_basics')
  const [messages, setMessages] = useState<Message[]>([])
  const [stageTranscripts, setStageTranscripts] = useState<Record<string, Message[]>>({})
  const [input, setInput] = useState('')
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [isPlanLoading, setIsPlanLoading] = useState(false)
  const [plan, setPlan] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Answers>({})
  const [completedStages, setCompletedStages] = useState<Set<Stage>>(new Set())
  const [isActivating, setIsActivating] = useState(false)
  const [hasSavedPlan, setHasSavedPlan] = useState(false)
  const [activationResult, setActivationResult] = useState<{
    aiCampaign: { id: string; name: string }
    sequence: { id: string; name: string; steps: number }
  } | null>(null)

  // ── URL scan state ─────────────────────────────────────────────────────────
  type AppView = 'landing' | 'scanning' | 'scan_preview' | 'chat' | 'complete'
  const [view, setView] = useState<AppView>('landing')
  const [scanUrl, setScanUrl] = useState('')
  const [isScanLoading, setIsScanLoading] = useState(false)
  const [scannedData, setScannedData] = useState<Record<string, string> | null>(null)
  const [scanMethod, setScanMethod] = useState<'static' | 'jina' | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const scanInputRef = useRef<HTMLInputElement>(null)

  const currentStageIndex = STAGES.findIndex((s) => s.id === stage)

  // ── Init: load saved plan + activation status ───────────────────────────

  useEffect(() => {
    Promise.all([
      fetch('/api/onboarding/plan').then((r) => r.json()),
      fetch('/api/onboarding/activate').then((r) => r.json()),
    ])
      .then(([planRes, activationRes]) => {
        if (planRes.data?.generatedPlan) {
          setPlan(planRes.data.generatedPlan)
          setAnswers(planRes.data.answers || {})
          setStage('complete')
          setHasSavedPlan(true)
          setView('complete')
          const allStages = STAGES.map((s) => s.id) as Stage[]
          setCompletedStages(new Set(allStages))
        }
        if (activationRes.activated && activationRes.agents) {
          const m = activationRes.agents as any
          setActivationResult({
            aiCampaign: { id: m.aiCampaignId, name: m.aiCampaignName },
            sequence: { id: m.sequenceId, name: m.sequenceName, steps: m.stepCount },
          })
        }
      })
      .catch(() => {})
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-scroll ───────────────────────────────────────────────────────────

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── URL scan ──────────────────────────────────────────────────────────────

  async function runScan() {
    const url = scanUrl.trim()
    if (!url) return
    setIsScanLoading(true)
    setView('scanning')
    try {
      const res = await fetch('/api/onboarding/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Scan failed')
      setScannedData(json.data)
      setScanMethod(json.fetchMethod || 'static')
      setAnswers((prev) => ({ ...prev, ...json.data }))
      setView('scan_preview')
    } catch (err: any) {
      toast({ title: err.message || 'Scan failed', variant: 'destructive' })
      setView('landing')
    } finally {
      setIsScanLoading(false)
    }
  }

  // Direct plan generation from scan — skips chat entirely
  async function generateFromScan() {
    setView('complete') // reuse the 'complete' view which shows the generate button
    setStage('complete')
    const allStages = STAGES.map((s) => s.id) as Stage[]
    setCompletedStages(new Set(allStages))
    // Immediately trigger generation
    setIsPlanLoading(true)
    try {
      const res = await fetch('/api/onboarding/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers, rawTranscript: `Scanned from: ${scanUrl}` }),
      })
      if (!res.ok) throw new Error('Plan generation failed')
      const { plan: generatedPlan } = await res.json()
      setPlan(generatedPlan)
    } catch {
      toast({ title: 'Plan generation failed. Please try again.', variant: 'destructive' })
      setView('scan_preview') // bounce back so they can retry
    } finally {
      setIsPlanLoading(false)
    }
  }

  function addMoreDetails() {
    setView('chat')
    startStage('company_basics')
  }

  function skipScan() {
    setScannedData(null)
    setView('chat')
    startStage('company_basics')
  }

  // ── Stage management ──────────────────────────────────────────────────────

  function startStage(s: Stage) {
    setStage(s)
    const opener = STAGE_OPENERS[s]
    if (opener) {
      setMessages([{ role: 'assistant', content: opener }])
    }
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  function advanceStage() {
    const idx = STAGES.findIndex((s) => s.id === stage)
    const next = idx < STAGES.length - 1 ? STAGES[idx + 1].id : null

    // Save transcript for this stage
    setStageTranscripts((prev) => ({ ...prev, [stage]: messages }))

    // Extract answers from this stage's conversation
    const updated = extractAnswers(stage, messages, answers)
    setAnswers(updated)

    setCompletedStages((prev) => { const next = new Set(prev); next.add(stage); return next })

    if (next) {
      startStage(next)
    } else {
      setStage('complete')
      setMessages([])
    }
  }

  // ── Send message ──────────────────────────────────────────────────────────

  async function sendMessage() {
    const text = input.trim()
    if (!text || isChatLoading || stage === 'complete') return

    const userMsg: Message = { role: 'user', content: text }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setInput('')
    setIsChatLoading(true)

    try {
      const res = await fetch('/api/onboarding/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage,
          userMessage: text,
          conversationHistory: updatedMessages.slice(-8), // last 8 messages for context
        }),
      })

      if (!res.ok) throw new Error('Chat failed')
      const { reply } = await res.json()

      setMessages((prev) => [...prev, { role: 'assistant', content: reply }])
    } catch {
      toast({ title: 'Something went wrong', variant: 'destructive' })
      setMessages((prev) => prev.slice(0, -1))
      setInput(text)
    } finally {
      setIsChatLoading(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  // ── Generate plan ─────────────────────────────────────────────────────────

  async function generatePlan() {
    setIsPlanLoading(true)

    // Build full transcript
    const allTranscripts = Object.values(stageTranscripts)
      .flat()
      .map((m) => `${m.role === 'user' ? 'Founder' : 'AI'}: ${m.content}`)
      .join('\n')

    try {
      const res = await fetch('/api/onboarding/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers, rawTranscript: allTranscripts }),
      })

      if (!res.ok) throw new Error('Plan generation failed')
      const { plan: generatedPlan } = await res.json()
      setPlan(generatedPlan)
    } catch {
      toast({ title: 'Plan generation failed. Please try again.', variant: 'destructive' })
    } finally {
      setIsPlanLoading(false)
    }
  }

  // ── Activate full agent suite from plan ──────────────────────────────────

  async function activateAgents() {
    if (!plan) return
    setIsActivating(true)
    try {
      const res = await fetch('/api/onboarding/activate', { method: 'POST' })
      const json = await res.json()
      if (res.status === 409 && json.agents) {
        // Already activated — restore result
        const m = json.agents as any
        setActivationResult({
          aiCampaign: { id: m.aiCampaignId, name: m.aiCampaignName },
          sequence: { id: m.sequenceId, name: m.sequenceName, steps: m.stepCount },
        })
        return
      }
      if (!res.ok) throw new Error(json.error || 'Activation failed')
      setActivationResult(json.agents)
      toast({ title: 'Agent suite deployed!', description: 'Your AI agents are live and ready.' })
    } catch (e: any) {
      toast({ title: e.message || 'Activation failed', variant: 'destructive' })
    } finally {
      setIsActivating(false)
    }
  }

  // ── Reset ─────────────────────────────────────────────────────────────────

  function resetAll() {
    setPlan(null)
    setAnswers({})
    setCompletedStages(new Set())
    setStageTranscripts({})
    setHasSavedPlan(false)
    setActivationResult(null)
    setScannedData(null)
    setScanMethod(null)
    setScanUrl('')
    setView('landing')
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      <Header
        title="Growth Planner"
        description="Answer a few questions about your business and get a custom customer acquisition plan"
      />

      <div className="p-6 space-y-6">
        {/* ── Plan generating loading screen ── */}
        {isPlanLoading && (
          <div className="flex items-center justify-center min-h-[420px]">
            <div className="text-center space-y-6 max-w-sm">
              <div className="relative mx-auto h-20 w-20">
                <div className="absolute inset-0 rounded-full border-4 border-blue-100" />
                <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900">Building your growth plan</p>
                <p className="text-sm text-gray-500 mt-1">Analysing your product, ICP, and market…</p>
              </div>
              <div className="space-y-2 text-left">
                {[
                  'Defining your ideal customer profile',
                  'Crafting your wedge offer',
                  'Selecting demand channels',
                  'Mapping 30-day execution steps',
                  'Setting KPI targets',
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-gray-500">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" style={{ animationDelay: `${i * 200}ms` }} />
                    {step}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Landing / scan entry ── */}
        {!isPlanLoading && view === 'landing' && (
          <div className="max-w-2xl space-y-6">
            <Card className="border-2 border-blue-100">
              <CardContent className="pt-6 pb-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
                    <Globe className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Scan your product website</p>
                    <p className="text-xs text-gray-500">Paste your URL and we'll extract product info automatically</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <input
                    ref={scanInputRef}
                    type="url"
                    value={scanUrl}
                    onChange={(e) => setScanUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && runScan()}
                    placeholder="https://www.yourproduct.com"
                    className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                  <Button onClick={runScan} disabled={!scanUrl.trim() || isScanLoading}>
                    {isScanLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <><ScanLine className="mr-2 h-4 w-4" />Scan</>  
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-400">
                  We only read publicly accessible pages. No login or credentials required.
                </p>
              </CardContent>
            </Card>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400 font-medium">OR</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <button
              onClick={skipScan}
              className="flex w-full items-center justify-between rounded-xl border border-gray-200 p-4 hover:bg-gray-50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
                  <MessageSquare className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="font-medium text-sm text-gray-900">Answer questions manually</p>
                  <p className="text-xs text-gray-500">Walk through a quick chat to define your strategy</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </button>
          </div>
        )}

        {/* ── Scanning animation ── */}
        {!isPlanLoading && view === 'scanning' && (
          <Card className="max-w-md">
            <CardContent className="pt-10 pb-10 text-center space-y-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 mx-auto">
                <Loader2 className="h-7 w-7 text-blue-600 animate-spin" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Scanning your website…</p>
                <p className="text-sm text-gray-500 mt-1 truncate max-w-xs mx-auto">{scanUrl}</p>
              </div>
              <p className="text-xs text-gray-400">Fetching &amp; rendering page — may take up to 15s for JS-heavy sites</p>
            </CardContent>
          </Card>
        )}

        {/* ── Scan preview / confirmation ── */}
        {!isPlanLoading && view === 'scan_preview' && scannedData && (
          <div className="max-w-2xl space-y-4">
            <Card className="border-green-200 bg-green-50">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <CardTitle className="text-base text-green-900">Product info extracted</CardTitle>
                </div>
                <CardDescription className="text-green-700 text-xs">
                  Found {Object.keys(scannedData).length} fields from{' '}
                  <span className="font-medium truncate">{scanUrl}</span>.
                  {scanMethod === 'jina' && (
                    <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                      <Globe className="h-2.5 w-2.5" /> JS-rendered
                    </span>
                  )}
                  {' '}We'll use this to pre-fill your growth plan.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {([
                  ['Company', scannedData.companyName],
                  ['Industry', scannedData.industry],
                  ['Product', scannedData.productDescription],
                  ['Value promise', scannedData.coreValuePromise],
                  ['Target customer', scannedData.targetRole],
                  ['Core pain', scannedData.corePain],
                  ['CTA', scannedData.primaryCTA],
                ] as [string, string | undefined][]).filter(([, v]) => v).map(([label, value]) => (
                  <div key={label} className="flex gap-2 text-sm">
                    <span className="w-28 shrink-0 text-green-700 font-medium">{label}</span>
                    <span className="text-gray-800 line-clamp-2">{value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Two-path action buttons */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                onClick={generateFromScan}
                disabled={isPlanLoading}
                className="flex flex-col items-start gap-1 rounded-xl border-2 border-blue-500 bg-blue-50 p-4 hover:bg-blue-100 transition-colors text-left disabled:opacity-50"
              >
                <div className="flex items-center gap-2 font-semibold text-blue-900 text-sm">
                  {isPlanLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  {isPlanLoading ? 'Building your plan…' : 'Generate plan now'}
                </div>
                <p className="text-xs text-blue-700">
                  Use scanned info to create your growth plan instantly — no extra questions.
                </p>
              </button>

              <button
                onClick={addMoreDetails}
                className="flex flex-col items-start gap-1 rounded-xl border-2 border-gray-200 bg-white p-4 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex items-center gap-2 font-semibold text-gray-800 text-sm">
                  <MessageSquare className="h-4 w-4" />
                  Add more details
                </div>
                <p className="text-xs text-gray-500">
                  Answer a few follow-up questions for a more precise plan.
                </p>
              </button>
            </div>

            <button
              onClick={() => { setScannedData(null); setScanMethod(null); setView('landing') }}
              className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
            >
              <X className="h-3 w-3" /> Re-scan a different URL
            </button>
          </div>
        )}

        {/* Stage progress bar */}
        {!isPlanLoading && view === 'chat' && stage !== 'complete' && !plan && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {STAGES.map((s, i) => {
              const isDone = completedStages.has(s.id)
              const isCurrent = s.id === stage
              return (
                <div key={s.id} className="flex items-center gap-2 shrink-0">
                  <div
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      isDone
                        ? 'bg-green-100 text-green-700'
                        : isCurrent
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : (
                      <span className="h-4 w-4 flex items-center justify-center rounded-full bg-white/20 text-[10px]">
                        {i + 1}
                      </span>
                    )}
                    {s.label}
                  </div>
                  {i < STAGES.length - 1 && (
                    <ChevronRight className="h-3 w-3 text-gray-300 shrink-0" />
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Plan view */}
        {!isPlanLoading && plan && (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                        <Target className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Your Growth Plan</CardTitle>
                        <CardDescription>
                          Custom acquisition strategy for {answers.companyName || 'your business'}
                          {hasSavedPlan && ' · Saved'}
                        </CardDescription>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={resetAll}>
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Regenerate
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none space-y-1">
                    {renderPlan(plan)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Action sidebar */}
            <div className="space-y-4">
              {/* ── Activate Agent Suite card ── */}
              {!activationResult && !isActivating && (
                <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
                  <CardContent className="pt-5 space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                        <Zap className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-gray-900">Deploy Agent Suite</p>
                        <p className="text-xs text-gray-500">Approve & activate your growth plan</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {[
                        { icon: Bot, label: 'AI Outreach Agent', desc: 'Writes & sends personalised cold emails' },
                        { icon: GitBranch, label: 'Nurture Sequence', desc: '5-step drip cadence with AI copy' },
                      ].map(({ icon: Icon, label, desc }) => (
                        <div key={label} className="flex items-start gap-2 rounded-lg border border-blue-100 bg-white/70 px-3 py-2">
                          <Icon className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                          <div>
                            <p className="text-xs font-medium text-gray-800">{label}</p>
                            <p className="text-xs text-gray-500">{desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={activateAgents}>
                      <Rocket className="mr-2 h-4 w-4" />
                      Approve &amp; Deploy Agents
                    </Button>
                    <p className="text-center text-xs text-gray-400">Generates AI-written email copy for each agent</p>
                  </CardContent>
                </Card>
              )}

              {/* ── Activation loading ── */}
              {isActivating && (
                <Card className="border-blue-200">
                  <CardContent className="pt-6 pb-6 space-y-4">
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className="relative h-12 w-12">
                        <div className="absolute inset-0 rounded-full border-4 border-blue-100" />
                        <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Zap className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Deploying your agents…</p>
                        <p className="text-xs text-gray-400 mt-0.5">AI is writing your email sequences</p>
                      </div>
                      <div className="w-full space-y-1.5 text-left">
                        {[
                          'Configuring outreach agent',
                          'Writing personalised email copy',
                          'Building nurture sequence',
                          'Activating agents',
                        ].map((step, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-gray-500">
                            <div className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" style={{ animationDelay: `${i * 250}ms` }} />
                            {step}
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* ── Activation success ── */}
              {activationResult && (
                <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
                  <CardContent className="pt-5 space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600">
                        <CheckCircle2 className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-gray-900">Agents Live</p>
                        <p className="text-xs text-gray-500">Your growth engine is running</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <button
                        onClick={() => router.push('/dashboard/autopilot')}
                        className="flex w-full items-center justify-between rounded-lg border border-green-200 bg-white px-3 py-2.5 hover:bg-green-50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Bot className="h-4 w-4 text-green-600" />
                          <div className="text-left">
                            <p className="text-xs font-medium text-gray-800 truncate max-w-[150px]">{activationResult.aiCampaign.name}</p>
                            <p className="text-xs text-gray-400">AI Outreach Agent</p>
                          </div>
                        </div>
                        <ExternalLink className="h-3 w-3 text-gray-400 shrink-0" />
                      </button>

                      <button
                        onClick={() => router.push('/dashboard/sequences')}
                        className="flex w-full items-center justify-between rounded-lg border border-green-200 bg-white px-3 py-2.5 hover:bg-green-50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-green-600" />
                          <div className="text-left">
                            <p className="text-xs font-medium text-gray-800 truncate max-w-[150px]">{activationResult.sequence.name}</p>
                            <p className="text-xs text-gray-400">{activationResult.sequence.steps}-step nurture sequence</p>
                          </div>
                        </div>
                        <ExternalLink className="h-3 w-3 text-gray-400 shrink-0" />
                      </button>
                    </div>

                    <p className="text-center text-xs text-gray-400">Add leads to start your outreach</p>
                    <Button variant="outline" size="sm" className="w-full" onClick={() => router.push('/dashboard/leads')}>
                      <ArrowRight className="mr-2 h-3 w-3" />
                      Add Leads
                    </Button>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardContent className="pt-5 space-y-3">
                  <p className="font-medium text-sm text-gray-900">Explore manually</p>
                  <div className="space-y-2">
                    {[
                      { label: 'View Leads', href: '/dashboard/leads' },
                      { label: 'Sequences', href: '/dashboard/sequences' },
                      { label: 'AI Assistant', href: '/dashboard/ai' },
                    ].map(({ label, href }) => (
                      <button
                        key={href}
                        onClick={() => router.push(href)}
                        className="flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
                      >
                        {label}
                        <ArrowRight className="h-3 w-3 text-gray-400" />
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* All stages complete — generate button */}
        {!isPlanLoading && !plan && stage === 'complete' && view === 'chat' && (
          <Card className="max-w-2xl">
            <CardContent className="pt-8 pb-8 text-center space-y-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 mx-auto">
                <CheckCircle2 className="h-7 w-7 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">All done!</h3>
                <p className="text-sm text-gray-500 mt-1">
                  I have everything I need. Click below to generate your custom growth plan.
                </p>
              </div>
              <Button
                size="lg"
                onClick={generatePlan}
                disabled={isPlanLoading}
                className="w-full max-w-xs mx-auto"
              >
                {isPlanLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Building your plan...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate My Growth Plan
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Chat interface */}
        {!isPlanLoading && view === 'chat' && stage !== 'complete' && !plan && (
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2 flex flex-col" style={{ height: '520px' }}>
              <CardHeader className="pb-3 border-b shrink-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-medium">
                      {STAGES.find((s) => s.id === stage)?.label}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {STAGES.find((s) => s.id === stage)?.description}
                    </CardDescription>
                  </div>
                  <div className="ml-auto text-xs text-gray-400">
                    {currentStageIndex + 1} of {STAGES.length}
                  </div>
                </div>
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white rounded-br-sm'
                          : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                      }`}
                    >
                      {msg.content.split('**').map((part, j) =>
                        j % 2 === 1 ? <strong key={j}>{part}</strong> : part
                      )}
                    </div>
                  </div>
                ))}
                {isChatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
                      <div className="flex gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </CardContent>

              {/* Input */}
              <div className="p-4 border-t shrink-0">
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    placeholder="Type your answer..."
                    disabled={isChatLoading}
                    className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!input.trim() || isChatLoading}
                    size="sm"
                    className="px-3"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-gray-400">Press Enter to send</p>
                  {messages.length >= 2 && (
                    <button
                      onClick={advanceStage}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                    >
                      Continue to next section
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            </Card>

            {/* Progress card */}
            <div className="space-y-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Progress</CardTitle>
                  <CardDescription className="text-xs">
                    Complete all sections to generate your plan
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {STAGES.map((s) => {
                    const isDone = completedStages.has(s.id)
                    const isCurrent = s.id === stage
                    return (
                      <div
                        key={s.id}
                        className={`flex items-center gap-3 rounded-lg p-2 text-sm transition-colors ${
                          isCurrent
                            ? 'bg-blue-50 text-blue-900'
                            : isDone
                            ? 'text-green-700'
                            : 'text-gray-400'
                        }`}
                      >
                        {isDone ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                        ) : isCurrent ? (
                          <div className="h-4 w-4 rounded-full border-2 border-blue-500 shrink-0" />
                        ) : (
                          <div className="h-4 w-4 rounded-full border-2 border-gray-200 shrink-0" />
                        )}
                        <div>
                          <p className="font-medium text-xs">{s.label}</p>
                          <p className="text-[11px] opacity-70">{s.description}</p>
                        </div>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>

              <Card className="bg-gray-50">
                <CardContent className="pt-4">
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Your answers are used to generate a personalized acquisition plan with ICP definition, outreach strategy, and 30-day execution steps.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
