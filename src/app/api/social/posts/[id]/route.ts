import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { handleAuthError } from '@/lib/auth-helpers'
import { canCompose, forbidden, getSocialContext, isOwner } from '@/lib/social/auth'
import { postInclude, postInputSchema } from '@/lib/social/schemas'
import { logSocialEvent } from '@/lib/social/service'

export const dynamic = 'force-dynamic'

const LOCKED_STATUSES = ['PUBLISHING', 'PUBLISHED', 'PARTIALLY_PUBLISHED']

// GET /api/social/posts/:id - Post with audit trail
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const ctx = await getSocialContext()
    const post = await prisma.socialPost.findFirst({
      where: { id: params.id, organizationId: ctx.organizationId },
      include: {
        ...postInclude,
        events: {
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { name: true, email: true } } },
        },
      },
    })
    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    return NextResponse.json({ data: post })
  } catch (error) {
    try { return handleAuthError(error) } catch {}
    console.error('Error fetching social post:', error)
    return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 })
  }
}

// PUT /api/social/posts/:id - Edit. Any edit to an in-review or approved post voids the approval.
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const ctx = await getSocialContext()
    if (!canCompose(ctx)) return forbidden('Viewers cannot edit posts')

    const existing = await prisma.socialPost.findFirst({
      where: { id: params.id, organizationId: ctx.organizationId },
    })
    if (!existing) return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    if (existing.createdById !== ctx.userId && !isOwner(ctx) && ctx.role !== 'ADMIN') {
      return forbidden('You can only edit your own posts')
    }
    if (LOCKED_STATUSES.includes(existing.status)) {
      return NextResponse.json(
        { error: 'This post is being published or already published and cannot be edited' },
        { status: 409 },
      )
    }

    const data = postInputSchema.parse(await request.json())

    const accountIds = Array.from(new Set(data.targets.map((t) => t.accountId)))
    const accounts = await prisma.socialAccount.findMany({
      where: { id: { in: accountIds }, organizationId: ctx.organizationId },
      select: { id: true },
    })
    if (accounts.length !== accountIds.length) {
      return NextResponse.json({ error: 'One or more accounts were not found' }, { status: 400 })
    }

    const keepsStatus = ['DRAFT', 'CHANGES_REQUESTED', 'REJECTED'].includes(existing.status)

    const post = await prisma.$transaction(async (tx) => {
      await tx.socialPostTarget.deleteMany({ where: { postId: existing.id } })
      return tx.socialPost.update({
        where: { id: existing.id },
        data: {
          title: data.title || null,
          content: data.content,
          linkUrl: data.linkUrl || null,
          mediaUrls: data.mediaUrls,
          hashtags: data.hashtags,
          scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
          aiGenerated: data.aiGenerated ?? existing.aiGenerated,
          ...(keepsStatus
            ? {}
            : { status: 'DRAFT', approvedAt: null, approvedById: null, submittedAt: null }),
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
    })
    await logSocialEvent(
      post.id,
      ctx.userId,
      'EDITED',
      keepsStatus ? null : `Approval voided (was ${existing.status})`,
    )

    return NextResponse.json({ data: post })
  } catch (error) {
    try { return handleAuthError(error) } catch {}
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || 'Validation error' }, { status: 400 })
    }
    console.error('Error updating social post:', error)
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 })
  }
}

// DELETE /api/social/posts/:id
export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const ctx = await getSocialContext()
    if (!canCompose(ctx)) return forbidden()

    const existing = await prisma.socialPost.findFirst({
      where: { id: params.id, organizationId: ctx.organizationId },
    })
    if (!existing) return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    if (existing.createdById !== ctx.userId && !isOwner(ctx) && ctx.role !== 'ADMIN') {
      return forbidden('You can only delete your own posts')
    }
    if (existing.status === 'PUBLISHING') {
      return NextResponse.json({ error: 'Post is currently publishing' }, { status: 409 })
    }

    await prisma.socialPost.delete({ where: { id: existing.id } })
    return NextResponse.json({ message: 'Post deleted' })
  } catch (error) {
    try { return handleAuthError(error) } catch {}
    console.error('Error deleting social post:', error)
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 })
  }
}
