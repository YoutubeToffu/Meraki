import { NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { getRequiredSession, handleAuthError } from '@/lib/auth-helpers'
import {
  encryptSecret,
  getOrgMailer,
} from '@/lib/email-config'

export const dynamic = 'force-dynamic'

const updateEmailConfigSchema = z.object({
  fromEmail: z.string().trim().email('Enter a valid from email address'),
  fromName: z.string().trim().max(100).optional().default(''),
  apiKey: z.string().trim().max(500).optional().default(''),
})

function canManageEmail(role: string | undefined) {
  return role === 'OWNER' || role === 'ADMIN'
}

function getUserContext(session: Awaited<ReturnType<typeof getRequiredSession>>) {
  const user = session.user as { organizationId?: string; role?: string; email?: string }
  return user
}

export async function GET() {
  try {
    const session = await getRequiredSession()
    const { organizationId } = getUserContext(session)

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 400 })
    }

    const config = await prisma.emailConfig.findUnique({
      where: { organizationId },
      select: { fromEmail: true, fromName: true, apiKeyLast4: true },
    })

    return NextResponse.json({
      configured: Boolean(config),
      config,
    })
  } catch (error) {
    try { return handleAuthError(error) } catch {}
    console.error('Error fetching email settings:', error)
    return NextResponse.json({ error: 'Failed to fetch email settings' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getRequiredSession()
    const user = getUserContext(session)
    const organizationId = user.organizationId

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 400 })
    }
    if (!canManageEmail(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const data = updateEmailConfigSchema.parse(await request.json())
    const existing = await prisma.emailConfig.findUnique({
      where: { organizationId },
      select: { id: true },
    })

    if (!data.apiKey && !existing) {
      return NextResponse.json({ error: 'Resend API key is required' }, { status: 400 })
    }

    const config = await prisma.emailConfig.upsert({
      where: { organizationId },
      create: {
        organizationId,
        fromEmail: data.fromEmail,
        fromName: data.fromName || null,
        apiKeyEnc: encryptSecret(data.apiKey),
        apiKeyLast4: data.apiKey.slice(-4),
      },
      update: {
        fromEmail: data.fromEmail,
        fromName: data.fromName || null,
        ...(data.apiKey ? {
          apiKeyEnc: encryptSecret(data.apiKey),
          apiKeyLast4: data.apiKey.slice(-4),
        } : {}),
      },
      select: { fromEmail: true, fromName: true, apiKeyLast4: true },
    })

    return NextResponse.json({ configured: true, config })
  } catch (error) {
    try { return handleAuthError(error) } catch {}
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error saving email settings:', error)
    return NextResponse.json({ error: 'Failed to save email settings' }, { status: 500 })
  }
}

export async function POST() {
  try {
    const session = await getRequiredSession()
    const user = getUserContext(session)

    if (!user.organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 400 })
    }
    if (!canManageEmail(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (!user.email) {
      return NextResponse.json({ error: 'Your account does not have an email address' }, { status: 400 })
    }

    const mailer = await getOrgMailer(user.organizationId)
    if (!mailer) {
      return NextResponse.json({ error: 'Email sending is not configured' }, { status: 400 })
    }

    const { error } = await mailer.client.emails.send({
      from: mailer.from,
      to: user.email,
      subject: 'Meraki email sending test',
      html: '<p>Your Meraki email sending settings are working.</p>',
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 502 })
    }

    return NextResponse.json({ message: `Test email sent to ${user.email}` })
  } catch (error) {
    try { return handleAuthError(error) } catch {}
    console.error('Error sending email settings test:', error)
    return NextResponse.json({ error: 'Failed to send test email' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const session = await getRequiredSession()
    const user = getUserContext(session)

    if (!user.organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 400 })
    }
    if (!canManageEmail(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.emailConfig.deleteMany({ where: { organizationId: user.organizationId } })
    return NextResponse.json({ configured: false })
  } catch (error) {
    try { return handleAuthError(error) } catch {}
    console.error('Error removing email settings:', error)
    return NextResponse.json({ error: 'Failed to remove email settings' }, { status: 500 })
  }
}
