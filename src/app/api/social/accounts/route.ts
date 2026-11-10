import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { handleAuthError } from '@/lib/auth-helpers'
import { encryptSecret } from '@/lib/email-config'
import { PLATFORM_SPECS, SOCIAL_PLATFORMS } from '@/lib/social/platforms'
import { canManageAccounts, forbidden, getSocialContext } from '@/lib/social/auth'

export const dynamic = 'force-dynamic'

const connectSchema = z.object({
  platform: z.enum(SOCIAL_PLATFORMS),
  displayName: z.string().trim().min(1).max(100),
  externalId: z.string().trim().min(1).max(500),
  accessToken: z.string().trim().min(1).max(4000),
  refreshToken: z.string().trim().max(4000).optional(),
  metadata: z.record(z.string(), z.string().max(500)).optional(),
})

const publicSelect = {
  id: true,
  platform: true,
  displayName: true,
  externalId: true,
  status: true,
  lastError: true,
  expiresAt: true,
  metadata: true,
  createdAt: true,
} as const

// GET /api/social/accounts - Connected accounts (tokens are never returned)
export async function GET() {
  try {
    const ctx = await getSocialContext()
    const accounts = await prisma.socialAccount.findMany({
      where: { organizationId: ctx.organizationId },
      select: publicSelect,
      orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json({ data: accounts })
  } catch (error) {
    try { return handleAuthError(error) } catch {}
    console.error('Error fetching social accounts:', error)
    return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 })
  }
}

// POST /api/social/accounts - Connect (or update) an account with an API token
export async function POST(request: Request) {
  try {
    const ctx = await getSocialContext()
    if (!canManageAccounts(ctx)) return forbidden('Only owners and admins can connect accounts')

    const data = connectSchema.parse(await request.json())
    const spec = PLATFORM_SPECS[data.platform]

    for (const field of spec.extraFields ?? []) {
      if (field.required && !data.metadata?.[field.key]?.trim()) {
        return NextResponse.json({ error: `${field.label} is required` }, { status: 400 })
      }
    }
    if (data.platform === 'WORDPRESS' && !/^https:\/\//i.test(data.externalId)) {
      return NextResponse.json({ error: 'Site URL must start with https://' }, { status: 400 })
    }

    const allowedMeta = new Set([...(spec.extraFields ?? []).map((f) => f.key), 'privacyLevel'])
    const metadata = Object.fromEntries(
      Object.entries(data.metadata ?? {}).filter(([k]) => allowedMeta.has(k)),
    )

    const fields = {
      displayName: data.displayName,
      accessTokenEnc: encryptSecret(data.accessToken),
      refreshTokenEnc: data.refreshToken ? encryptSecret(data.refreshToken) : null,
      status: 'CONNECTED' as const,
      lastError: null,
      metadata,
    }

    const account = await prisma.socialAccount.upsert({
      where: {
        organizationId_platform_externalId: {
          organizationId: ctx.organizationId,
          platform: data.platform,
          externalId: data.externalId,
        },
      },
      create: {
        ...fields,
        platform: data.platform,
        externalId: data.externalId,
        organizationId: ctx.organizationId,
      },
      update: fields,
      select: publicSelect,
    })

    return NextResponse.json({ data: account }, { status: 201 })
  } catch (error) {
    try { return handleAuthError(error) } catch {}
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || 'Validation error' }, { status: 400 })
    }
    console.error('Error connecting social account:', error)
    return NextResponse.json({ error: 'Failed to connect account' }, { status: 500 })
  }
}

// DELETE /api/social/accounts?id= - Disconnect an account
export async function DELETE(request: Request) {
  try {
    const ctx = await getSocialContext()
    if (!canManageAccounts(ctx)) return forbidden('Only owners and admins can disconnect accounts')

    const id = new URL(request.url).searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const result = await prisma.socialAccount.deleteMany({
      where: { id, organizationId: ctx.organizationId },
    })
    if (result.count === 0) return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    return NextResponse.json({ message: 'Account disconnected' })
  } catch (error) {
    try { return handleAuthError(error) } catch {}
    console.error('Error disconnecting social account:', error)
    return NextResponse.json({ error: 'Failed to disconnect account' }, { status: 500 })
  }
}
