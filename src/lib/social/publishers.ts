import type { SocialPlatformId } from '@/lib/social/platforms'

export class PublishError extends Error {
  retryable: boolean
  // Token rejected by the platform: the account needs to be reconnected
  authFailure: boolean
  constructor(message: string, opts: { retryable?: boolean; authFailure?: boolean } = {}) {
    super(message)
    this.name = 'PublishError'
    this.retryable = opts.retryable ?? false
    this.authFailure = opts.authFailure ?? false
  }
}

export interface PublishInput {
  platform: SocialPlatformId
  accessToken: string
  externalId: string
  metadata: Record<string, any>
  text: string
  title: string | null
  mediaUrls: string[]
  linkUrl: string | null
}

export interface PublishResult {
  externalPostId: string
  externalUrl?: string
}

async function request(url: string, init: RequestInit & { json?: unknown } = {}) {
  const { json, headers, ...rest } = init
  let res: Response
  try {
    res = await fetch(url, {
      ...rest,
      headers: {
        ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(headers as Record<string, string> | undefined),
      },
      body: json !== undefined ? JSON.stringify(json) : rest.body,
      signal: AbortSignal.timeout(25_000),
    })
  } catch (err) {
    throw new PublishError(
      `Network error: ${err instanceof Error ? err.message : 'request failed'}`,
      { retryable: true },
    )
  }

  const raw = await res.text()
  let data: any = null
  try {
    data = raw ? JSON.parse(raw) : null
  } catch {
    data = { raw }
  }

  if (!res.ok) {
    const detail =
      data?.error?.message ||
      data?.error_description ||
      data?.message ||
      data?.detail ||
      data?.title ||
      (typeof data?.error === 'string' ? data.error : null) ||
      raw.slice(0, 300) ||
      res.statusText
    throw new PublishError(`HTTP ${res.status}: ${detail}`, {
      retryable: res.status === 429 || res.status >= 500,
      authFailure: res.status === 401,
    })
  }
  return { data, headers: res.headers }
}

const GRAPH = 'https://graph.facebook.com/v19.0'
const THREADS = 'https://graph.threads.net/v1.0'

const VIDEO_EXT = /\.(mp4|mov|m4v|webm)(\?|$)/i

async function publishLinkedIn(i: PublishInput): Promise<PublishResult> {
  const article = i.linkUrl
    ? [{ status: 'READY', originalUrl: i.linkUrl, ...(i.title ? { title: { text: i.title } } : {}) }]
    : []
  const { data, headers } = await request('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${i.accessToken}`,
      'X-Restli-Protocol-Version': '2.0.0',
    },
    json: {
      author: i.externalId,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text: i.text },
          shareMediaCategory: article.length ? 'ARTICLE' : 'NONE',
          ...(article.length ? { media: article } : {}),
        },
      },
      visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
    },
  })
  const id = headers.get('x-restli-id') || data?.id
  if (!id) throw new PublishError('LinkedIn did not return a post id')
  return { externalPostId: id, externalUrl: `https://www.linkedin.com/feed/update/${id}` }
}

async function publishFacebook(i: PublishInput): Promise<PublishResult> {
  const params = new URLSearchParams({ access_token: i.accessToken })
  let path = 'feed'
  const image = i.mediaUrls.find((u) => !VIDEO_EXT.test(u))
  if (image) {
    path = 'photos'
    params.set('url', image)
    params.set('caption', i.text)
  } else {
    params.set('message', i.text)
    if (i.linkUrl) params.set('link', i.linkUrl)
  }
  const { data } = await request(`${GRAPH}/${encodeURIComponent(i.externalId)}/${path}`, {
    method: 'POST',
    body: params,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
  const id = data?.post_id || data?.id
  if (!id) throw new PublishError('Facebook did not return a post id')
  return { externalPostId: id, externalUrl: `https://www.facebook.com/${id}` }
}

async function publishX(i: PublishInput): Promise<PublishResult> {
  const { data } = await request('https://api.twitter.com/2/tweets', {
    method: 'POST',
    headers: { Authorization: `Bearer ${i.accessToken}` },
    json: { text: i.text },
  })
  const id = data?.data?.id
  if (!id) throw new PublishError('X did not return a post id')
  const handle = i.externalId.replace(/^@/, '')
  return { externalPostId: id, externalUrl: `https://x.com/${handle}/status/${id}` }
}

async function publishInstagram(i: PublishInput): Promise<PublishResult> {
  const image = i.mediaUrls.find((u) => !VIDEO_EXT.test(u))
  if (!image) {
    throw new PublishError('Instagram publishing currently supports image posts only')
  }
  const create = await request(`${GRAPH}/${encodeURIComponent(i.externalId)}/media`, {
    method: 'POST',
    body: new URLSearchParams({ image_url: image, caption: i.text, access_token: i.accessToken }),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
  const creationId = create.data?.id
  if (!creationId) throw new PublishError('Instagram did not return a media container id')
  const publish = await request(`${GRAPH}/${encodeURIComponent(i.externalId)}/media_publish`, {
    method: 'POST',
    body: new URLSearchParams({ creation_id: creationId, access_token: i.accessToken }),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
  const id = publish.data?.id
  if (!id) throw new PublishError('Instagram did not return a post id')
  return { externalPostId: id }
}

async function publishThreads(i: PublishInput): Promise<PublishResult> {
  const image = i.mediaUrls.find((u) => !VIDEO_EXT.test(u))
  const params = new URLSearchParams({
    media_type: image ? 'IMAGE' : 'TEXT',
    text: i.text,
    access_token: i.accessToken,
  })
  if (image) params.set('image_url', image)
  const create = await request(`${THREADS}/${encodeURIComponent(i.externalId)}/threads`, {
    method: 'POST',
    body: params,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
  const creationId = create.data?.id
  if (!creationId) throw new PublishError('Threads did not return a container id')
  const publish = await request(`${THREADS}/${encodeURIComponent(i.externalId)}/threads_publish`, {
    method: 'POST',
    body: new URLSearchParams({ creation_id: creationId, access_token: i.accessToken }),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
  const id = publish.data?.id
  if (!id) throw new PublishError('Threads did not return a post id')
  return { externalPostId: id }
}

async function publishPinterest(i: PublishInput): Promise<PublishResult> {
  const boardId = i.metadata?.boardId
  if (!boardId) throw new PublishError('Pinterest account is missing a board id')
  const image = i.mediaUrls.find((u) => !VIDEO_EXT.test(u))
  if (!image) throw new PublishError('Pinterest requires an image URL')
  const { data } = await request('https://api.pinterest.com/v5/pins', {
    method: 'POST',
    headers: { Authorization: `Bearer ${i.accessToken}` },
    json: {
      board_id: boardId,
      title: (i.title || i.text.split('\n')[0]).slice(0, 100),
      description: i.text,
      ...(i.linkUrl ? { link: i.linkUrl } : {}),
      media_source: { source_type: 'image_url', url: image },
    },
  })
  if (!data?.id) throw new PublishError('Pinterest did not return a pin id')
  return { externalPostId: data.id, externalUrl: `https://www.pinterest.com/pin/${data.id}/` }
}

async function publishTikTok(i: PublishInput): Promise<PublishResult> {
  const video = i.mediaUrls.find((u) => VIDEO_EXT.test(u))
  if (!video) throw new PublishError('TikTok requires a video URL (.mp4, .mov, .webm)')
  const { data } = await request('https://open.tiktokapis.com/v2/post/publish/video/init/', {
    method: 'POST',
    headers: { Authorization: `Bearer ${i.accessToken}` },
    json: {
      post_info: {
        title: i.text.slice(0, 2200),
        // Unaudited TikTok apps may only post privately
        privacy_level: i.metadata?.privacyLevel || 'SELF_ONLY',
      },
      source_info: { source: 'PULL_FROM_URL', video_url: video },
    },
  })
  const id = data?.data?.publish_id
  if (!id) throw new PublishError(data?.error?.message || 'TikTok did not return a publish id')
  return { externalPostId: id }
}

function toHtml(text: string): string {
  const escape = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return text
    .split(/\n{2,}/)
    .map((p) => `<p>${escape(p).replace(/\n/g, '<br>')}</p>`)
    .join('\n')
}

function deriveTitle(i: PublishInput): string {
  return (i.title || i.text.split('\n')[0] || 'Untitled').slice(0, 120)
}

async function publishWordPress(i: PublishInput): Promise<PublishResult> {
  const username = i.metadata?.username
  if (!username) throw new PublishError('WordPress account is missing a username')
  const site = i.externalId.replace(/\/+$/, '')
  const auth = Buffer.from(`${username}:${i.accessToken}`).toString('base64')
  const { data } = await request(`${site}/wp-json/wp/v2/posts`, {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}` },
    json: { title: deriveTitle(i), content: toHtml(i.text), status: 'publish' },
  })
  if (!data?.id) throw new PublishError('WordPress did not return a post id')
  return { externalPostId: String(data.id), externalUrl: data.link }
}

async function publishMedium(i: PublishInput): Promise<PublishResult> {
  const { data } = await request(
    `https://api.medium.com/v1/users/${encodeURIComponent(i.externalId)}/posts`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${i.accessToken}` },
      json: {
        title: deriveTitle(i),
        contentFormat: 'html',
        content: toHtml(i.text),
        publishStatus: 'public',
        ...(i.linkUrl ? { canonicalUrl: i.linkUrl } : {}),
      },
    },
  )
  const post = data?.data
  if (!post?.id) throw new PublishError('Medium did not return a post id')
  return { externalPostId: post.id, externalUrl: post.url }
}

const adapters: Record<SocialPlatformId, (i: PublishInput) => Promise<PublishResult>> = {
  LINKEDIN: publishLinkedIn,
  FACEBOOK: publishFacebook,
  X: publishX,
  INSTAGRAM: publishInstagram,
  THREADS: publishThreads,
  YOUTUBE: async () => {
    throw new PublishError('YouTube publishing is not supported yet')
  },
  PINTEREST: publishPinterest,
  TIKTOK: publishTikTok,
  WORDPRESS: publishWordPress,
  MEDIUM: publishMedium,
}

export function publishToPlatform(input: PublishInput): Promise<PublishResult> {
  return adapters[input.platform](input)
}
