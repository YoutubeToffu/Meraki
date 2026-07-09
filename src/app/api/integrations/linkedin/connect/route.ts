import { NextResponse } from 'next/server'
import { getRequiredSession, handleAuthError } from '@/lib/auth-helpers'

export const dynamic = 'force-dynamic'

const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID ?? ''
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/linkedin/callback`

// GET /api/integrations/linkedin/connect â€” Initiate LinkedIn OAuth
export async function GET(_request: Request) {
  try {
    await getRequiredSession()

    if (!LINKEDIN_CLIENT_ID) {
      return NextResponse.json(
        { error: 'LinkedIn OAuth is not configured. Add LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET to your environment variables.' },
        { status: 503 }
      )
    }

    // LinkedIn OAuth 2.0 scopes
    // r_liteprofile: basic profile, r_emailaddress: email
    // w_member_social: posting (optional)
    const scopes = ['r_liteprofile', 'r_emailaddress', 'w_member_social'].join(' ')
    const state = Buffer.from(JSON.stringify({ ts: Date.now() })).toString('base64')

    const authUrl = new URL('https://www.linkedin.com/oauth/v2/authorization')
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('client_id', LINKEDIN_CLIENT_ID)
    authUrl.searchParams.set('redirect_uri', REDIRECT_URI)
    authUrl.searchParams.set('scope', scopes)
    authUrl.searchParams.set('state', state)

    return NextResponse.redirect(authUrl.toString())
  } catch (error) {
    try { return handleAuthError(error) } catch {}
    return NextResponse.json({ error: 'Auth required' }, { status: 401 })
  }
}
