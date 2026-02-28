'use client'

import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Linkedin,
  Mail,
  Calendar,
  Database,
  MessageSquare,
  Video,
  Link2,
  Check,
  X,
  Settings,
  RefreshCw,
} from 'lucide-react'

const integrations = [
  {
    id: 'linkedin',
    name: 'LinkedIn',
    description: 'Connect your LinkedIn account for outreach and lead scraping',
    icon: Linkedin,
    status: 'connected',
    lastSync: '2 hours ago',
    category: 'Social',
  },
  {
    id: 'gmail',
    name: 'Gmail',
    description: 'Send and track emails through your Gmail account',
    icon: Mail,
    status: 'connected',
    lastSync: '30 minutes ago',
    category: 'Email',
  },
  {
    id: 'outlook',
    name: 'Microsoft Outlook',
    description: 'Integrate with Outlook for email and calendar',
    icon: Mail,
    status: 'disconnected',
    lastSync: null,
    category: 'Email',
  },
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    description: 'Sync meetings and schedule demos automatically',
    icon: Calendar,
    status: 'connected',
    lastSync: '1 hour ago',
    category: 'Calendar',
  },
  {
    id: 'calendly',
    name: 'Calendly',
    description: 'Automate demo scheduling with Calendly links',
    icon: Calendar,
    status: 'connected',
    lastSync: '15 minutes ago',
    category: 'Calendar',
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    description: 'Sync leads and activities with HubSpot CRM',
    icon: Database,
    status: 'disconnected',
    lastSync: null,
    category: 'CRM',
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    description: 'Two-way sync with Salesforce',
    icon: Database,
    status: 'disconnected',
    lastSync: null,
    category: 'CRM',
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Get real-time notifications in Slack',
    icon: MessageSquare,
    status: 'connected',
    lastSync: '5 minutes ago',
    category: 'Communication',
  },
  {
    id: 'zoom',
    name: 'Zoom',
    description: 'Automatically create Zoom meeting links',
    icon: Video,
    status: 'disconnected',
    lastSync: null,
    category: 'Meetings',
  },
  {
    id: 'webhooks',
    name: 'Custom Webhooks',
    description: 'Send events to your own endpoints',
    icon: Link2,
    status: 'connected',
    lastSync: '10 minutes ago',
    category: 'Developer',
  },
]

const categories = ['All', 'Email', 'Calendar', 'CRM', 'Social', 'Communication', 'Developer']

export default function IntegrationsPage() {
  return (
    <>
      <Header
        title="Integrations"
        description="Connect your tools and automate your workflow"
      />

      <div className="p-6 space-y-6">
        {/* Category Filter */}
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant={category === 'All' ? 'default' : 'outline'}
              size="sm"
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="rounded-lg bg-green-100 p-2">
                  <Check className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">5</p>
                  <p className="text-sm text-muted-foreground">Connected</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="rounded-lg bg-gray-100 p-2">
                  <X className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">4</p>
                  <p className="text-sm text-muted-foreground">Available</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="rounded-lg bg-blue-100 p-2">
                  <RefreshCw className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">1.2K</p>
                  <p className="text-sm text-muted-foreground">Syncs Today</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Integrations Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {integrations.map((integration) => (
            <Card key={integration.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="rounded-lg bg-gray-100 p-2">
                      <integration.icon className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{integration.name}</CardTitle>
                      <span className="text-xs text-muted-foreground">
                        {integration.category}
                      </span>
                    </div>
                  </div>
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-full ${
                      integration.status === 'connected'
                        ? 'bg-green-100'
                        : 'bg-gray-100'
                    }`}
                  >
                    {integration.status === 'connected' ? (
                      <Check className="h-3 w-3 text-green-600" />
                    ) : (
                      <X className="h-3 w-3 text-gray-400" />
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm">
                  {integration.description}
                </CardDescription>

                {integration.status === 'connected' && integration.lastSync && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Last synced: {integration.lastSync}
                  </p>
                )}

                <div className="mt-4 flex justify-end space-x-2">
                  {integration.status === 'connected' ? (
                    <>
                      <Button variant="ghost" size="sm">
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </Button>
                      <Button variant="outline" size="sm">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Sync
                      </Button>
                    </>
                  ) : (
                    <Button size="sm">Connect</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* API Keys Section */}
        <Card>
          <CardHeader>
            <CardTitle>API Access</CardTitle>
            <CardDescription>
              Use our API to integrate Meraki with your own apps
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-medium">API Key</p>
                <p className="mt-1 font-mono text-sm text-muted-foreground">
                  mk_live_••••••••••••••••••••
                </p>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  Show Key
                </Button>
                <Button variant="outline" size="sm">
                  Regenerate
                </Button>
              </div>
            </div>
            <div className="mt-4 flex items-center space-x-4">
              <Button variant="outline">View API Documentation</Button>
              <Button variant="outline">Configure Webhooks</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
