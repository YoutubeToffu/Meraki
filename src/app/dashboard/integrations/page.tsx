'use client'

import { Suspense, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Linkedin, Mail, Calendar, Database, MessageSquare, Video, Link2,
  Check, X, RefreshCw, Loader2, AlertCircle,
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { useSearchParams } from 'next/navigation'

const INTEGRATION_META: Record<string, { icon: any; color: string }> = {
  LINKEDIN: { icon: Linkedin, color: 'text-blue-600' },
  GMAIL: { icon: Mail, color: 'text-red-500' },
  OUTLOOK: { icon: Mail, color: 'text-blue-500' },
  GOOGLE_CALENDAR: { icon: Calendar, color: 'text-green-600' },
  CALENDLY: { icon: Calendar, color: 'text-blue-500' },
  HUBSPOT: { icon: Database, color: 'text-orange-500' },
  SALESFORCE: { icon: Database, color: 'text-blue-600' },
  SLACK: { icon: MessageSquare, color: 'text-purple-600' },
  ZOOM: { icon: Video, color: 'text-blue-500' },
  WEBHOOK: { icon: Link2, color: 'text-gray-600' },
}

const CONNECT_URLS: Record<string, string> = {
  LINKEDIN: '/api/integrations/linkedin/connect',
}

function IntegrationsContent() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()

  useEffect(() => {
    const connected = searchParams.get('connected')
    const error = searchParams.get('error')
    if (connected) {
      toast({ title: `${connected.charAt(0).toUpperCase() + connected.slice(1)} connected successfully!` })
      queryClient.invalidateQueries({ queryKey: ['integrations'] })
    }
    if (error) {
      const messages: Record<string, string> = {
        linkedin_denied: 'LinkedIn connection was denied.',
        no_code: 'No authorization code received.',
        token_exchange: 'Failed to exchange token. Check your app credentials.',
        callback_failed: 'Connection failed. Please try again.',
      }
      toast({ title: messages[error] ?? 'Connection failed', variant: 'destructive' })
    }
  }, []) // eslint-disable-line

  const { data, isLoading } = useQuery({
    queryKey: ['integrations'],
    queryFn: async () => {
      const res = await fetch('/api/integrations')
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    },
  })

  const disconnectMutation = useMutation({
    mutationFn: async (type: string) => {
      const res = await fetch(`/api/integrations?type=${type}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to disconnect')
      return res.json()
    },
    onSuccess: (_: any, type: string) => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] })
      toast({ title: `${type} disconnected` })
    },
    onError: (e: Error) => toast({ title: e.message, variant: 'destructive' }),
  })

  const integrations: any[] = data?.data ?? []
  const connectedCount: number = data?.connectedCount ?? 0

  const formatLastSync = (iso: string | null) => {
    if (!iso) return null
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  return (
    <>
      <Header title="Integrations" description="Connect your tools and automate your workflow" />
      <div className="p-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { label: 'Connected', value: connectedCount, icon: Check, bg: 'bg-green-100', color: 'text-green-600' },
            { label: 'Available', value: integrations.length - connectedCount, icon: X, bg: 'bg-gray-100', color: 'text-gray-600' },
            { label: 'Total', value: integrations.length, icon: RefreshCw, bg: 'bg-blue-100', color: 'text-blue-600' },
          ].map(({ label, value, icon: Icon, bg, color }) => (
            <Card key={label}><CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className={`rounded-lg ${bg} p-2`}><Icon className={`h-5 w-5 ${color}`} /></div>
                <div><p className="text-2xl font-bold">{value}</p><p className="text-sm text-muted-foreground">{label}</p></div>
              </div>
            </CardContent></Card>
          ))}
        </div>

        {!isLoading && !integrations.find((i: any) => i.type === 'LINKEDIN' && i.status === 'CONNECTED') && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="flex items-start gap-4 p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600">
                <Linkedin className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-blue-900">Connect LinkedIn</p>
                <p className="text-sm text-blue-700 mt-0.5">Requires <code className="bg-blue-100 px-1 rounded text-xs">LINKEDIN_CLIENT_ID</code> and <code className="bg-blue-100 px-1 rounded text-xs">LINKEDIN_CLIENT_SECRET</code> in your .env file.</p>
              </div>
              <Button size="sm" className="shrink-0 bg-blue-600 hover:bg-blue-700" onClick={() => window.location.href = '/api/integrations/linkedin/connect'}>Connect</Button>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {integrations.map((integration: any) => {
              const meta = INTEGRATION_META[integration.type] ?? { icon: Link2, color: 'text-gray-600' }
              const Icon = meta.icon
              const isConnected = integration.status === 'CONNECTED'
              const hasOAuth = !!CONNECT_URLS[integration.type]
              const profile = integration.settings as any
              return (
                <Card key={integration.type} className={`hover:shadow-md transition-shadow ${isConnected ? 'border-green-200' : ''}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`rounded-lg p-2 ${isConnected ? 'bg-green-50' : 'bg-gray-100'}`}>
                          <Icon className={`h-5 w-5 ${isConnected ? 'text-green-600' : meta.color}`} />
                        </div>
                        <div>
                          <CardTitle className="text-base">{integration.name}</CardTitle>
                          <span className="text-xs text-muted-foreground">{integration.category}</span>
                        </div>
                      </div>
                      <div className={`flex h-6 w-6 items-center justify-center rounded-full ${isConnected ? 'bg-green-100' : 'bg-gray-100'}`}>
                        {isConnected ? <Check className="h-3 w-3 text-green-600" /> : <X className="h-3 w-3 text-gray-400" />}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <CardDescription className="text-xs">{integration.description}</CardDescription>
                    {isConnected && profile?.name && (
                      <div className="rounded-md bg-green-50 px-3 py-2 text-xs text-green-800">
                        Connected as: <strong>{profile.name}</strong>{profile.email ? ` (${profile.email})` : ''}
                      </div>
                    )}
                    {integration.lastSyncAt && <p className="text-xs text-gray-400">Last synced: {formatLastSync(integration.lastSyncAt)}</p>}
                    <div className="flex items-center gap-2">
                      {isConnected ? (
                        <>
                          <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => { if (confirm(`Disconnect ${integration.name}?`)) disconnectMutation.mutate(integration.type) }}
                            disabled={disconnectMutation.isPending}>Disconnect</Button>
                          {integration.type === 'LINKEDIN' && (
                            <Button variant="outline" size="sm" onClick={() => window.location.href = '/dashboard/linkedin'}>View Activity</Button>
                          )}
                        </>
                      ) : hasOAuth ? (
                        <Button size="sm" onClick={() => window.location.href = CONNECT_URLS[integration.type]}>Connect</Button>
                      ) : (
                        <Button size="sm" variant="outline" disabled>Coming Soon</Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="flex items-start gap-3 p-4">
            <AlertCircle className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium">LinkedIn API Note</p>
              <p className="mt-0.5 text-xs">LinkedIn restricts automated messaging to Marketing Developer Platform partners. The LinkedIn connection enables OAuth and profile data. For outreach, Meraki tracks your activity manually — log it from the LinkedIn page after taking action.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

export default function IntegrationsPage() {
  return (
    <Suspense>
      <IntegrationsContent />
    </Suspense>
  )
}
