import { NextResponse } from 'next/server'
import { getRequiredSession } from '@/lib/auth-helpers'

export interface SocialContext {
  userId: string
  organizationId: string
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER'
}

export async function getSocialContext(): Promise<SocialContext> {
  const session = await getRequiredSession()
  const user = session.user as any
  return {
    userId: user.id,
    organizationId: user.organizationId,
    role: user.role,
  }
}

export const isOwner = (ctx: SocialContext) => ctx.role === 'OWNER'
export const canManageAccounts = (ctx: SocialContext) => ctx.role === 'OWNER' || ctx.role === 'ADMIN'
export const canCompose = (ctx: SocialContext) => ctx.role !== 'VIEWER'

export function forbidden(message = 'Forbidden') {
  return NextResponse.json({ error: message }, { status: 403 })
}
