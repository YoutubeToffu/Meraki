import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getRequiredSession } from '@/lib/auth-helpers'

const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID ?? ''
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET ?? ''
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/linkedin/callback`
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

// GET /api/integrations/linkedin/callback — Handle LinkedIn OAuth callback
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(`${APP_URL}/dashboard/integrations?error=linkedin_denied`)
  }

  if (!code) {
    return NextResponse.redirect(`${APP_URL}/dashboard/integrations?error=no_code`)
  }

  try {
    // We need the session — but OAuth redirects lose the session cookie in some setups.
    // We'll rely on the session cookie being present.
    const session = await getRequiredSession()
    const orgId = (session.user as any).organizationId

    // Exchange code for token
    const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
        client_id: LINKEDIN_CLIENT_ID,
        client_secret: LINKEDIN_CLIENT_SECRET,
      }),
    })

    if (!tokenRes.ok) {
      console.error('LinkedIn token exchange failed:', await tokenRes.text())
      return NextResponse.redirect(`${APP_URL}/dashboard/integrations?error=token_exchange`)
    }

    const { access_token, expires_in } = await tokenRes.json()

    // Fetch LinkedIn profile
    const profileRes = await fetch('https://api.linkedin.com/v2/me?projection=(id,localizedFirstName,localizedLastName,profilePicture(displayImage~:playableStreams))', {
      headers: { Authorization: `Bearer ${access_token}` },
    })
    const profile = profileRes.ok ? await profileRes.json() : {}

    // Fetch email
    const emailRes = await fetch('https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))', {
      headers: { Authorization: `Bearer ${access_token}` },
    })
    const emailData = emailRes.ok ? await emailRes.json() : {}
    const linkedinEmail = emailData?.elements?.[0]?.['handle~']?.emailAddress ?? null

    const expiresAt = expires_in ? new Date(Date.now() + expires_in * 1000) : null

    // Upsert integration record
    await prisma.integration.upsert({
      where: { organizationId_type: { organizationId: orgId, type: 'LINKEDIN' } },
      update: {
        status: 'CONNECTED',
        accessToken: access_token,
        expiresAt,
        lastSyncAt: new Date(),
        settings: {
          linkedinId: profile.id ?? null,
          name: `${profile.localizedFirstName ?? ''} ${profile.localizedLastName ?? ''}`.trim() || null,
          email: linkedinEmail,
        },
      },
      create: {
        type: 'LINKEDIN',
        name: 'LinkedIn',
        status: 'CONNECTED',
        accessToken: access_token,
        expiresAt,
        lastSyncAt: new Date(),
        organizationId: orgId,
        settings: {
          linkedinId: profile.id ?? null,
          name: `${profile.localizedFirstName ?? ''} ${profile.localizedLastName ?? ''}`.trim() || null,
          email: linkedinEmail,
        },
      },
    })

    return NextResponse.redirect(`${APP_URL}/dashboard/integrations?connected=linkedin`)
  } catch (err) {
    console.error('LinkedIn callback error:', err)
    return NextResponse.redirect(`${APP_URL}/dashboard/integrations?error=callback_failed`)
  }
}
