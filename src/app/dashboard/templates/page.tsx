'use client'

import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Plus,
  Mail,
  Edit,
  Copy,
  Trash2,
  MoreHorizontal,
  Eye,
} from 'lucide-react'

const templates = [
  {
    id: '1',
    name: 'Cold Outreach - Initial Contact',
    subject: "Quick question about {{company}}'s hiring process",
    category: 'Cold Outreach',
    usageCount: 234,
    openRate: 45,
    replyRate: 8,
    updatedAt: '2026-02-20',
  },
  {
    id: '2',
    name: 'Demo Follow-up',
    subject: 'Thanks for joining our demo, {{firstName}}!',
    category: 'Follow-up',
    usageCount: 156,
    openRate: 72,
    replyRate: 24,
    updatedAt: '2026-02-18',
  },
  {
    id: '3',
    name: 'Value Proposition',
    subject: 'Reduce your hiring costs by 30%',
    category: 'Sales',
    usageCount: 89,
    openRate: 52,
    replyRate: 12,
    updatedAt: '2026-02-15',
  },
  {
    id: '4',
    name: 'Re-engagement',
    subject: "{{firstName}}, we haven't heard from you",
    category: 'Re-engagement',
    usageCount: 312,
    openRate: 38,
    replyRate: 6,
    updatedAt: '2026-02-10',
  },
  {
    id: '5',
    name: 'Case Study Share',
    subject: 'How {{similarCompany}} reduced time-to-hire by 40%',
    category: 'Nurture',
    usageCount: 67,
    openRate: 58,
    replyRate: 15,
    updatedAt: '2026-02-05',
  },
]

const categoryColors: Record<string, string> = {
  'Cold Outreach': 'bg-blue-100 text-blue-700',
  'Follow-up': 'bg-green-100 text-green-700',
  'Sales': 'bg-purple-100 text-purple-700',
  'Re-engagement': 'bg-orange-100 text-orange-700',
  'Nurture': 'bg-pink-100 text-pink-700',
}

export default function TemplatesPage() {
  return (
    <>
      <Header
        title="Email Templates"
        description="Create and manage reusable email templates"
        action={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Template
          </Button>
        }
      />

      <div className="p-6 space-y-6">
        {/* Template Categories */}
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {['All', 'Cold Outreach', 'Follow-up', 'Sales', 'Re-engagement', 'Nurture'].map(
            (category) => (
              <Button
                key={category}
                variant={category === 'All' ? 'default' : 'outline'}
                size="sm"
              >
                {category}
              </Button>
            )
          )}
        </div>

        {/* Templates Grid */}
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
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      categoryColors[template.category]
                    }`}
                  >
                    {template.category}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Updated {template.updatedAt}
                  </span>
                </div>

                {/* Stats */}
                <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-lg font-semibold">{template.usageCount}</p>
                    <p className="text-xs text-muted-foreground">Used</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold">{template.openRate}%</p>
                    <p className="text-xs text-muted-foreground">Open Rate</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold">{template.replyRate}%</p>
                    <p className="text-xs text-muted-foreground">Reply Rate</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 flex justify-end space-x-2">
                  <Button variant="ghost" size="sm">
                    <Eye className="mr-2 h-4 w-4" />
                    Preview
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Copy className="mr-2 h-4 w-4" />
                    Duplicate
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Create New Template Card */}
          <Card className="flex items-center justify-center border-dashed hover:shadow-md transition-shadow cursor-pointer min-h-[250px]">
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
      </div>
    </>
  )
}
