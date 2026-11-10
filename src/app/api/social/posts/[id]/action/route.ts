import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { handleAuthError } from '@/lib/auth-helpers'
import { canCompose, forbidden, getSocialContext, isOwner } from '@/lib/social/auth'
import { postInclude } from '@/lib/social/schemas'
import {
  logSocialEvent,
  notifySocial,
  processDueSocialPosts,
  validatePostTargets,
} from '@/lib/social/service'

export const dynamic = 'force-dynamic'

const actionSchema = z.object({
  action: z.enum(['submit', 'approve', 'reject', 'request_changes', 'unschedule', 'retry']),
  note: z.string().trim().max(2000).optional(),
  expectedUpdatedAt: z.string().datetime({ offset: true }).optional(),
})

const conflict = (message: string) => NextResponse.json({ error: message }, { status: 409 })
const bad = (message: string, details?: string[]) =>
  NextResponse.json({ error: message, details }, { status: 400 })

// POST /api/social/posts/:id/action - Approval workflow transitions
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const ctx = await getSocialContext()
    if (!canCompose(ctx)) return forbidden('Viewers cannot change posts')

    const { action, note, expectedUpdatedAt } = actionSchema.parse(await request.json())

    const post = await prisma.socialPost.findFirst({
      where: { id: params.id, organizationId: ctx.organizationId },
    })
    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })

    const owner = isOwner(ctx)
    const isAuthor = post.createdById === ctx.userId
    const title = post.title || post.content.slice(0, 60)

    const respond = async () => {
      const data = await prisma.socialPost.findUnique({
        where: { id: post.id },
        include: postInclude,
      })
      return NextResponse.json({ data })
    }

    switch (action) {
      case 'submit': {
        if (!isAuthor && !owner && ctx.role !== 'ADMIN') return forbidden('Only the author can submit')
        if (!['DRAFT', 'CHANGES_REQUESTED', 'REJECTED'].includes(post.status)) {
          return conflict(`Cannot submit a post in status ${post.status}`)
        }
        const issues = await validatePostTargets(post.id)
        if (issues.length) return bad('Post is not ready to submit', issues)

        await prisma.socialPost.update({
          where: { id: post.id },
          data: {
            status: 'PENDING_APPROVAL',
            submittedAt: new Date(),
            approvedAt: null,
            approvedById: null,
            reviewNote: null,
          },
        })
        await logSocialEvent(post.id, ctx.userId, 'SUBMITTED', note)

        const owners = await prisma.user.findMany({
          where: { organizationId: ctx.organizationId, role: 'OWNER' },
          select: { email: true },
        })
        await notifySocial(
          ctx.organizationId,
          owners,
          'Social post awaiting your approval',
          `A post is waiting for approval: "${title}".`,
        )
        return respond()
      }

      case 'approve': {
        if (!owner) return forbidden('Only the owner can approve posts')
        if (post.status !== 'PENDING_APPROVAL') {
          return conflict(`Cannot approve a post in status ${post.status}`)
        }
        const issues = await validatePostTargets(post.id)
        if (issues.length) return bad('Post cannot be approved', issues)

        const now = new Date()
        const scheduledAt = post.scheduledAt && post.scheduledAt > now ? post.scheduledAt : now

        // Optimistic concurrency: refuse if the post changed since the owner loaded it
        const result = await prisma.socialPost.updateMany({
          where: {
            id: post.id,
            status: 'PENDING_APPROVAL',
            ...(expectedUpdatedAt ? { updatedAt: new Date(expectedUpdatedAt) } : {}),
          },
          data: {
            status: 'SCHEDULED',
            scheduledAt,
            approvedAt: now,
            approvedById: ctx.userId,
            reviewNote: note || null,
          },
        })
        if (result.count === 0) {
          return conflict('This post was modified. Reload and review the latest version.')
        }
        await logSocialEvent(post.id, ctx.userId, 'APPROVED', note)

        if (scheduledAt <= new Date()) {
          await processDueSocialPosts({ postId: post.id })
        }
        return respond()
      }

      case 'reject':
      case 'request_changes': {
        if (!owner) return forbidden('Only the owner can review posts')
        if (post.status !== 'PENDING_APPROVAL') {
          return conflict(`Cannot review a post in status ${post.status}`)
        }
        if (!note) return bad('A comment is required')

        const rejected = action === 'reject'
        const result = await prisma.socialPost.updateMany({
          where: {
            id: post.id,
            status: 'PENDING_APPROVAL',
            ...(expectedUpdatedAt ? { updatedAt: new Date(expectedUpdatedAt) } : {}),
          },
          data: {
            status: rejected ? 'REJECTED' : 'CHANGES_REQUESTED',
            reviewNote: note,
            approvedAt: null,
            approvedById: null,
          },
        })
        if (result.count === 0) {
          return conflict('This post was modified. Reload and review the latest version.')
        }
        await logSocialEvent(post.id, ctx.userId, rejected ? 'REJECTED' : 'CHANGES_REQUESTED', note)

        const author = await prisma.user.findUnique({
          where: { id: post.createdById },
          select: { email: true },
        })
        await notifySocial(
          ctx.organizationId,
          author ? [author] : [],
          rejected ? 'Social post rejected' : 'Changes requested on your social post',
          `Your post "${title}" was ${rejected ? 'rejected' : 'sent back for changes'}.\n\nComment: ${note}`,
        )
        return respond()
      }

      case 'unschedule': {
        if (!isAuthor && !owner && ctx.role !== 'ADMIN') return forbidden('Only the author can unschedule')
        if (!['SCHEDULED', 'PENDING_APPROVAL'].includes(post.status)) {
          return conflict(`Cannot unschedule a post in status ${post.status}`)
        }
        const result = await prisma.socialPost.updateMany({
          where: { id: post.id, status: { in: ['SCHEDULED', 'PENDING_APPROVAL'] } },
          data: { status: 'DRAFT', approvedAt: null, approvedById: null },
        })
        if (result.count === 0) return conflict('Post is already being published')
        await logSocialEvent(post.id, ctx.userId, 'UNSCHEDULED', note)
        return respond()
      }

      case 'retry': {
        if (!owner) return forbidden('Only the owner can retry publishing')
        if (!['FAILED', 'PARTIALLY_PUBLISHED'].includes(post.status)) {
          return conflict(`Cannot retry a post in status ${post.status}`)
        }
        const issues = await validatePostTargets(post.id)
        if (issues.length) return bad('Post cannot be retried', issues)

        // Only failed targets are reset; published targets keep their externalPostId
        await prisma.socialPostTarget.updateMany({
          where: { postId: post.id, status: 'FAILED' },
          data: { status: 'PENDING', attempts: 0, nextAttemptAt: null, lastError: null },
        })
        await prisma.socialPost.update({
          where: { id: post.id },
          data: { status: 'SCHEDULED', scheduledAt: new Date() },
        })
        await logSocialEvent(post.id, ctx.userId, 'RETRIED', note)
        await processDueSocialPosts({ postId: post.id })
        return respond()
      }
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || 'Invalid input' }, { status: 400 })
    }
    try { return handleAuthError(error) } catch {}
    console.error('Error running social post action:', error)
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 })
  }
}
