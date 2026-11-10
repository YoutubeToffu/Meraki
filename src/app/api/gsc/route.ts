import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getRequiredSession, handleAuthError } from '@/lib/auth-helpers'
import { GscNotConnectedError, getAccessToken, isGscConfigured, listSites } from '@/lib/gsc'

export const dynamic = 'force-dynamic'

// GET /api/gsc — connection status and the verified sites available
export async function GET() {
  try {
    const session = await getRequiredSession()
    const organizationId = (session.user as { organizationId?: string }).organizationId
    if (!organizationId) return NextResponse.json({ error: 'Organization not found' }, { status: 400 })

    const configured = isGscConfigured()
    const integration = await prisma.integration.findUnique({
      where: { organizationId_type: { organizationId, type: 'GOOGLE_SEARCH_CONSOLE' } },
      select: { status: true },
    })
    if (!integration || integration.status === 'DISCONNECTED') {
      return NextResponse.json({ configured, connected: false, sites: [] })
    }

    try {
      const token = await getAccessToken(organizationId)
      const sites = await listSites(token)
      return NextResponse.json({ configured, connected: true, sites })
    } catch (error) {
      if (error instanceof GscNotConnectedError) {
        return NextResponse.json({ configured, connected: false, expired: true, sites: [], message: error.message })
      }
      throw error
    }
  } catch (error) {
    try { return handleAuthError(error) } catch {}
    console.error('GSC status error:', error)
    return NextResponse.json({ error: 'Failed to load Search Console status' }, { status: 500 })
  }
}

// DELETE /api/gsc — disconnect
export async function DELETE() {
  try {
    const session = await getRequiredSession()
    const user = session.user as { organizationId?: string; role?: string }
    if (!user.organizationId) return NextResponse.json({ error: 'Organization not found' }, { status: 400 })
    if (user.role !== 'OWNER' && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.integration.deleteMany({
      where: { organizationId: user.organizationId, type: 'GOOGLE_SEARCH_CONSOLE' },
    })
    return NextResponse.json({ connected: false })
  } catch (error) {
    try { return handleAuthError(error) } catch {}
    console.error('GSC disconnect error:', error)
    return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 })
  }
}
