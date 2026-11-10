import crypto from 'crypto'
import { NextResponse } from 'next/server'
import { getRequiredSession, handleAuthError } from '@/lib/auth-helpers'
import { buildAuthUrl, isGscConfigured } from '@/lib/gsc'

export const dynamic = 'force-dynamic'

// GET /api/gsc/connect — start Google OAuth for Search Console
export async function GET() {
  try {
    await getRequiredSession()

    if (!isGscConfigured()) {
      return NextResponse.json(
        { error: 'Google OAuth is not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your environment variables.' },
        { status: 503 }
      )
    }

    const state = crypto.randomBytes(16).toString('hex')
    const response = NextResponse.redirect(buildAuthUrl(state))
    response.cookies.set('gsc_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600,
      path: '/',
    })
    return response
  } catch (error) {
    try { return handleAuthError(error) } catch {}
    console.error('GSC connect error:', error)
    return NextResponse.json({ error: 'Failed to start connection' }, { status: 500 })
  }
}
