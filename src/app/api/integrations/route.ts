import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getRequiredSession, handleAuthError } from '@/lib/auth-helpers'

export const dynamic = 'force-dynamic'

// GET /api/integrations â€” list all integrations for the org
export async function GET(_request: Request) {
  try {
    const session = await getRequiredSession()
    const orgId = (session.user as any).organizationId

    const integrations = await prisma.integration.findMany({
      where: { organizationId: orgId },
      select: {
        id: true, type: true, name: true, status: true,
        lastSyncAt: true, createdAt: true, updatedAt: true,
        settings: true,
        // Never return tokens to the client
      },
    })

    // Return all known integration types with connected ones merged in
    const ALL_TYPES = [
      { type: 'LINKEDIN', name: 'LinkedIn', category: 'Social', description: 'Connect your LinkedIn account for outreach and activity tracking' },
      { type: 'GMAIL', name: 'Gmail', category: 'Email', description: 'Send and track emails through your Gmail account' },
      { type: 'OUTLOOK', name: 'Microsoft Outlook', category: 'Email', description: 'Integrate with Outlook for email and calendar' },
      { type: 'GOOGLE_CALENDAR', name: 'Google Calendar', category: 'Calendar', description: 'Sync meetings and schedule demos automatically' },
      { type: 'CALENDLY', name: 'Calendly', category: 'Calendar', description: 'Automate demo scheduling with Calendly links' },
      { type: 'HUBSPOT', name: 'HubSpot', category: 'CRM', description: 'Sync leads and activities with HubSpot CRM' },
      { type: 'SALESFORCE', name: 'Salesforce', category: 'CRM', description: 'Two-way sync with Salesforce' },
      { type: 'SLACK', name: 'Slack', category: 'Communication', description: 'Get real-time notifications in Slack' },
      { type: 'ZOOM', name: 'Zoom', category: 'Meetings', description: 'Automatically create Zoom meeting links' },
      { type: 'WEBHOOK', name: 'Custom Webhooks', category: 'Developer', description: 'Send events to your own endpoints' },
    ]

    const connectedMap = new Map(integrations.map((i) => [i.type, i]))

    const data = ALL_TYPES.map((t) => {
      const connected = connectedMap.get(t.type as any)
      return {
        ...t,
        id: connected?.id ?? null,
        status: connected?.status ?? 'DISCONNECTED',
        lastSyncAt: connected?.lastSyncAt?.toISOString() ?? null,
        settings: connected?.settings ?? null,
      }
    })

    return NextResponse.json({
      data,
      connectedCount: integrations.filter((i) => i.status === 'CONNECTED').length,
    })
  } catch (error) {
    try { return handleAuthError(error) } catch {}
    return NextResponse.json({ error: 'Failed to fetch integrations' }, { status: 500 })
  }
}

// DELETE /api/integrations â€” disconnect an integration
export async function DELETE(request: Request) {
  try {
    const session = await getRequiredSession()
    const orgId = (session.user as any).organizationId

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    if (!type) return NextResponse.json({ error: 'type required' }, { status: 400 })

    await prisma.integration.deleteMany({
      where: { organizationId: orgId, type: type as any },
    })

    return NextResponse.json({ message: `${type} disconnected` })
  } catch (error) {
    try { return handleAuthError(error) } catch {}
    return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 })
  }
}
