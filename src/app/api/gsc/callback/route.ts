import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getRequiredSession } from '@/lib/auth-helpers'
import { encryptSecret } from '@/lib/email-config'
import { exchangeCode } from '@/lib/gsc'

export const dynamic = 'force-dynamic'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
const PAGE = `${APP_URL}/dashboard/search-console`

// GET /api/gsc/callback — handle Google OAuth redirect
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const expectedState = request.cookies.get('gsc_oauth_state')?.value

  const redirect = (query: string) => {
    const res = NextResponse.redirect(`${PAGE}?${query}`)
    res.cookies.delete('gsc_oauth_state')
    return res
  }

  if (searchParams.get('error')) return redirect('error=denied')
  if (!code || !state || !expectedState || state !== expectedState) return redirect('error=invalid_state')

  try {
    const session = await getRequiredSession()
    const user = session.user as { organizationId?: string; role?: string }
    if (!user.organizationId) return redirect('error=no_org')
    if (user.role !== 'OWNER' && user.role !== 'ADMIN') return redirect('error=forbidden')

    const tokens = await exchangeCode(code)
    const expiresAt = new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000)
    const accessToken = encryptSecret(tokens.access_token)
    const refreshToken = tokens.refresh_token ? encryptSecret(tokens.refresh_token) : undefined

    await prisma.integration.upsert({
      where: { organizationId_type: { organizationId: user.organizationId, type: 'GOOGLE_SEARCH_CONSOLE' } },
      update: {
        status: 'CONNECTED',
        accessToken,
        ...(refreshToken ? { refreshToken } : {}),
        expiresAt,
        lastSyncAt: new Date(),
      },
      create: {
        type: 'GOOGLE_SEARCH_CONSOLE',
        name: 'Google Search Console',
        status: 'CONNECTED',
        accessToken,
        refreshToken,
        expiresAt,
        lastSyncAt: new Date(),
        organizationId: user.organizationId,
      },
    })

    return redirect('connected=1')
  } catch (err) {
    console.error('GSC callback error:', err)
    return redirect('error=callback_failed')
  }
}
