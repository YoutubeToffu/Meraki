import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getRequiredSession, handleAuthError } from '@/lib/auth-helpers'

export const dynamic = 'force-dynamic'

const MAX_SIZE_BYTES = 2 * 1024 * 1024 // 2 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export async function PUT(request: Request) {
  try {
    const session = await getRequiredSession()
    const userId = (session.user as any).id

    const { avatar } = await request.json()

    if (typeof avatar !== 'string') {
      return NextResponse.json({ error: 'Invalid avatar data' }, { status: 400 })
    }

    // Validate it is a data URL with an allowed image type
    const match = avatar.match(/^data:(image\/[a-z]+);base64,/)
    if (!match) {
      return NextResponse.json({ error: 'Avatar must be a valid base64 image data URL' }, { status: 400 })
    }

    const mimeType = match[1]
    if (!ALLOWED_TYPES.includes(mimeType)) {
      return NextResponse.json(
        { error: 'Only JPEG, PNG, WebP, and GIF images are allowed' },
        { status: 400 }
      )
    }

    // Check decoded byte size
    const base64Data = avatar.split(',')[1]
    const sizeBytes = Math.ceil((base64Data.length * 3) / 4)
    if (sizeBytes > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'Image must be smaller than 2 MB' },
        { status: 400 }
      )
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { avatar },
      select: { id: true, avatar: true },
    })

    return NextResponse.json({ data: user })
  } catch (error) {
    try { return handleAuthError(error) } catch {}
    console.error('Avatar upload error:', error)
    return NextResponse.json({ error: 'Failed to update avatar' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getRequiredSession()
    const userId = (session.user as any).id

    await prisma.user.update({
      where: { id: userId },
      data: { avatar: null },
    })

    return NextResponse.json({ data: { avatar: null } })
  } catch (error) {
    try { return handleAuthError(error) } catch {}
    return NextResponse.json({ error: 'Failed to remove avatar' }, { status: 500 })
  }
}
