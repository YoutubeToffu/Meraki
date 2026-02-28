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
} from 'lucide-react'

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
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState<string | null>(null)

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
                      <Button variant="outline" size="sm">
                        <Copy className="mr-2 h-4 w-4" />
                        Copy
                      </Button>
                      <Button variant="outline" size="sm">
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
    </>
  )
}
