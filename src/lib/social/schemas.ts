import { z } from 'zod'

const url = z.string().trim().url().refine((u) => /^https?:\/\//i.test(u), 'Must be an http(s) URL')

export const postInputSchema = z.object({
  title: z.string().trim().max(200).optional().nullable(),
  content: z.string().trim().min(1, 'Post content is required').max(100000),
  linkUrl: url.optional().nullable().or(z.literal('').transform(() => null)),
  mediaUrls: z.array(url).max(10).default([]),
  hashtags: z.array(z.string().trim().min(1).max(60)).max(30).default([]),
  scheduledAt: z.string().datetime({ offset: true }).optional().nullable(),
  aiGenerated: z.boolean().optional(),
  targets: z
    .array(
      z.object({
        accountId: z.string().min(1),
        contentOverride: z.string().trim().max(100000).optional().nullable(),
      }),
    )
    .max(30)
    .default([]),
})

export type PostInput = z.infer<typeof postInputSchema>

export const postInclude = {
  targets: {
    include: { account: { select: { id: true, platform: true, displayName: true, status: true } } },
  },
  createdBy: { select: { id: true, name: true, email: true } },
  approvedBy: { select: { id: true, name: true, email: true } },
} as const
