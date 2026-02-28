'use client'

import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  User,
  Building,
  Bell,
  Shield,
  CreditCard,
  Users,
  Mail,
} from 'lucide-react'

const settingsSections = [
  {
    id: 'profile',
    icon: User,
    title: 'Profile Settings',
    description: 'Update your personal information',
  },
  {
    id: 'organization',
    icon: Building,
    title: 'Organization',
    description: 'Manage your organization settings',
  },
  {
    id: 'team',
    icon: Users,
    title: 'Team Members',
    description: 'Invite and manage team members',
  },
  {
    id: 'notifications',
    icon: Bell,
    title: 'Notifications',
    description: 'Configure email and push notifications',
  },
  {
    id: 'security',
    icon: Shield,
    title: 'Security',
    description: 'Password, 2FA, and API keys',
  },
  {
    id: 'billing',
    icon: CreditCard,
    title: 'Billing & Plans',
    description: 'Manage your subscription and billing',
  },
]

export default function SettingsPage() {
  return (
    <>
      <Header
        title="Settings"
        description="Manage your account and organization settings"
      />

      <div className="p-6 space-y-6">
        {/* Settings Navigation */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {settingsSections.map((section) => (
            <Card
              key={section.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
            >
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="rounded-lg bg-gray-100 p-2">
                    <section.icon className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">{section.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {section.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Profile Section */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Update your account details and preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center space-x-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-600">
                TA
              </div>
              <div>
                <Button variant="outline" size="sm">
                  Change Avatar
                </Button>
                <p className="mt-2 text-xs text-muted-foreground">
                  JPG, GIF or PNG. Max size 2MB.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">First Name</label>
                <Input defaultValue="TalentMeta" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Last Name</label>
                <Input defaultValue="Admin" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input type="email" defaultValue="admin@talentmeta.ai" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone</label>
                <Input type="tel" placeholder="+1 (555) 000-0000" />
              </div>
            </div>

            <div className="flex justify-end">
              <Button>Save Changes</Button>
            </div>
          </CardContent>
        </Card>

        {/* Email Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Email Settings</CardTitle>
            <CardDescription>
              Configure your email sending preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Sender Name</label>
                <Input defaultValue="TalentMeta Sales Team" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Reply-to Email</label>
                <Input type="email" defaultValue="sales@talentmeta.ai" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Email Signature</label>
              <textarea
                className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                defaultValue={`Best regards,
The TalentMeta Team

TalentMeta.ai - AI-Powered Recruitment
www.talentmeta.ai`}
              />
            </div>

            <div className="flex justify-end">
              <Button>Save Email Settings</Button>
            </div>
          </CardContent>
        </Card>

        {/* Plan & Usage */}
        <Card>
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>
              You are currently on the Growth plan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="text-lg font-semibold">Growth Plan</p>
                <p className="text-sm text-muted-foreground">
                  $149/month • Billed monthly
                </p>
              </div>
              <Button variant="outline">Upgrade Plan</Button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Leads</p>
                <p className="mt-1 text-2xl font-bold">2,847 / 10,000</p>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
                  <div className="h-full w-[28%] bg-blue-500 rounded-full" />
                </div>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">AI Credits</p>
                <p className="mt-1 text-2xl font-bold">847 / 2,000</p>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
                  <div className="h-full w-[42%] bg-purple-500 rounded-full" />
                </div>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Team Members</p>
                <p className="mt-1 text-2xl font-bold">4 / 10</p>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
                  <div className="h-full w-[40%] bg-green-500 rounded-full" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
