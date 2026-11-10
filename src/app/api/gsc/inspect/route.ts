import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getRequiredSession, handleAuthError } from '@/lib/auth-helpers'
import { GscNotConnectedError, getAccessToken, inspectUrl } from '@/lib/gsc'

export const dynamic = 'force-dynamic'

const schema = z.object({
  site: z.string().min(1),
  url: z.string().url(),
})

// POST /api/gsc/inspect — index status / canonical check for a single URL
export async function POST(request: Request) {
  try {
    const session = await getRequiredSession()
    const organizationId = (session.user as { organizationId?: string }).organizationId
    if (!organizationId) return NextResponse.json({ error: 'Organization not found' }, { status: 400 })

    const { site, url } = schema.parse(await request.json())
    const token = await getAccessToken(organizationId)
    const result = await inspectUrl(token, site, url)
    return NextResponse.json({ result })
  } catch (error) {
    try { return handleAuthError(error) } catch {}
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Enter a valid URL that belongs to the selected property' }, { status: 400 })
    }
    if (error instanceof GscNotConnectedError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error('GSC inspect error:', error)
    return NextResponse.json({ error: 'URL inspection failed. Make sure the URL belongs to the selected property.' }, { status: 502 })
  }
}
