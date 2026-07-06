import { NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { getRequiredSession, handleAuthError } from '@/lib/auth-helpers'

const updateProfileSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().trim().email('Invalid email address'),
  bio: z.string().trim().max(500).optional().nullable(),
  phone: z.string().trim().max(30).optional().nullable(),
  senderName: z.string().trim().max(100).optional().nullable(),
  replyToEmail: z.string().trim().email('Invalid reply-to email').optional().or(z.literal('')).nullable(),
  emailSignature: z.string().trim().max(2000).optional().nullable(),
  timezone: z.string().trim().min(1, 'Timezone is required').max(100),
  notificationFrequency: z.enum(['ALL', 'IMPORTANT', 'DAILY', 'NONE']),
})

export async function GET() {
  try {
    const session = await getRequiredSession()
    const userId = (session.user as any).id

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        bio: true,
        phone: true,
        senderName: true,
        replyToEmail: true,
        emailSignature: true,
        timezone: true,
        notificationFrequency: true,
        role: true,
        organizationId: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ data: user })
  } catch (error) {
    try { return handleAuthError(error) } catch {}
    console.error('Error fetching profile settings:', error)
    return NextResponse.json({ error: 'Failed to fetch profile settings' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getRequiredSession()
    const userId = (session.user as any).id
    const body = await request.json()
    const data = updateProfileSchema.parse(body)

    const existingUser = await prisma.user.findFirst({
      where: {
        email: data.email,
        NOT: { id: userId },
      },
      select: { id: true },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Another account already uses this email address' },
        { status: 409 }
      )
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        email: data.email,
        bio: data.bio || null,
        phone: data.phone || null,
        senderName: data.senderName || null,
        replyToEmail: data.replyToEmail || null,
        emailSignature: data.emailSignature || null,
        timezone: data.timezone,
        notificationFrequency: data.notificationFrequency,
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        bio: true,
        phone: true,
        senderName: true,
        replyToEmail: true,
        emailSignature: true,
        timezone: true,
        notificationFrequency: true,
        role: true,
        organizationId: true,
      },
    })

    return NextResponse.json({
      data: updatedUser,
      message: 'Profile settings updated successfully',
    })
  } catch (error) {
    try { return handleAuthError(error) } catch {}
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error updating profile settings:', error)
    return NextResponse.json({ error: 'Failed to update profile settings' }, { status: 500 })
  }
}