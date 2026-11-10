export const SOCIAL_PLATFORMS = [
  'LINKEDIN',
  'FACEBOOK',
  'X',
  'INSTAGRAM',
  'THREADS',
  'YOUTUBE',
  'PINTEREST',
  'TIKTOK',
  'WORDPRESS',
  'MEDIUM',
] as const

export type SocialPlatformId = (typeof SOCIAL_PLATFORMS)[number]

export interface PlatformSpec {
  label: string
  maxChars: number
  requiresMedia: boolean
  // What the "account id" field means for this platform when connecting by token
  externalIdLabel: string
  externalIdHint: string
  // Extra fields stored in account metadata
  extraFields?: { key: string; label: string; hint: string; required?: boolean }[]
  // Publishing is not possible through a public API
  unsupportedReason?: string
}

export const PLATFORM_SPECS: Record<SocialPlatformId, PlatformSpec> = {
  LINKEDIN: {
    label: 'LinkedIn',
    maxChars: 3000,
    requiresMedia: false,
    externalIdLabel: 'Author URN',
    externalIdHint: 'urn:li:person:xxxx or urn:li:organization:xxxx',
  },
  FACEBOOK: {
    label: 'Facebook Page',
    maxChars: 63206,
    requiresMedia: false,
    externalIdLabel: 'Page ID',
    externalIdHint: 'Numeric Facebook Page ID (use a Page access token)',
  },
  X: {
    label: 'X (Twitter)',
    maxChars: 280,
    requiresMedia: false,
    externalIdLabel: 'Username',
    externalIdHint: 'Your @handle (OAuth 2.0 user access token with tweet.write)',
  },
  INSTAGRAM: {
    label: 'Instagram',
    maxChars: 2200,
    requiresMedia: true,
    externalIdLabel: 'Instagram Business Account ID',
    externalIdHint: 'IG user ID linked to a Facebook Page',
  },
  THREADS: {
    label: 'Threads',
    maxChars: 500,
    requiresMedia: false,
    externalIdLabel: 'Threads User ID',
    externalIdHint: 'Numeric Threads user ID',
  },
  YOUTUBE: {
    label: 'YouTube',
    maxChars: 5000,
    requiresMedia: true,
    externalIdLabel: 'Channel ID',
    externalIdHint: 'UC... channel ID',
    unsupportedReason:
      'YouTube has no public API for community posts and video upload is not supported yet.',
  },
  PINTEREST: {
    label: 'Pinterest',
    maxChars: 500,
    requiresMedia: true,
    externalIdLabel: 'Username',
    externalIdHint: 'Pinterest username',
    extraFields: [{ key: 'boardId', label: 'Board ID', hint: 'Board to pin to', required: true }],
  },
  TIKTOK: {
    label: 'TikTok',
    maxChars: 2200,
    requiresMedia: true,
    externalIdLabel: 'Open ID',
    externalIdHint: 'TikTok open_id (video content posting access token)',
  },
  WORDPRESS: {
    label: 'WordPress Blog',
    maxChars: 100000,
    requiresMedia: false,
    externalIdLabel: 'Site URL',
    externalIdHint: 'https://yourblog.com',
    extraFields: [
      { key: 'username', label: 'WordPress username', hint: 'User that owns the application password', required: true },
    ],
  },
  MEDIUM: {
    label: 'Medium',
    maxChars: 100000,
    requiresMedia: false,
    externalIdLabel: 'Medium User ID',
    externalIdHint: 'Author ID from GET /v1/me (use an integration token)',
  },
}

export function isSocialPlatform(value: string): value is SocialPlatformId {
  return (SOCIAL_PLATFORMS as readonly string[]).includes(value)
}

// Text actually sent to a platform: variant (or master) + hashtags + link.
export function composePostText(
  post: { content: string; hashtags: string[]; linkUrl: string | null },
  override: string | null,
  platform: SocialPlatformId,
): string {
  let text = (override ?? post.content).trim()
  const isBlog = platform === 'WORDPRESS' || platform === 'MEDIUM'
  if (!isBlog) {
    if (override === null && post.hashtags.length > 0) {
      text += `\n\n${post.hashtags.map((h) => (h.startsWith('#') ? h : `#${h}`)).join(' ')}`
    }
    if (post.linkUrl && !text.includes(post.linkUrl)) {
      text += `\n\n${post.linkUrl}`
    }
  }
  return text
}

export function validateForPlatform(
  platform: SocialPlatformId,
  text: string,
  mediaUrls: string[],
): string[] {
  const spec = PLATFORM_SPECS[platform]
  const issues: string[] = []
  if (spec.unsupportedReason) issues.push(spec.unsupportedReason)
  if (text.length === 0) issues.push('Post text is empty')
  if (text.length > spec.maxChars) {
    issues.push(`${spec.label} allows ${spec.maxChars} characters (currently ${text.length})`)
  }
  if (spec.requiresMedia && mediaUrls.length === 0) {
    issues.push(`${spec.label} requires an image or video URL`)
  }
  return issues
}
