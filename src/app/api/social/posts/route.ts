import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { handleAuthError } from '@/lib/auth-helpers'
import { canCompose, forbidden, getSocialContext } from '@/lib/social/auth'
import { postInclude, postInputSchema } from '@/lib/social/schemas'
import { logSocialEvent } from '@/lib/social/service'

export const dynamic = 'force-dynamic'

const STATUSES = [
  'DRAFT', 'PENDING_APPROVAL', 'CHANGES_REQUESTED', 'REJECTED', 'SCHEDULED',
  'PUBLISHING', 'PUBLISHED', 'PARTIALLY_PUBLISHED', 'FAILED',
] as const

// GET /api/social/posts?status=&from=&to= - List posts (optionally for a calendar range)
export async function GET(request: Request) {
  try {
    const ctx = await getSocialContext()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const where: any = { organizationId: ctx.organizationId }
    if (status && (STATUSES as readonly string[]).includes(status.toUpperCase())) {
      where.status = status.toUpperCase()
    }
    if (from || to) {
      where.scheduledAt = {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(to) } : {}),
      }
    }

    const posts = await prisma.socialPost.findMany({
      where,
      include: postInclude,
      orderBy: { createdAt: 'desc' },
      take: 200,
    })
    return NextResponse.json({ data: posts })
  } catch (error) {
    try { return handleAuthError(error) } catch {}
    console.error('Error fetching social posts:', error)
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
  }
}

// POST /api/social/posts - Create a draft
export async function POST(request: Request) {
  try {
    const ctx = await getSocialContext()
    if (!canCompose(ctx)) return forbidden('Viewers cannot create posts')

    const data = postInputSchema.parse(await request.json())

    const accountIds = Array.from(new Set(data.targets.map((t) => t.accountId)))
    const accounts = await prisma.socialAccount.findMany({
      where: { id: { in: accountIds }, organizationId: ctx.organizationId },
      select: { id: true },
    })
    if (accounts.length !== accountIds.length) {
      return NextResponse.json({ error: 'One or more accounts were not found' }, { status: 400 })
    }

    const post = await prisma.socialPost.create({
      data: {
        title: data.title || null,
        content: data.content,
        linkUrl: data.linkUrl || null,
        mediaUrls: data.mediaUrls,
        hashtags: data.hashtags,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
        aiGenerated: data.aiGenerated ?? false,
        status: 'DRAFT',
        organizationId: ctx.organizationId,
        createdById: ctx.userId,
        targets: {
          create: accountIds.map((accountId) => ({
            accountId,
            contentOverride:
              data.targets.find((t) => t.accountId === accountId)?.contentOverride || null,
          })),
        },
      },
      include: postInclude,
    })
    await logSocialEvent(post.id, ctx.userId, 'CREATED')

    return NextResponse.json({ data: post }, { status: 201 })
  } catch (error) {
    try { return handleAuthError(error) } catch {}
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || 'Validation error' }, { status: 400 })
    }
    console.error('Error creating social post:', error)
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
  }
}
