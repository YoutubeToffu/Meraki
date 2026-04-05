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
  Edit,
  Copy,
  Trash2,
  MoreHorizontal,
  Eye,
  X,
  Loader2,
  BookOpen,
  Download,
  CheckCircle2,
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

const categoryColors: Record<string, string> = {
  'Cold Outreach': 'bg-blue-100 text-blue-700',
  'Follow-up': 'bg-green-100 text-green-700',
  'Sales': 'bg-purple-100 text-purple-700',
  'Re-engagement': 'bg-orange-100 text-orange-700',
  'Nurture': 'bg-pink-100 text-pink-700',
}

const categories = ['All', 'Cold Outreach', 'Follow-up', 'Sales', 'Re-engagement', 'Nurture']

interface PlaybookInfo {
  id: string
  industry: string
  description: string
  icon: string
  templateCount: number
  installedCount: number
}

interface Template {
  id: string
  name: string
  subject: string
  body: string
  category: string | null
  variables: string[]
  createdAt: string
  updatedAt: string
}

export default function TemplatesPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [activeCategory, setActiveCategory] = useState('All')
  const [showModal, setShowModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [showPlaybooks, setShowPlaybooks] = useState(false)
  const [installingPlaybook, setInstallingPlaybook] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    subject: '',
    body: '',
    category: '',
  })

  const { data, isLoading } = useQuery({
    queryKey: ['templates', activeCategory],
    queryFn: async () => {
      const query = activeCategory !== 'All' ? `?category=${encodeURIComponent(activeCategory)}` : ''
      const res = await fetch(`/api/templates${query}`)
      if (!res.ok) throw new Error('Failed to fetch templates')
      return res.json()
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to create template')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      closeModal()
      toast({ title: 'Template created' })
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof form }) => {
      const res = await fetch(`/api/templates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to update template')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      closeModal()
      toast({ title: 'Template updated' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/templates/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete template')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      toast({ title: 'Template deleted' })
    },
  })

  const { data: playbooksData } = useQuery({
    queryKey: ['playbooks'],
    queryFn: async () => {
      const res = await fetch('/api/templates/playbooks')
      if (!res.ok) throw new Error('Failed to fetch playbooks')
      return res.json()
    },
    enabled: showPlaybooks,
  })

  const installPlaybook = async (playbookId: string) => {
    setInstallingPlaybook(playbookId)
    try {
      const res = await fetch('/api/templates/playbooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playbookId }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error)
      toast({ title: result.message })
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      queryClient.invalidateQueries({ queryKey: ['playbooks'] })
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    } finally {
      setInstallingPlaybook(null)
    }
  }

  const playbooks: PlaybookInfo[] = playbooksData?.data || []

  const closeModal = () => {
    setShowModal(false)
    setEditingTemplate(null)
    setForm({ name: '', subject: '', body: '', category: '' })
  }

  const openEdit = (template: Template) => {
    setEditingTemplate(template)
    setForm({
      name: template.name,
      subject: template.subject,
      body: template.body,
      category: template.category || '',
    })
    setShowModal(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, data: form })
    } else {
      createMutation.mutate(form)
    }
  }

  const templates: Template[] = data?.data || []
  const isSaving = createMutation.isPending || updateMutation.isPending

  return (
    <>
      <Header
        title="Email Templates"
        description="Create and manage reusable email templates"
        action={
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => setShowPlaybooks(!showPlaybooks)}>
              <BookOpen className="mr-2 h-4 w-4" />
              Industry Playbooks
            </Button>
            <Button onClick={() => { setEditingTemplate(null); setForm({ name: '', subject: '', body: '', category: '' }); setShowModal(true) }}>
              <Plus className="mr-2 h-4 w-4" />
              Create Template
            </Button>
          </div>
        }
      />

      {/* Template Editor Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                {editingTemplate ? 'Edit Template' : 'Create Template'}
              </h2>
              <Button variant="ghost" size="icon" onClick={closeModal}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-sm font-medium">Template Name *</label>
                <Input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Cold Outreach - Initial Contact"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Subject Line *</label>
                <Input
                  required
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="e.g. Quick question about {{company}}"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Use {'{{variable}}'} for personalization
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Category</label>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  <option value="">None</option>
                  {categories.filter((c) => c !== 'All').map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Email Body *</label>
                <textarea
                  required
                  rows={8}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  placeholder="Write your email body here. Use {{firstName}}, {{company}}, etc."
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <Button type="button" variant="outline" onClick={closeModal}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>
                  ) : editingTemplate ? 'Update Template' : 'Create Template'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="p-6 space-y-6">
        {/* Template Categories */}
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant={category === activeCategory ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Industry Playbooks Panel */}
        {showPlaybooks && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Industry Playbooks</CardTitle>
                  <CardDescription>
                    Pre-built email templates for your industry — install with one click
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowPlaybooks(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {playbooks.map((pb) => {
                  const fullyInstalled = pb.installedCount === pb.templateCount
                  return (
                    <div
                      key={pb.id}
                      className="rounded-lg border p-4 space-y-3 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-2xl">{pb.icon}</div>
                          <h3 className="mt-1 font-semibold text-sm">{pb.industry}</h3>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {pb.templateCount} templates
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{pb.description}</p>
                      {fullyInstalled ? (
                        <div className="flex items-center text-sm text-green-600 font-medium">
                          <CheckCircle2 className="mr-1 h-4 w-4" />
                          Installed
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          className="w-full"
                          disabled={installingPlaybook === pb.id}
                          onClick={() => installPlaybook(pb.id)}
                        >
                          {installingPlaybook === pb.id ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Installing...</>
                          ) : (
                            <>
                              <Download className="mr-2 h-4 w-4" />
                              Install{pb.installedCount > 0 ? ` (${pb.templateCount - pb.installedCount} remaining)` : ''}
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  )
                })}
                {playbooks.length === 0 && (
                  <div className="col-span-full py-8 text-center text-sm text-gray-400">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin mb-2" />
                    Loading playbooks...
                  </div>
                )}
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

        {/* Empty State */}
        {!isLoading && templates.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                <Mail className="h-6 w-6 text-gray-600" />
              </div>
              <h3 className="mt-4 font-medium">No templates yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Create your first email template to get started.
              </p>
              <Button className="mt-4" onClick={() => setShowModal(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Template
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Templates Grid */}
        {!isLoading && templates.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{template.name}</CardTitle>
                    <CardDescription className="mt-1 text-xs">
                      {template.subject}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  {template.category ? (
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        categoryColors[template.category] || 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {template.category}
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                      Uncategorized
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {new Date(template.updatedAt).toLocaleDateString()}
                  </span>
                </div>

                <p className="mt-3 text-sm text-gray-500 line-clamp-2">
                  {template.body}
                </p>

                {/* Actions */}
                <div className="mt-4 flex justify-end space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(template)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => deleteMutation.mutate(template.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Create New Template Card */}
          <Card
            className="flex items-center justify-center border-dashed hover:shadow-md transition-shadow cursor-pointer min-h-[250px]"
            onClick={() => setShowModal(true)}
          >
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                <Plus className="h-6 w-6 text-gray-600" />
              </div>
              <h3 className="mt-4 font-medium">Create New Template</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Start from scratch or use AI
              </p>
            </div>
          </Card>
        </div>
        )}
      </div>
    </>
  )
}
