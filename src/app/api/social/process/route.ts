import { NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { handleAuthError } from '@/lib/auth-helpers'
import { getSocialContext } from '@/lib/social/auth'
import { processDueSocialPosts } from '@/lib/social/service'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

function validCronSecret(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const header = request.headers.get('authorization') || ''
  const a = Buffer.from(header)
  const b = Buffer.from(`Bearer ${secret}`)
  return a.length === b.length && timingSafeEqual(a, b)
}

async function handle(request: Request) {
  try {
    // Cron: processes every org. Signed-in user: only their own org.
    if (validCronSecret(request)) {
      const processed = await processDueSocialPosts()
      return NextResponse.json({ data: { processed } })
    }
    const ctx = await getSocialContext()
    const processed = await processDueSocialPosts({ organizationId: ctx.organizationId })
    return NextResponse.json({ data: { processed } })
  } catch (error) {
    try { return handleAuthError(error) } catch {}
    console.error('Error processing social posts:', error)
    return NextResponse.json({ error: 'Failed to process social posts' }, { status: 500 })
  }
}

export const GET = handle
export const POST = handle
