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
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

const aiCapabilities = [
  {
    id: 'email',
    icon: Mail,
    title: 'Email Generation',
    description: 'Generate personalized outreach emails for your leads',
    prompt: 'Write a cold outreach email for',
  },
  {
    id: 'linkedin',
    icon: MessageSquare,
    title: 'LinkedIn Messages',
    description: 'Create compelling LinkedIn connection requests and messages',
    prompt: 'Write a LinkedIn message for',
  },
  {
    id: 'followup',
    icon: RotateCcw,
    title: 'Follow-up Content',
    description: 'Generate follow-up messages for non-responsive leads',
    prompt: 'Write a follow-up email for',
  },
  {
    id: 'objection',
    icon: Lightbulb,
    title: 'Objection Handling',
    description: 'Get AI suggestions for common sales objections',
    prompt: 'How should I respond to this objection:',
  },
]

const recentGenerations = [
  {
    id: '1',
    type: 'email',
    title: 'Cold outreach for Sarah Chen',
    preview: 'Hi Sarah, I noticed TechCorp recently expanded their engineering team...',
    createdAt: '2 hours ago',
  },
  {
    id: '2',
    type: 'linkedin',
    title: 'LinkedIn message for Michael Rodriguez',
    preview: 'Hi Michael! I came across your profile and was impressed by Startup Labs...',
    createdAt: '5 hours ago',
  },
  {
    id: '3',
    type: 'followup',
    title: 'Follow-up for James Wilson',
    preview: 'Hi James, I wanted to circle back on my previous email about reducing...',
    createdAt: '1 day ago',
  },
]

export default function AIAssistantPage() {
  const { toast } = useToast()
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [saveModalOpen, setSaveModalOpen] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [templateCategory, setTemplateCategory] = useState('')
  const [isSaving, setIsSaving] = useState(false)

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
      // Extract subject from generated content if it starts with "Subject:"
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

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    setIsGenerating(true)
    
    // Simulate AI generation
    setTimeout(() => {
      setGeneratedContent(`Subject: Transform Your Recruitment Process with AI

Hi [Name],

I came across [Company] and was impressed by your growth in the tech industry. As you scale, I imagine hiring top talent efficiently becomes increasingly challenging.

At TalentMeta.ai, we've helped companies like yours reduce time-to-hire by 40% while improving candidate quality through AI-powered matching. Our platform:

- Automates candidate sourcing across 50+ platforms
- Uses AI to match candidates based on skill fit AND culture alignment  
- Provides predictive analytics on candidate success

Would you be open to a 15-minute call next week to explore if this could help [Company]?

Best regards,
[Your Name]

P.S. Happy to share a case study from a similar company that saw 3x improvement in qualified candidates per role.`)
      setIsGenerating(false)
    }, 2000)
  }

  return (
    <>
      <Header
        title="AI Assistant"
        description="Generate personalized content with AI"
      />

      <div className="p-6 space-y-6">
        {/* AI Capabilities */}
        <div className="grid gap-4 md:grid-cols-4">
          {aiCapabilities.map((capability) => (
            <Card
              key={capability.id}
              className="cursor-pointer hover:shadow-md transition-shadow hover:border-blue-300"
              onClick={() => setPrompt(capability.prompt)}
            >
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="rounded-lg bg-purple-100 p-2">
                    <capability.icon className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">{capability.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {capability.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Generation Input */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                <span>Generate Content</span>
              </CardTitle>
              <CardDescription>
                Describe what you want to generate and let AI do the work
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Your Prompt</label>
                <div className="flex space-x-2">
                  <Input
                    placeholder="e.g., Write a follow-up email for a lead who attended our demo but hasn't responded..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={handleGenerate} disabled={isGenerating || !prompt.trim()}>
                    {isGenerating ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Generate
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Quick Prompts */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Quick prompts
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Write a cold email for HR managers',
                    'Create a follow-up for demo no-shows',
                    'LinkedIn message for startup founders',
                    'Respond to "we don\'t have budget" objection',
                  ].map((quickPrompt) => (
                    <Button
                      key={quickPrompt}
                      variant="outline"
                      size="sm"
                      onClick={() => setPrompt(quickPrompt)}
                    >
                      {quickPrompt}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Generated Content */}
              {generatedContent && (
                <div className="space-y-3">
                  <label className="text-sm font-medium">Generated Content</label>
                  <div className="rounded-lg border bg-gray-50 p-4">
                    <pre className="whitespace-pre-wrap text-sm">{generatedContent}</pre>
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
                      <span className="text-sm text-muted-foreground">Was this helpful?</span>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ThumbsUp className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ThumbsDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Generations */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Generations</CardTitle>
              <CardDescription>Your recently generated content</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentGenerations.map((generation) => (
                  <div
                    key={generation.id}
                    className="rounded-lg border p-3 hover:bg-gray-50 cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        {generation.type === 'email' && (
                          <Mail className="h-4 w-4 text-blue-500" />
                        )}
                        {generation.type === 'linkedin' && (
                          <MessageSquare className="h-4 w-4 text-purple-500" />
                        )}
                        {generation.type === 'followup' && (
                          <RotateCcw className="h-4 w-4 text-orange-500" />
                        )}
                        <span className="text-sm font-medium">{generation.title}</span>
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                      {generation.preview}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {generation.createdAt}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Credits */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="rounded-lg bg-purple-100 p-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium">AI Credits Remaining</p>
                  <p className="text-sm text-muted-foreground">
                    You have 847 credits left this month
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="w-[85%] h-full bg-purple-500 rounded-full" />
                </div>
                <Button variant="outline" size="sm">
                  Upgrade Plan
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
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
