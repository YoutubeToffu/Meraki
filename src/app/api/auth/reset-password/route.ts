import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const schema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, otp, newPassword } = schema.parse(body)

    const resetToken = await prisma.passwordResetToken.findFirst({
      where: { email },
      orderBy: { createdAt: 'desc' },
    })

    if (!resetToken) {
      return NextResponse.json({ error: 'Invalid or expired reset code' }, { status: 400 })
    }

    if (resetToken.expiresAt < new Date()) {
      await prisma.passwordResetToken.delete({ where: { id: resetToken.id } })
      return NextResponse.json({ error: 'Reset code has expired. Please request a new one.' }, { status: 400 })
    }

    const isValid = await bcrypt.compare(otp, resetToken.token)
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid reset code' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12)

    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    })

    await prisma.passwordResetToken.deleteMany({ where: { email } })

    return NextResponse.json({ message: 'Password reset successfully' })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 })
    }
    console.error('Reset password error:', error)
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 })
  }
}
