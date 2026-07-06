'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Mail,
  MessageSquare,
  Calendar,
  BarChart3,
  Settings,
  Zap,
  Target,
  Sparkles,
  Link2,
  FileText,
  LogOut,
  Bot,
} from 'lucide-react'

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Leads',
    href: '/dashboard/leads',
    icon: Users,
  },
  {
    name: 'Lead Forms',
    href: '/dashboard/forms',
    icon: FileText,
  },
  {
    name: 'Sequences',
    href: '/dashboard/sequences',
    icon: Zap,
  },
  {
    name: 'Campaigns',
    href: '/dashboard/campaigns',
    icon: Target,
  },
  {
    name: 'Email Templates',
    href: '/dashboard/templates',
    icon: Mail,
  },
  {
    name: 'LinkedIn',
    href: '/dashboard/linkedin',
    icon: MessageSquare,
  },
  {
    name: 'Meetings',
    href: '/dashboard/meetings',
    icon: Calendar,
  },
  {
    name: 'AI Assistant',
    href: '/dashboard/ai',
    icon: Sparkles,
  },
  {
    name: 'AI Autopilot',
    href: '/dashboard/autopilot',
    icon: Bot,
  },
  {
    name: 'Growth Planner',
    href: '/dashboard/onboarding',
    icon: Target,
  },
  {
    name: 'Analytics',
    href: '/dashboard/analytics',
    icon: BarChart3,
  },
  {
    name: 'Integrations',
    href: '/dashboard/integrations',
    icon: Link2,
  },
  {
    name: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()

  const userName = session?.user?.name || 'User'
  const orgName = (session?.user as any)?.organizationName || 'Organization'
  const initials = userName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="flex h-full w-64 flex-col bg-gray-900">
      {/* Logo */}
      <div className="flex h-16 items-center px-6">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white">Meraki</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-800 p-4">
        <div className="flex items-center space-x-3">
          <Link
            href="/dashboard/settings"
            className="flex flex-1 min-w-0 items-center space-x-3 rounded-lg hover:bg-gray-800 transition-colors p-1 -m-1"
            title="View profile"
          >
            {(session?.user as any)?.image || (session?.user as any)?.avatar ? (
              <img
                src={(session?.user as any)?.image || (session?.user as any)?.avatar}
                alt={userName}
                className="h-9 w-9 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-medium text-white">
                {initials}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-white">{userName}</p>
              <p className="truncate text-xs text-gray-400">{orgName}</p>
            </div>
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: '/auth/login' })}
            className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
