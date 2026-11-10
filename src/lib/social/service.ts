import { prisma } from '@/lib/prisma'
import { decryptSecret, getOrgMailer } from '@/lib/email-config'
import { publishToPlatform, PublishError } from '@/lib/social/publishers'
import {
  composePostText,
  isSocialPlatform,
  validateForPlatform,
} from '@/lib/social/platforms'

export const MAX_PUBLISH_ATTEMPTS = 3
const LOCK_TIMEOUT_MS = 10 * 60 * 1000
const RETRY_BACKOFF_MS = [5 * 60 * 1000, 30 * 60 * 1000]

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export async function logSocialEvent(
  postId: string,
  userId: string | null,
  action: string,
  note?: string | null,
) {
  await prisma.socialPostEvent.create({
    data: { postId, userId, action, note: note || null },
  })
}

// Best-effort email; never blocks or fails the workflow.
export async function notifySocial(
  organizationId: string,
  recipients: { email: string }[],
  subject: string,
  message: string,
) {
  try {
    if (recipients.length === 0) return
    const mailer = await getOrgMailer(organizationId)
    if (!mailer) return
    const html =
      `<p>${message.replace(/\n/g, '<br>')}</p>` +
      `<p><a href="${appUrl}/dashboard/social">Open Social Publishing</a></p>`
    await Promise.all(
      recipients.map((r) =>
        mailer.client.emails.send({ from: mailer.from, to: r.email, subject, html }),
      ),
    )
  } catch (err) {
    console.error('Social notification failed:', err)
  }
}

// Validates every target against its platform rules. Returns human-readable issues.
export async function validatePostTargets(postId: string): Promise<string[]> {
  const post = await prisma.socialPost.findUnique({
    where: { id: postId },
    include: { targets: { include: { account: true } } },
  })
  if (!post) return ['Post not found']
  if (post.targets.length === 0) return ['Select at least one account to publish to']

  const issues: string[] = []
  for (const target of post.targets) {
    const platform = target.account.platform
    if (!isSocialPlatform(platform)) continue
    const text = composePostText(post, target.contentOverride, platform)
    for (const issue of validateForPlatform(platform, text, post.mediaUrls)) {
      issues.push(`${target.account.displayName}: ${issue}`)
    }
  }
  return issues
}

async function publishPost(postId: string) {
  const now = new Date()
  const post = await prisma.socialPost.findUnique({
    where: { id: postId },
    include: { targets: { include: { account: true } } },
  })
  if (!post) return

  for (const target of post.targets) {
    if (target.status !== 'PENDING' || target.externalPostId) continue
    if (target.nextAttemptAt && target.nextAttemptAt > now) continue

    const { account } = target
    const attempt = target.attempts + 1
    try {
      if (account.status !== 'CONNECTED') {
        throw new PublishError(`Account is ${account.status.toLowerCase()}; reconnect it`)
      }
      if (!isSocialPlatform(account.platform)) {
        throw new PublishError(`Unsupported platform ${account.platform}`)
      }
      const text = composePostText(post, target.contentOverride, account.platform)
      const issues = validateForPlatform(account.platform, text, post.mediaUrls)
      if (issues.length > 0) throw new PublishError(issues.join('; '))

      const result = await publishToPlatform({
        platform: account.platform,
        accessToken: decryptSecret(account.accessTokenEnc),
        externalId: account.externalId,
        metadata: (account.metadata as Record<string, any>) || {},
        text,
        title: post.title,
        mediaUrls: post.mediaUrls,
        linkUrl: post.linkUrl,
      })

      await prisma.socialPostTarget.update({
        where: { id: target.id },
        data: {
          status: 'PUBLISHED',
          attempts: attempt,
          externalPostId: result.externalPostId,
          externalUrl: result.externalUrl ?? null,
          publishedAt: new Date(),
          lastError: null,
          nextAttemptAt: null,
        },
      })
      await logSocialEvent(post.id, null, 'PUBLISHED', `${account.displayName} (${account.platform})`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      const retryable = err instanceof PublishError ? err.retryable : false
      const exhausted = attempt >= MAX_PUBLISH_ATTEMPTS
      const willRetry = retryable && !exhausted

      await prisma.socialPostTarget.update({
        where: { id: target.id },
        data: {
          status: willRetry ? 'PENDING' : 'FAILED',
          attempts: attempt,
          lastError: message.slice(0, 500),
          nextAttemptAt: willRetry
            ? new Date(Date.now() + RETRY_BACKOFF_MS[Math.min(attempt - 1, RETRY_BACKOFF_MS.length - 1)])
            : null,
        },
      })
      if (err instanceof PublishError && err.authFailure) {
        await prisma.socialAccount.update({
          where: { id: account.id },
          data: { status: 'EXPIRED', lastError: message.slice(0, 500) },
        })
      }
      await logSocialEvent(
        post.id,
        null,
        willRetry ? 'RETRY_SCHEDULED' : 'FAILED',
        `${account.displayName} (${account.platform}): ${message}`,
      )
    }
  }

  const targets = await prisma.socialPostTarget.findMany({ where: { postId } })
  const pending = targets.filter((t) => t.status === 'PENDING')

  if (pending.length > 0) {
    const nextAt = pending
      .map((t) => t.nextAttemptAt)
      .filter((d): d is Date => !!d)
      .sort((a, b) => a.getTime() - b.getTime())[0]
    await prisma.socialPost.update({
      where: { id: postId },
      data: { status: 'SCHEDULED', scheduledAt: nextAt ?? new Date(), lockedAt: null },
    })
    return
  }

  const published = targets.filter((t) => t.status === 'PUBLISHED').length
  const status =
    published === targets.length ? 'PUBLISHED' : published > 0 ? 'PARTIALLY_PUBLISHED' : 'FAILED'
  const finished = await prisma.socialPost.update({
    where: { id: postId },
    data: {
      status,
      lockedAt: null,
      ...(published > 0 ? { publishedAt: new Date() } : {}),
    },
    include: { createdBy: { select: { email: true } } },
  })

  await notifySocial(
    finished.organizationId,
    [finished.createdBy],
    `Social post ${status.toLowerCase().replace('_', ' ')}`,
    `Your post "${finished.title || finished.content.slice(0, 60)}" finished with status ${status}.`,
  )
}

// Publishes approved posts that are due. Only posts with an owner approval are ever picked up.
export async function processDueSocialPosts(
  opts: { postId?: string; organizationId?: string; limit?: number } = {},
) {
  const now = new Date()
  const staleLock = new Date(now.getTime() - LOCK_TIMEOUT_MS)

  const candidates = await prisma.socialPost.findMany({
    where: {
      ...(opts.postId ? { id: opts.postId } : {}),
      ...(opts.organizationId ? { organizationId: opts.organizationId } : {}),
      approvedAt: { not: null },
      approvedById: { not: null },
      OR: [
        { status: 'SCHEDULED', scheduledAt: { lte: now } },
        { status: 'PUBLISHING', lockedAt: { lt: staleLock } },
      ],
    },
    select: { id: true },
    orderBy: { scheduledAt: 'asc' },
    take: opts.limit ?? 20,
  })

  let processed = 0
  for (const { id } of candidates) {
    // Atomic claim so concurrent cron runs never publish the same post twice
    const claimed = await prisma.socialPost.updateMany({
      where: {
        id,
        OR: [
          { status: 'SCHEDULED', scheduledAt: { lte: now } },
          { status: 'PUBLISHING', lockedAt: { lt: staleLock } },
        ],
      },
      data: { status: 'PUBLISHING', lockedAt: now },
    })
    if (claimed.count === 0) continue

    try {
      await publishPost(id)
    } catch (err) {
      console.error(`Social publish failed for post ${id}:`, err)
      await prisma.socialPost.update({
        where: { id },
        data: { status: 'SCHEDULED', lockedAt: null, scheduledAt: new Date(Date.now() + 5 * 60 * 1000) },
      })
    }
    processed++
  }
  return { processed }
}
