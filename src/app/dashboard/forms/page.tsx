'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  FileText,
  Plus,
  Trash2,
  Copy,
  Check,
  X,
  Loader2,
  ExternalLink,
  Eye,
  BarChart2,
  Code2,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Mail,
  User,
  Building,
  Phone,
  MessageSquare,
  List,
  ToggleLeft,
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

const FIELD_TYPES = [
  { type: 'email', label: 'Email', icon: Mail, mapTo: 'email' },
  { type: 'text', label: 'First Name', icon: User, mapTo: 'firstName' },
  { type: 'text', label: 'Last Name', icon: User, mapTo: 'lastName' },
  { type: 'text', label: 'Company', icon: Building, mapTo: 'company' },
  { type: 'text', label: 'Job Title', icon: User, mapTo: 'jobTitle' },
  { type: 'tel', label: 'Phone', icon: Phone, mapTo: 'phone' },
  { type: 'textarea', label: 'Message', icon: MessageSquare, mapTo: 'message' },
  { type: 'text', label: 'Custom Text', icon: FileText, mapTo: undefined },
  { type: 'select', label: 'Dropdown', icon: List, mapTo: undefined },
  { type: 'checkbox', label: 'Checkbox', icon: ToggleLeft, mapTo: undefined },
]

interface FormField {
  id: string
  type: string
  label: string
  placeholder?: string
  required: boolean
  options?: string[]
  mapTo?: string
}

interface LeadForm {
  id: string
  name: string
  slug: string
  fields: FormField[]
  settings: any
  theme: any
  views: number
  submissions: number
  isActive: boolean
  createdAt: string
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

function slugify(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export default function FormsPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const [showBuilder, setShowBuilder] = useState(false)
  const [editForm, setEditForm] = useState<LeadForm | null>(null)
  const [embedFormId, setEmbedFormId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Builder state
  const [formName, setFormName] = useState('')
  const [formSlug, setFormSlug] = useState('')
  const [fields, setFields] = useState<FormField[]>([
    { id: 'f1', type: 'text', label: 'First Name', placeholder: 'John', required: true, mapTo: 'firstName' },
    { id: 'f2', type: 'email', label: 'Email', placeholder: 'you@company.com', required: true, mapTo: 'email' },
    { id: 'f3', type: 'text', label: 'Company', placeholder: 'Acme Inc.', required: false, mapTo: 'company' },
  ])
  const [submitText, setSubmitText] = useState('Get Early Access')
  const [successMsg, setSuccessMsg] = useState("Thanks! We'll reach out soon.")
  const [editFieldIdx, setEditFieldIdx] = useState<number | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['forms'],
    queryFn: async () => {
      const res = await fetch('/api/forms')
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    },
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          slug: formSlug || slugify(formName),
          fields,
          settings: { submitButtonText: submitText, successMessage: successMsg, autoTags: [] },
        }),
      })
      if (!res.ok) { const e = await res.json(); throw new Error(e.error) }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forms'] })
      resetBuilder()
      toast({ title: 'Form created!' })
    },
    onError: (e: Error) => toast({ title: e.message, variant: 'destructive' }),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/forms?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      return res.json()
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['forms'] }); toast({ title: 'Form deleted' }) },
    onError: (e: Error) => toast({ title: e.message, variant: 'destructive' }),
  })

  const resetBuilder = () => {
    setShowBuilder(false)
    setEditForm(null)
    setFormName('')
    setFormSlug('')
    setFields([
      { id: 'f1', type: 'text', label: 'First Name', placeholder: 'John', required: true, mapTo: 'firstName' },
      { id: 'f2', type: 'email', label: 'Email', placeholder: 'you@company.com', required: true, mapTo: 'email' },
      { id: 'f3', type: 'text', label: 'Company', placeholder: 'Acme Inc.', required: false, mapTo: 'company' },
    ])
    setSubmitText('Get Early Access')
    setSuccessMsg("Thanks! We'll reach out soon.")
    setEditFieldIdx(null)
  }

  const addField = (tpl: typeof FIELD_TYPES[0]) => {
    const id = `f${Date.now()}`
    setFields([...fields, { id, type: tpl.type, label: tpl.label, placeholder: '', required: false, mapTo: tpl.mapTo }])
    setEditFieldIdx(fields.length)
  }

  const updateField = (idx: number, patch: Partial<FormField>) => {
    setFields(fields.map((f, i) => i === idx ? { ...f, ...patch } : f))
  }

  const removeField = (idx: number) => {
    setFields(fields.filter((_, i) => i !== idx))
    if (editFieldIdx === idx) setEditFieldIdx(null)
  }

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const forms: LeadForm[] = data?.data ?? []
  const conversionRate = (form: LeadForm) =>
    form.views > 0 ? Math.round((form.submissions / form.views) * 100) : 0

  return (
    <>
      <Header
        title="Lead Forms"
        description="Capture leads with embeddable forms. Each submission creates a lead and can auto-enroll them in a sequence."
        action={
          <Button onClick={() => setShowBuilder(true)}>
            <Plus className="mr-2 h-4 w-4" /> Create Form
          </Button>
        }
      />

      {/* Builder Modal */}
      {showBuilder && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto py-6">
          <div className="w-full max-w-5xl rounded-lg bg-white shadow-xl flex flex-col mx-4">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-base font-semibold">Form Builder</h2>
              <Button variant="ghost" size="icon" onClick={resetBuilder}><X className="h-4 w-4" /></Button>
            </div>

            <div className="flex min-h-[600px]">
              {/* Left: Fields canvas */}
              <div className="flex-1 border-r p-6 space-y-4 overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Form Name *</label>
                    <Input
                      className="mt-1"
                      value={formName}
                      onChange={(e) => {
                        setFormName(e.target.value)
                        if (!formSlug) setFormSlug(slugify(e.target.value))
                      }}
                      placeholder="e.g. Early Access Sign-Up"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">URL Slug *</label>
                    <div className="mt-1 flex items-center gap-1">
                      <span className="text-xs text-gray-400 shrink-0">/forms/</span>
                      <Input
                        value={formSlug}
                        onChange={(e) => setFormSlug(slugify(e.target.value))}
                        placeholder="early-access"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Form Fields</label>
                  <div className="space-y-2">
                    {fields.map((field, idx) => (
                      <div key={field.id} className="rounded-lg border bg-white">
                        <div className="flex items-center gap-3 px-3 py-2.5">
                          <GripVertical className="h-4 w-4 text-gray-300 cursor-grab" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{field.label}</p>
                            <p className="text-xs text-gray-400">{field.type}{field.required ? ' · required' : ''}{field.mapTo ? ` → ${field.mapTo}` : ''}</p>
                          </div>
                          <button onClick={() => setEditFieldIdx(editFieldIdx === idx ? null : idx)} className="text-gray-400 hover:text-gray-700">
                            {editFieldIdx === idx ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </button>
                          <button onClick={() => removeField(idx)} className="text-gray-300 hover:text-red-500">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        {editFieldIdx === idx && (
                          <div className="border-t bg-gray-50 px-4 py-3 space-y-2">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-xs font-medium">Label</label>
                                <Input className="mt-0.5 h-8 text-xs" value={field.label} onChange={(e) => updateField(idx, { label: e.target.value })} />
                              </div>
                              <div>
                                <label className="text-xs font-medium">Placeholder</label>
                                <Input className="mt-0.5 h-8 text-xs" value={field.placeholder ?? ''} onChange={(e) => updateField(idx, { placeholder: e.target.value })} />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-xs font-medium">Maps to CRM field</label>
                                <select className="mt-0.5 w-full h-8 rounded border text-xs px-2" value={field.mapTo ?? ''} onChange={(e) => updateField(idx, { mapTo: e.target.value || undefined })}>
                                  <option value="">None</option>
                                  {['email','firstName','lastName','company','jobTitle','phone','message'].map(k => <option key={k} value={k}>{k}</option>)}
                                </select>
                              </div>
                              <div className="flex items-end gap-2 pb-0.5">
                                <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                                  <input type="checkbox" checked={field.required} onChange={(e) => updateField(idx, { required: e.target.checked })} />
                                  Required
                                </label>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Add field */}
                  <div className="mt-3">
                    <p className="text-xs font-medium text-gray-500 mb-2">Add field</p>
                    <div className="flex flex-wrap gap-1.5">
                      {FIELD_TYPES.map((tpl) => (
                        <button
                          key={`${tpl.type}-${tpl.label}`}
                          onClick={() => addField(tpl)}
                          className="flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-gray-50 transition-colors"
                        >
                          <tpl.icon className="h-3 w-3" />
                          {tpl.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Button Text</label>
                    <Input className="mt-1" value={submitText} onChange={(e) => setSubmitText(e.target.value)} placeholder="Submit" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Success Message</label>
                    <Input className="mt-1" value={successMsg} onChange={(e) => setSuccessMsg(e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Right: Live preview */}
              <div className="w-80 bg-gray-50 p-6 space-y-4">
                <p className="text-sm font-semibold text-gray-700">Preview</p>
                <div className="rounded-lg border bg-white p-5 shadow-sm space-y-3">
                  <h3 className="font-semibold text-gray-900">{formName || 'Your Form'}</h3>
                  {fields.map((field) => (
                    <div key={field.id}>
                      <label className="text-xs font-medium text-gray-700">
                        {field.label} {field.required && <span className="text-red-500">*</span>}
                      </label>
                      {field.type === 'textarea' ? (
                        <textarea className="mt-0.5 w-full rounded-md border px-3 py-2 text-sm text-gray-400 min-h-[60px]" placeholder={field.placeholder} disabled />
                      ) : field.type === 'select' ? (
                        <select className="mt-0.5 w-full rounded-md border px-3 py-2 text-sm text-gray-400 h-9" disabled>
                          <option>Select...</option>
                        </select>
                      ) : field.type === 'checkbox' ? (
                        <div className="mt-0.5 flex items-center gap-2">
                          <input type="checkbox" disabled className="h-4 w-4" />
                          <span className="text-sm text-gray-400">{field.placeholder || field.label}</span>
                        </div>
                      ) : (
                        <input className="mt-0.5 w-full rounded-md border px-3 py-2 text-sm text-gray-400 h-9" placeholder={field.placeholder} disabled />
                      )}
                    </div>
                  ))}
                  <button className="w-full rounded-md bg-blue-600 py-2 text-sm font-medium text-white mt-1">{submitText || 'Submit'}</button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t px-6 py-4">
              <Button variant="outline" onClick={resetBuilder}>Cancel</Button>
              <Button
                onClick={() => createMutation.mutate()}
                disabled={!formName || !formSlug || fields.length === 0 || createMutation.isPending}
              >
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Form
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Embed Code Modal */}
      {embedFormId && (() => {
        const form = forms.find(f => f.id === embedFormId)
        if (!form) return null
        const publicUrl = `${APP_URL}/forms/${form.slug}`
        const embedCode = `<iframe src="${publicUrl}?embed=1" width="100%" height="600" frameborder="0" style="border-radius:8px;"></iframe>`
        const scriptEmbed = `<div id="meraki-form-${form.id}"></div>\n<script src="${APP_URL}/forms/embed.js" data-form-id="${form.id}"></script>`
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
              <div className="flex items-center justify-between border-b px-5 py-4">
                <h2 className="text-base font-semibold">Embed: {form.name}</h2>
                <Button variant="ghost" size="icon" onClick={() => setEmbedFormId(null)}><X className="h-4 w-4" /></Button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <p className="text-sm font-medium mb-1">Public Form URL</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded bg-gray-100 px-3 py-2 text-xs truncate">{publicUrl}</code>
                    <Button size="sm" variant="outline" onClick={() => copyToClipboard(publicUrl, 'url')}>
                      {copiedId === 'url' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </Button>
                    <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="outline"><ExternalLink className="h-3 w-3" /></Button>
                    </a>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">iFrame Embed Code</p>
                  <div className="relative">
                    <pre className="rounded bg-gray-100 px-3 py-2 text-xs overflow-x-auto">{embedCode}</pre>
                    <Button size="sm" variant="outline" className="absolute top-1 right-1" onClick={() => copyToClipboard(embedCode, 'iframe')}>
                      {copiedId === 'iframe' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Script Embed</p>
                  <div className="relative">
                    <pre className="rounded bg-gray-100 px-3 py-2 text-xs overflow-x-auto whitespace-pre-wrap">{scriptEmbed}</pre>
                    <Button size="sm" variant="outline" className="absolute top-1 right-1" onClick={() => copyToClipboard(scriptEmbed, 'script')}>
                      {copiedId === 'script' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      <div className="p-6 space-y-6">
        {isLoading && <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>}

        {!isLoading && forms.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-4 font-medium text-gray-900">No forms yet</h3>
              <p className="mt-1 text-sm text-gray-500">Create a lead capture form and embed it on your website.</p>
              <Button className="mt-4" onClick={() => setShowBuilder(true)}>
                <Plus className="mr-2 h-4 w-4" /> Create Form
              </Button>
            </CardContent>
          </Card>
        )}

        {!isLoading && forms.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {forms.map((form) => (
              <Card key={form.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{form.name}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">/forms/{form.slug}</p>
                    </div>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${form.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {form.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center rounded-lg bg-gray-50 py-3">
                    <div>
                      <p className="text-lg font-bold text-gray-900">{form.views}</p>
                      <p className="text-[10px] text-gray-500">Views</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-blue-600">{form.submissions}</p>
                      <p className="text-[10px] text-gray-500">Leads</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-green-600">{conversionRate(form)}%</p>
                      <p className="text-[10px] text-gray-500">Conv.</p>
                    </div>
                  </div>

                  <p className="text-xs text-gray-400">{(form.fields as any[]).length} fields</p>

                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => setEmbedFormId(form.id)}>
                      <Code2 className="mr-1 h-3 w-3" /> Embed
                    </Button>
                    <a href={`${APP_URL}/forms/${form.slug}`} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="outline">
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </a>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-500 hover:bg-red-50"
                      onClick={() => { if (confirm('Delete this form?')) deleteMutation.mutate(form.id) }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
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
