'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  Plus,
  Play,
  Pause,
  Mail,
  MessageSquare,
  Clock,
  Users,
  TrendingUp,
  Zap,
  X,
  Loader2,
  Trash2,
  ArrowDown,
  Check,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

const statusColors: Record<string, { bg: string; text: string }> = {
  ACTIVE: { bg: 'bg-green-100', text: 'text-green-700' },
  PAUSED: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  DRAFT: { bg: 'bg-gray-100', text: 'text-gray-700' },
  ARCHIVED: { bg: 'bg-red-100', text: 'text-red-700' },
}

const triggerLabels: Record<string, string> = {
  MANUAL: 'Manual',
  FORM_SUBMISSION: 'Form Submission',
  TAG_ADDED: 'Tag Added',
  STAGE_CHANGED: 'Stage Changed',
  SCORE_THRESHOLD: 'Score Threshold',
  API: 'API',
}

const stepTypeIcons: Record<string, React.ReactNode> = {
  EMAIL: <Mail className="h-4 w-4 text-blue-600" />,
  LINKEDIN: <MessageSquare className="h-4 w-4 text-purple-600" />,
  TASK: <Check className="h-4 w-4 text-orange-600" />,
  WAIT: <Clock className="h-4 w-4 text-gray-600" />,
}

interface StepDraft {
  type: 'EMAIL' | 'LINKEDIN' | 'TASK' | 'WAIT'
  delayDays: number
  delayHours: number
  subject?: string
  body?: string
  templateId?: string
  taskTitle?: string
  taskDescription?: string
}

interface Template {
  id: string
  name: string
  subject: string
  body: string
}

interface SeqStep {
  id: string
  order: number
  type: string
  delayDays: number
  delayHours: number
  subject?: string | null
  body?: string | null
  templateId?: string | null
  taskTitle?: string | null
}

interface Sequence {
  id: string
  name: string
  description: string | null
  status: string
  triggerType: string
  stepsCount: number
  enrolledCount: number
  completedCount: number
  steps: SeqStep[]
  createdAt: string
  updatedAt: string
}

export default function SequencesPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const [showWizard, setShowWizard] = useState(false)
  const [wizardStep, setWizardStep] = useState(1) // 1: details, 2: steps, 3: review
  const [seqName, setSeqName] = useState('')
  const [seqDesc, setSeqDesc] = useState('')
  const [seqTrigger, setSeqTrigger] = useState('MANUAL')
  const [steps, setSteps] = useState<StepDraft[]>([])

  // Step being edited
  const [addingStepType, setAddingStepType] = useState<string | null>(null)
  const [editStepIdx, setEditStepIdx] = useState<number | null>(null)

  const { data: seqData, isLoading } = useQuery({
    queryKey: ['sequences'],
    queryFn: async () => {
      const res = await fetch('/api/sequences')
      if (!res.ok) throw new Error('Failed to fetch sequences')
      return res.json()
    },
  })

  const { data: templatesData } = useQuery({
    queryKey: ['templates-for-seq'],
    queryFn: async () => {
      const res = await fetch('/api/templates')
      if (!res.ok) throw new Error('Failed to fetch templates')
      return res.json()
    },
    enabled: showWizard,
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/sequences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: seqName,
          description: seqDesc || undefined,
          triggerType: seqTrigger,
          steps: steps.map((s) => ({
            type: s.type,
            delayDays: s.delayDays,
            delayHours: s.delayHours,
            subject: s.subject,
            body: s.body,
            templateId: s.templateId,
            taskTitle: s.taskTitle,
            taskDescription: s.taskDescription,
          })),
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to create sequence')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sequences'] })
      closeWizard()
      toast({ title: 'Sequence created' })
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    },
  })

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch('/api/sequences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      if (!res.ok) throw new Error('Failed to update sequence')
      return res.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sequences'] })
      toast({ title: data.message || 'Sequence updated' })
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    },
  })

  const processMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/sequences/process', { method: 'POST' })
      if (!res.ok) throw new Error('Failed to process sequences')
      return res.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sequences'] })
      toast({ title: data.message || 'Sequences processed' })
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    },
  })

  const closeWizard = () => {
    setShowWizard(false)
    setWizardStep(1)
    setSeqName('')
    setSeqDesc('')
    setSeqTrigger('MANUAL')
    setSteps([])
    setAddingStepType(null)
    setEditStepIdx(null)
  }

  const addStep = (type: string) => {
    const newStep: StepDraft = {
      type: type as StepDraft['type'],
      delayDays: 0,
      delayHours: 0,
    }
    if (type === 'WAIT') {
      newStep.delayDays = 1
    }
    setSteps([...steps, newStep])
    setAddingStepType(null)
    setEditStepIdx(steps.length) // open edit for new step
  }

  const removeStep = (idx: number) => {
    setSteps(steps.filter((_, i) => i !== idx))
    if (editStepIdx === idx) setEditStepIdx(null)
  }

  const updateStep = (idx: number, updates: Partial<StepDraft>) => {
    setSteps(steps.map((s, i) => (i === idx ? { ...s, ...updates } : s)))
  }

  const sequences: Sequence[] = seqData?.data || []
  const templates: Template[] = templatesData?.data || []

  const totalEnrolled = sequences.reduce((s, c) => s + c.enrolledCount, 0)
  const activeCount = sequences.filter((s) => s.status === 'ACTIVE').length

  const canNext = () => {
    if (wizardStep === 1) return seqName.trim().length > 0
    if (wizardStep === 2) return steps.length > 0
    return true
  }

  return (
    <>
      <Header
        title="Sequences"
        description="Automate your lead nurturing with multi-step sequences"
        action={
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => processMutation.mutate()}
              disabled={processMutation.isPending}
            >
              {processMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              Process Now
            </Button>
            <Button onClick={() => setShowWizard(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Sequence
            </Button>
          </div>
        }
      />

      {/* Sequence Creation Wizard */}
      {showWizard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-2xl rounded-lg bg-white shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold">Create Sequence</h2>
                <p className="text-sm text-gray-500">Step {wizardStep} of 3</p>
              </div>
              <Button variant="ghost" size="icon" onClick={closeWizard}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Progress */}
            <div className="flex border-b">
              {['Details', 'Steps', 'Review'].map((label, i) => (
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
                    <label className="text-sm font-medium">Sequence Name *</label>
                    <Input
                      value={seqName}
                      onChange={(e) => setSeqName(e.target.value)}
                      placeholder="e.g. Welcome Sequence"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <textarea
                      className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={seqDesc}
                      onChange={(e) => setSeqDesc(e.target.value)}
                      placeholder="What does this sequence do?"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Trigger</label>
                    <select
                      className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={seqTrigger}
                      onChange={(e) => setSeqTrigger(e.target.value)}
                    >
                      {Object.entries(triggerLabels).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Step 2: Build Steps */}
              {wizardStep === 2 && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500">
                    Build your sequence by adding steps. Steps execute in order with optional delays.
                  </p>

                  {/* Step list */}
                  {steps.map((step, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex items-center space-x-2 rounded-lg border p-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
                          {stepTypeIcons[step.type] || <Mail className="h-4 w-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">
                            Step {idx + 1}: {step.type}
                            {step.type === 'WAIT'
                              ? ` — ${step.delayDays}d ${step.delayHours}h`
                              : step.subject
                              ? ` — ${step.subject}`
                              : step.taskTitle
                              ? ` — ${step.taskTitle}`
                              : ''}
                          </p>
                          {(step.delayDays > 0 || step.delayHours > 0) && step.type !== 'WAIT' && (
                            <p className="text-xs text-gray-400">
                              Delay: {step.delayDays}d {step.delayHours}h
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setEditStepIdx(editStepIdx === idx ? null : idx)
                          }
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500"
                          onClick={() => removeStep(idx)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Step editor inline */}
                      {editStepIdx === idx && (
                        <div className="ml-10 rounded-lg border bg-gray-50 p-4 space-y-3">
                          {(step.type === 'EMAIL') && (
                            <>
                              <div>
                                <label className="text-xs font-medium">Template (optional)</label>
                                <select
                                  className="w-full h-9 rounded-md border bg-white px-2 text-sm"
                                  value={step.templateId || ''}
                                  onChange={(e) => {
                                    const tpl = templates.find((t) => t.id === e.target.value)
                                    updateStep(idx, {
                                      templateId: e.target.value || undefined,
                                      subject: tpl?.subject || step.subject,
                                      body: tpl?.body || step.body,
                                    })
                                  }}
                                >
                                  <option value="">Write custom</option>
                                  {templates.map((t) => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="text-xs font-medium">Subject</label>
                                <Input
                                  value={step.subject || ''}
                                  onChange={(e) => updateStep(idx, { subject: e.target.value })}
                                  placeholder="Email subject line"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-medium">Body</label>
                                <textarea
                                  className="w-full min-h-[80px] rounded-md border bg-white px-3 py-2 text-sm"
                                  value={step.body || ''}
                                  onChange={(e) => updateStep(idx, { body: e.target.value })}
                                  placeholder="Email body (supports {{firstName}}, {{company}} variables)"
                                />
                              </div>
                            </>
                          )}
                          {step.type === 'TASK' && (
                            <>
                              <div>
                                <label className="text-xs font-medium">Task Title</label>
                                <Input
                                  value={step.taskTitle || ''}
                                  onChange={(e) => updateStep(idx, { taskTitle: e.target.value })}
                                  placeholder="e.g. Call the lead"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-medium">Description</label>
                                <textarea
                                  className="w-full min-h-[60px] rounded-md border bg-white px-3 py-2 text-sm"
                                  value={step.taskDescription || ''}
                                  onChange={(e) => updateStep(idx, { taskDescription: e.target.value })}
                                />
                              </div>
                            </>
                          )}
                          <div className="flex space-x-4">
                            <div>
                              <label className="text-xs font-medium">Delay Days</label>
                              <Input
                                type="number"
                                min={0}
                                value={step.delayDays}
                                onChange={(e) => updateStep(idx, { delayDays: parseInt(e.target.value) || 0 })}
                                className="w-20"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium">Delay Hours</label>
                              <Input
                                type="number"
                                min={0}
                                max={23}
                                value={step.delayHours}
                                onChange={(e) => updateStep(idx, { delayHours: parseInt(e.target.value) || 0 })}
                                className="w-20"
                              />
                            </div>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => setEditStepIdx(null)}>
                            Done
                          </Button>
                        </div>
                      )}

                      {/* Arrow between steps */}
                      {idx < steps.length - 1 && (
                        <div className="flex justify-center">
                          <ArrowDown className="h-4 w-4 text-gray-300" />
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Add Step */}
                  {addingStepType === null ? (
                    <div className="flex items-center justify-center space-x-2 rounded-lg border-2 border-dashed p-4">
                      <Button variant="outline" size="sm" onClick={() => addStep('EMAIL')}>
                        <Mail className="mr-1 h-3 w-3" /> Email
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => addStep('WAIT')}>
                        <Clock className="mr-1 h-3 w-3" /> Wait
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => addStep('TASK')}>
                        <Check className="mr-1 h-3 w-3" /> Task
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => addStep('LINKEDIN')}>
                        <MessageSquare className="mr-1 h-3 w-3" /> LinkedIn
                      </Button>
                    </div>
                  ) : null}
                </div>
              )}

              {/* Step 3: Review */}
              {wizardStep === 3 && (
                <div className="space-y-4">
                  <div className="rounded-lg border p-4 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Name</span>
                      <span className="font-medium">{seqName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Trigger</span>
                      <span className="font-medium">{triggerLabels[seqTrigger]}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Steps</span>
                      <span className="font-medium">{steps.length}</span>
                    </div>
                    {seqDesc && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Description</span>
                        <span className="font-medium">{seqDesc}</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium">Steps Preview</label>
                    <div className="mt-2 space-y-2">
                      {steps.map((step, idx) => (
                        <div key={idx} className="flex items-center space-x-3 rounded border p-3">
                          <div className="flex h-7 w-7 items-center justify-center rounded bg-gray-100 text-xs font-bold">
                            {idx + 1}
                          </div>
                          <div className="flex-1">
                            <span className="text-sm font-medium">{step.type}</span>
                            {step.subject && (
                              <span className="text-sm text-gray-500"> — {step.subject}</span>
                            )}
                            {step.taskTitle && (
                              <span className="text-sm text-gray-500"> — {step.taskTitle}</span>
                            )}
                            {(step.delayDays > 0 || step.delayHours > 0) && (
                              <span className="ml-2 text-xs text-gray-400">
                                ({step.delayDays}d {step.delayHours}h delay)
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
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
              {wizardStep === 3 ? (
                <Button
                  onClick={() => createMutation.mutate()}
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</>
                  ) : (
                    <><Plus className="mr-2 h-4 w-4" />Create Sequence</>
                  )}
                </Button>
              ) : (
                <Button onClick={() => setWizardStep(wizardStep + 1)} disabled={!canNext()}>
                  Next <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              )}
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
                  <Zap className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{sequences.length}</p>
                  <p className="text-sm text-muted-foreground">Total Sequences</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="rounded-lg bg-green-100 p-2">
                  <Play className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{activeCount}</p>
                  <p className="text-sm text-muted-foreground">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="rounded-lg bg-purple-100 p-2">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalEnrolled}</p>
                  <p className="text-sm text-muted-foreground">Leads Enrolled</p>
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
                  <p className="text-2xl font-bold">
                    {sequences.reduce((s, c) => s + c.stepsCount, 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Steps</p>
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
        {!isLoading && sequences.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Zap className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-4 font-medium">No sequences yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Create your first sequence to automate lead nurturing.
              </p>
              <Button className="mt-4" onClick={() => setShowWizard(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Sequence
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Sequences List */}
        {!isLoading && sequences.length > 0 && (
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
                            (statusColors[sequence.status] || statusColors.DRAFT).bg
                          } ${(statusColors[sequence.status] || statusColors.DRAFT).text}`}
                        >
                          {sequence.status.charAt(0) + sequence.status.slice(1).toLowerCase()}
                        </span>
                        <span className="text-xs text-gray-400">
                          {triggerLabels[sequence.triggerType]}
                        </span>
                      </div>
                      {sequence.description && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {sequence.description}
                        </p>
                      )}

                      {/* Steps Preview */}
                      <div className="mt-4 flex items-center space-x-1">
                        {sequence.steps.slice(0, 6).map((step, i) => (
                          <div
                            key={step.id}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-gray-200 bg-gray-50"
                            title={`Step ${step.order}: ${step.type}`}
                          >
                            {stepTypeIcons[step.type] || <Mail className="h-4 w-4" />}
                          </div>
                        ))}
                        {sequence.stepsCount > 6 && (
                          <span className="ml-2 text-sm text-muted-foreground">
                            +{sequence.stepsCount - 6} more
                          </span>
                        )}
                        {sequence.stepsCount === 0 && (
                          <span className="text-sm text-gray-400">No steps configured</span>
                        )}
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
                        <div className="flex items-center space-x-2">
                          <Zap className="h-4 w-4 text-gray-400" />
                          <span>
                            <strong>{sequence.stepsCount}</strong> steps
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      {sequence.status === 'ACTIVE' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => statusMutation.mutate({ id: sequence.id, status: 'PAUSED' })}
                          disabled={statusMutation.isPending}
                        >
                          <Pause className="mr-2 h-4 w-4" />
                          Pause
                        </Button>
                      )}
                      {(sequence.status === 'PAUSED' || sequence.status === 'DRAFT') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => statusMutation.mutate({ id: sequence.id, status: 'ACTIVE' })}
                          disabled={statusMutation.isPending}
                        >
                          <Play className="mr-2 h-4 w-4" />
                          {sequence.status === 'DRAFT' ? 'Activate' : 'Resume'}
                        </Button>
                      )}
                    </div>
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
