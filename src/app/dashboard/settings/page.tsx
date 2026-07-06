'use client'

import Link from 'next/link'
import type { ChangeEvent } from 'react'
import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import {
  Bell,
  Building,
  Camera,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Loader2,
  Mail,
  Settings2,
  Shield,
  Trash2,
  User,
} from 'lucide-react'
import { useRef } from 'react'

type NotificationFrequency = 'ALL' | 'IMPORTANT' | 'DAILY' | 'NONE'

type ProfileSettings = {
  id: string
  email: string
  name: string | null
  avatar: string | null
  bio: string | null
  phone: string | null
  senderName: string | null
  replyToEmail: string | null
  emailSignature: string | null
  timezone: string
  notificationFrequency: NotificationFrequency
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER'
  organizationId: string
}

type OrganizationSettings = {
  id: string
  name: string
  slug: string
  domain: string | null
  logo: string | null
  plan: 'FREE' | 'STARTER' | 'GROWTH' | 'ENTERPRISE'
  aiCredits: number
  usage: {
    teamMembers: number
    leads: number
    aiCredits: number
  }
}

type ProfileFormState = {
  name: string
  email: string
  bio: string
  phone: string
  senderName: string
  replyToEmail: string
  emailSignature: string
  timezone: string
  notificationFrequency: NotificationFrequency
}

type OrganizationFormState = {
  name: string
  domain: string
  logo: string
}

const settingsSections = [
  {
    id: 'profile',
    icon: User,
    title: 'Profile',
    description: 'Identity and contact details',
  },
  {
    id: 'organization',
    icon: Building,
    title: 'Organization',
    description: 'Workspace branding and domain',
  },
  {
    id: 'email',
    icon: Mail,
    title: 'Email',
    description: 'Sender defaults and signature',
  },
  {
    id: 'notifications',
    icon: Bell,
    title: 'Notifications',
    description: 'Digest and alert frequency',
  },
  {
    id: 'billing',
    icon: CreditCard,
    title: 'Billing',
    description: 'Plan and usage snapshot',
  },
]

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url)
  const body = await response.json()

  if (!response.ok) {
    throw new Error(body.error || 'Request failed')
  }

  return body.data as T
}

async function sendJson<T>(url: string, method: 'PUT' | 'PATCH', payload: unknown): Promise<T> {
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const body = await response.json()

  if (!response.ok) {
    throw new Error(body.error || 'Request failed')
  }

  return body.data as T
}

function getInitials(name: string | null | undefined) {
  const value = name?.trim()

  if (!value) {
    return 'ME'
  }

  return value
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function formatPlanName(plan: OrganizationSettings['plan']) {
  switch (plan) {
    case 'FREE':
      return 'Free'
    case 'STARTER':
      return 'Starter'
    case 'GROWTH':
      return 'Growth'
    case 'ENTERPRISE':
      return 'Enterprise'
    default:
      return plan
  }
}

function getInputValue(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
  return event.target.value
}

export default function SettingsPage() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { update: updateSession } = useSession()
  const [activeSection, setActiveSection] = useState('profile')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarLoading, setAvatarLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [profileForm, setProfileForm] = useState<ProfileFormState>({
    name: '',
    email: '',
    bio: '',
    phone: '',
    senderName: '',
    replyToEmail: '',
    emailSignature: '',
    timezone: 'UTC',
    notificationFrequency: 'IMPORTANT',
  })
  const [organizationForm, setOrganizationForm] = useState<OrganizationFormState>({
    name: '',
    domain: '',
    logo: '',
  })

  const profileQuery = useQuery({
    queryKey: ['settings-profile'],
    queryFn: () => fetchJson<ProfileSettings>('/api/settings/profile'),
  })

  const organizationQuery = useQuery({
    queryKey: ['settings-organization'],
    queryFn: () => fetchJson<OrganizationSettings>('/api/settings/organization'),
  })

  useEffect(() => {
    if (!profileQuery.data) {
      return
    }

    setAvatarPreview(profileQuery.data.avatar || null)
    setProfileForm({
      name: profileQuery.data.name || '',
      email: profileQuery.data.email || '',
      bio: profileQuery.data.bio || '',
      phone: profileQuery.data.phone || '',
      senderName: profileQuery.data.senderName || '',
      replyToEmail: profileQuery.data.replyToEmail || '',
      emailSignature: profileQuery.data.emailSignature || '',
      timezone: profileQuery.data.timezone || 'UTC',
      notificationFrequency: profileQuery.data.notificationFrequency,
    })
  }, [profileQuery.data])

  useEffect(() => {
    if (!organizationQuery.data) {
      return
    }

    setOrganizationForm({
      name: organizationQuery.data.name,
      domain: organizationQuery.data.domain || '',
      logo: organizationQuery.data.logo || '',
    })
  }, [organizationQuery.data])

  const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'Image too large', description: 'Please choose an image under 2 MB.', variant: 'destructive' })
      return
    }

    const reader = new FileReader()
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string
      setAvatarPreview(dataUrl)
      setAvatarLoading(true)
      try {
        const res = await fetch('/api/settings/avatar', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ avatar: dataUrl }),
        })
        const body = await res.json()
        if (!res.ok) throw new Error(body.error || 'Upload failed')
        queryClient.invalidateQueries({ queryKey: ['settings-profile'] })
        toast({ title: 'Avatar updated', description: 'Your profile picture was saved.' })
      } catch (err: any) {
        toast({ title: 'Upload failed', description: err.message, variant: 'destructive' })
        setAvatarPreview(profile?.avatar || null)
      } finally {
        setAvatarLoading(false)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveAvatar = async () => {
    setAvatarLoading(true)
    try {
      await fetch('/api/settings/avatar', { method: 'DELETE' })
      setAvatarPreview(null)
      queryClient.invalidateQueries({ queryKey: ['settings-profile'] })
      toast({ title: 'Avatar removed' })
    } catch {
      toast({ title: 'Failed to remove avatar', variant: 'destructive' })
    } finally {
      setAvatarLoading(false)
    }
  }

  const profileMutation = useMutation({
    mutationFn: (payload: ProfileFormState) =>
      sendJson<ProfileSettings>('/api/settings/profile', 'PUT', payload),
    onSuccess: async (data) => {
      queryClient.setQueryData(['settings-profile'], data)
      await updateSession({ name: data.name, email: data.email })
      toast({
        title: 'Settings updated',
        description: 'Your profile preferences were saved.',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Unable to save changes',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const organizationMutation = useMutation({
    mutationFn: (payload: OrganizationFormState) =>
      sendJson<OrganizationSettings>('/api/settings/organization', 'PATCH', payload),
    onSuccess: async (data) => {
      queryClient.setQueryData(['settings-organization'], data)
      await updateSession({ organizationName: data.name })
      toast({
        title: 'Organization updated',
        description: 'Workspace settings were saved successfully.',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Unable to save organization settings',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const isLoading = profileQuery.isLoading || organizationQuery.isLoading
  const hasError = profileQuery.isError || organizationQuery.isError
  const profile = profileQuery.data
  const organization = organizationQuery.data
  const canManageOrganization = profile?.role === 'OWNER' || profile?.role === 'ADMIN'

  return (
    <>
      <Header
        title="Settings"
        description="Manage your account, workspace defaults, and usage visibility"
      />

      <div className="space-y-6 p-6">
        <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-gray-600" />
                Settings Areas
              </CardTitle>
              <CardDescription>
                One place for user-level preferences and workspace defaults.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {settingsSections.map((section) => {
                const isActive = activeSection === section.id

                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => setActiveSection(section.id)}
                    className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors ${
                      isActive
                        ? 'border-blue-200 bg-blue-50'
                        : 'border-transparent hover:border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div
                      className={`rounded-lg p-2 ${
                        isActive ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      <section.icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900">{section.title}</p>
                      <p className="text-sm text-muted-foreground">{section.description}</p>
                    </div>
                    <ChevronRight className="mt-1 h-4 w-4 text-gray-400" />
                  </button>
                )
              })}
            </CardContent>
          </Card>

          <div className="space-y-6">
            {isLoading ? (
              <Card>
                <CardContent className="flex items-center gap-3 p-6 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Loading settings...
                </CardContent>
              </Card>
            ) : hasError ? (
              <Card>
                <CardContent className="p-6">
                  <p className="font-medium text-gray-900">Unable to load settings.</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Refresh the page or check that your session is still active.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {activeSection === 'profile' && profile && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Profile Information</CardTitle>
                      <CardDescription>
                        Update your identity and personal contact details.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Avatar upload */}
                      <div className="flex items-center gap-6">
                        <div className="relative">
                          {avatarPreview ? (
                            <img
                              src={avatarPreview}
                              alt="Profile"
                              className="h-20 w-20 rounded-full object-cover ring-2 ring-gray-200"
                            />
                          ) : (
                            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-700">
                              {getInitials(profileForm.name)}
                            </div>
                          )}
                          {avatarLoading && (
                            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
                              <Loader2 className="h-5 w-5 animate-spin text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          <p className="text-sm font-medium text-gray-900">{profile.role} access</p>
                          <div className="flex gap-2">
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/jpeg,image/png,image/webp,image/gif"
                              className="hidden"
                              onChange={handleAvatarChange}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={avatarLoading}
                              onClick={() => fileInputRef.current?.click()}
                            >
                              <Camera className="mr-2 h-4 w-4" />
                              {avatarPreview ? 'Change photo' : 'Upload photo'}
                            </Button>
                            {avatarPreview && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={avatarLoading}
                                onClick={handleRemoveAvatar}
                              >
                                <Trash2 className="mr-2 h-4 w-4 text-red-500" />
                                Remove
                              </Button>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">JPEG, PNG, WebP or GIF · Max 2 MB</p>
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-sm font-medium">Full Name</label>
                          <Input
                            value={profileForm.name}
                            onChange={(event: ChangeEvent<HTMLInputElement>) =>
                              setProfileForm((current) => ({
                                ...current,
                                name: getInputValue(event),
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Email</label>
                          <Input
                            type="email"
                            value={profileForm.email}
                            onChange={(event: ChangeEvent<HTMLInputElement>) =>
                              setProfileForm((current) => ({
                                ...current,
                                email: getInputValue(event),
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Phone</label>
                          <Input
                            type="tel"
                            placeholder="+1 (555) 000-0000"
                            value={profileForm.phone}
                            onChange={(event: ChangeEvent<HTMLInputElement>) =>
                              setProfileForm((current) => ({
                                ...current,
                                phone: getInputValue(event),
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-sm font-medium">Bio</label>
                          <textarea
                            className="min-h-[90px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            placeholder="Tell your team a bit about yourself…"
                            maxLength={500}
                            value={profileForm.bio}
                            onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                              setProfileForm((current) => ({
                                ...current,
                                bio: getInputValue(event),
                              }))
                            }
                          />
                          <p className="text-xs text-muted-foreground text-right">{profileForm.bio.length}/500</p>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Timezone</label>
                          <Input
                            placeholder="UTC"
                            value={profileForm.timezone}
                            onChange={(event: ChangeEvent<HTMLInputElement>) =>
                              setProfileForm((current) => ({
                                ...current,
                                timezone: getInputValue(event),
                              }))
                            }
                          />
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Button
                          onClick={() => profileMutation.mutate(profileForm)}
                          disabled={profileMutation.isPending}
                        >
                          {profileMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Save Profile
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {activeSection === 'organization' && organization && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Organization Settings</CardTitle>
                      <CardDescription>
                        Manage workspace branding, domain details, and shared account identity.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {!canManageOrganization && (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                          Only workspace owners and admins can edit organization settings.
                        </div>
                      )}

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-sm font-medium">Organization Name</label>
                          <Input
                            value={organizationForm.name}
                            disabled={!canManageOrganization}
                            onChange={(event: ChangeEvent<HTMLInputElement>) =>
                              setOrganizationForm((current) => ({
                                ...current,
                                name: getInputValue(event),
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Primary Domain</label>
                          <Input
                            placeholder="example.com"
                            value={organizationForm.domain}
                            disabled={!canManageOrganization}
                            onChange={(event: ChangeEvent<HTMLInputElement>) =>
                              setOrganizationForm((current) => ({
                                ...current,
                                domain: getInputValue(event),
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Logo URL</label>
                          <Input
                            placeholder="https://..."
                            value={organizationForm.logo}
                            disabled={!canManageOrganization}
                            onChange={(event: ChangeEvent<HTMLInputElement>) =>
                              setOrganizationForm((current) => ({
                                ...current,
                                logo: getInputValue(event),
                              }))
                            }
                          />
                        </div>
                      </div>

                      <div className="rounded-lg border bg-gray-50 p-4 text-sm text-muted-foreground">
                        Workspace slug: <span className="font-medium text-gray-900">{organization.slug}</span>
                      </div>

                      <div className="flex justify-end">
                        <Button
                          onClick={() => organizationMutation.mutate(organizationForm)}
                          disabled={!canManageOrganization || organizationMutation.isPending}
                        >
                          {organizationMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Save Organization
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {activeSection === 'email' && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Email Preferences</CardTitle>
                      <CardDescription>
                        Set the sender identity used across outreach and follow-up workflows.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Sender Name</label>
                          <Input
                            placeholder="Meraki Sales"
                            value={profileForm.senderName}
                            onChange={(event: ChangeEvent<HTMLInputElement>) =>
                              setProfileForm((current) => ({
                                ...current,
                                senderName: getInputValue(event),
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Reply-to Email</label>
                          <Input
                            type="email"
                            placeholder="team@yourcompany.com"
                            value={profileForm.replyToEmail}
                            onChange={(event: ChangeEvent<HTMLInputElement>) =>
                              setProfileForm((current) => ({
                                ...current,
                                replyToEmail: getInputValue(event),
                              }))
                            }
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Email Signature</label>
                        <textarea
                          className="min-h-[140px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          placeholder="Best regards,..."
                          value={profileForm.emailSignature}
                          onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                            setProfileForm((current) => ({
                              ...current,
                              emailSignature: getInputValue(event),
                            }))
                          }
                        />
                      </div>

                      <div className="rounded-lg border bg-gray-50 p-4 text-sm text-muted-foreground">
                        Provider connections stay in{' '}
                        <Link href="/dashboard/integrations" className="font-medium text-blue-600 hover:text-blue-700">
                          Integrations
                        </Link>
                        . This section only controls your default sender identity.
                      </div>

                      <div className="flex justify-end">
                        <Button
                          onClick={() => profileMutation.mutate(profileForm)}
                          disabled={profileMutation.isPending}
                        >
                          {profileMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Save Email Settings
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {activeSection === 'notifications' && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Notification Preferences</CardTitle>
                      <CardDescription>
                        Control how often Meraki sends operational updates and alerts.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Email Notification Frequency</label>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={profileForm.notificationFrequency}
                          onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                            setProfileForm((current) => ({
                              ...current,
                              notificationFrequency: getInputValue(event) as NotificationFrequency,
                            }))
                          }
                        >
                          <option value="ALL">All activity</option>
                          <option value="IMPORTANT">Important only</option>
                          <option value="DAILY">Daily digest</option>
                          <option value="NONE">Do not send email updates</option>
                        </select>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-lg border p-4">
                          <div className="flex items-center gap-3">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                            <div>
                              <p className="font-medium text-gray-900">Included in MVP</p>
                              <p className="text-sm text-muted-foreground">
                                One clear preference that can be persisted today.
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="rounded-lg border p-4">
                          <div className="flex items-center gap-3">
                            <Shield className="h-5 w-5 text-gray-500" />
                            <div>
                              <p className="font-medium text-gray-900">Deferred</p>
                              <p className="text-sm text-muted-foreground">
                                Channel-specific alerts and team routing rules can come later.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Button
                          onClick={() => profileMutation.mutate(profileForm)}
                          disabled={profileMutation.isPending}
                        >
                          {profileMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Save Notifications
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {activeSection === 'billing' && organization && (
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Current Plan</CardTitle>
                        <CardDescription>
                          Billing is read-only for now. This view reflects the data currently stored in your workspace.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-col gap-4 rounded-lg border p-4 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="text-lg font-semibold">{formatPlanName(organization.plan)} Plan</p>
                            <p className="text-sm text-muted-foreground">
                              Workspace billing management is not connected yet.
                            </p>
                          </div>
                          <Link href="/dashboard/integrations">
                            <Button variant="outline">Review Integrations</Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="grid gap-4 md:grid-cols-3">
                      <Card>
                        <CardContent className="p-5">
                          <p className="text-sm text-muted-foreground">Team Members</p>
                          <p className="mt-2 text-3xl font-bold">{organization.usage.teamMembers}</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-5">
                          <p className="text-sm text-muted-foreground">Leads</p>
                          <p className="mt-2 text-3xl font-bold">{organization.usage.leads.toLocaleString()}</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-5">
                          <p className="text-sm text-muted-foreground">AI Credits</p>
                          <p className="mt-2 text-3xl font-bold">{organization.usage.aiCredits.toLocaleString()}</p>
                        </CardContent>
                      </Card>
                    </div>

                    <Card>
                      <CardHeader>
                        <CardTitle>What Comes Next</CardTitle>
                        <CardDescription>
                          The billing page is intentionally narrow until payment workflows exist.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm text-muted-foreground">
                        <p>When Stripe or another billing provider is added, this section can expand to invoices, payment methods, and seat limits.</p>
                        <p>Security tooling such as API keys and token rotation should stay separate from billing and land with a dedicated security settings phase.</p>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
