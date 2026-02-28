'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  MoreHorizontal,
  Mail,
  Phone,
  Linkedin,
  Star,
  StarOff,
} from 'lucide-react'

// Mock data
const leads = [
  {
    id: '1',
    firstName: 'Sarah',
    lastName: 'Chen',
    email: 'sarah.chen@techcorp.com',
    company: 'TechCorp Inc',
    jobTitle: 'Head of Talent Acquisition',
    status: 'QUALIFIED',
    score: 85,
    source: 'LINKEDIN',
    lastContactedAt: '2026-02-27T10:30:00',
    tags: ['Enterprise', 'High Priority'],
  },
  {
    id: '2',
    firstName: 'Michael',
    lastName: 'Rodriguez',
    email: 'm.rodriguez@startuplabs.io',
    company: 'Startup Labs',
    jobTitle: 'CEO',
    status: 'PROPOSAL',
    score: 92,
    source: 'WEBSITE_FORM',
    lastContactedAt: '2026-02-26T14:15:00',
    tags: ['Startup', 'Demo Scheduled'],
  },
  {
    id: '3',
    firstName: 'Emma',
    lastName: 'Thompson',
    email: 'emma.t@globalstaffing.com',
    company: 'Global Staffing',
    jobTitle: 'VP of Operations',
    status: 'CONTACTED',
    score: 65,
    source: 'EMAIL_CAMPAIGN',
    lastContactedAt: '2026-02-25T09:00:00',
    tags: ['Staffing', 'Mid-Market'],
  },
  {
    id: '4',
    firstName: 'James',
    lastName: 'Wilson',
    email: 'jwilson@hrsolutions.com',
    company: 'HR Solutions',
    jobTitle: 'Director of HR',
    status: 'NEW',
    score: 45,
    source: 'COLD_OUTREACH',
    lastContactedAt: null,
    tags: ['HR Tech'],
  },
  {
    id: '5',
    firstName: 'Lisa',
    lastName: 'Park',
    email: 'lisa.park@recruitpro.com',
    company: 'RecruitPro',
    jobTitle: 'Founder',
    status: 'NEGOTIATION',
    score: 95,
    source: 'REFERRAL',
    lastContactedAt: '2026-02-28T08:45:00',
    tags: ['Startup', 'High Value'],
  },
]

const statusColors: Record<string, string> = {
  NEW: 'bg-gray-100 text-gray-700',
  CONTACTED: 'bg-blue-100 text-blue-700',
  QUALIFIED: 'bg-yellow-100 text-yellow-700',
  PROPOSAL: 'bg-purple-100 text-purple-700',
  NEGOTIATION: 'bg-orange-100 text-orange-700',
  WON: 'bg-green-100 text-green-700',
  LOST: 'bg-red-100 text-red-700',
}

const sourceLabels: Record<string, string> = {
  LINKEDIN: 'LinkedIn',
  WEBSITE_FORM: 'Website',
  EMAIL_CAMPAIGN: 'Email',
  COLD_OUTREACH: 'Cold Outreach',
  REFERRAL: 'Referral',
  INBOUND: 'Inbound',
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-yellow-600'
  if (score >= 40) return 'text-orange-600'
  return 'text-red-600'
}

export default function LeadsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLeads, setSelectedLeads] = useState<string[]>([])

  const toggleSelectAll = () => {
    if (selectedLeads.length === leads.length) {
      setSelectedLeads([])
    } else {
      setSelectedLeads(leads.map((l) => l.id))
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedLeads((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  return (
    <>
      <Header
        title="Leads"
        description="Manage and nurture your prospects"
        action={
          <div className="flex items-center space-x-2">
            <Button variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              Import
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Lead
            </Button>
          </div>
        }
      />

      <div className="p-6 space-y-4">
        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search leads by name, email, or company..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Filters
              </Button>
              <select className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">All Statuses</option>
                <option value="NEW">New</option>
                <option value="CONTACTED">Contacted</option>
                <option value="QUALIFIED">Qualified</option>
                <option value="PROPOSAL">Proposal</option>
                <option value="NEGOTIATION">Negotiation</option>
                <option value="WON">Won</option>
                <option value="LOST">Lost</option>
              </select>
              <select className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">All Sources</option>
                <option value="LINKEDIN">LinkedIn</option>
                <option value="WEBSITE_FORM">Website Form</option>
                <option value="EMAIL_CAMPAIGN">Email Campaign</option>
                <option value="REFERRAL">Referral</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Actions */}
        {selectedLeads.length > 0 && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-700">
                  {selectedLeads.length} lead(s) selected
                </span>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Mail className="mr-2 h-4 w-4" />
                    Send Email
                  </Button>
                  <Button variant="outline" size="sm">
                    Add to Sequence
                  </Button>
                  <Button variant="outline" size="sm">
                    Update Status
                  </Button>
                  <Button variant="outline" size="sm">
                    Add Tags
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Leads Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedLeads.length === leads.length}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                      Company
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                      Score
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                      Source
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                      Tags
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedLeads.includes(lead.id)}
                          onChange={() => toggleSelect(lead.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-600">
                            {lead.firstName[0]}
                            {lead.lastName[0]}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {lead.firstName} {lead.lastName}
                            </p>
                            <p className="text-sm text-gray-500">{lead.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{lead.company}</p>
                        <p className="text-sm text-gray-500">{lead.jobTitle}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            statusColors[lead.status]
                          }`}
                        >
                          {lead.status.charAt(0) + lead.status.slice(1).toLowerCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <span className={`font-semibold ${getScoreColor(lead.score)}`}>
                            {lead.score}
                          </span>
                          {lead.score >= 80 ? (
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          ) : (
                            <StarOff className="h-4 w-4 text-gray-300" />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600">
                          {sourceLabels[lead.source]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {lead.tags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Mail className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Phone className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Linkedin className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t px-4 py-3">
              <p className="text-sm text-gray-500">
                Showing 1 to {leads.length} of {leads.length} results
              </p>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" disabled>
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled>
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
