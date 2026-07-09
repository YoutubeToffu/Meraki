import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { Resend } from 'resend'
import prisma from '@/lib/prisma'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const resend = new Resend(process.env.RESEND_API_KEY)

const schema = z.object({
  email: z.string().email(),
})

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email } = schema.parse(body)

    // Always return success to prevent user enumeration
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ message: 'If that email exists, a reset code has been sent.' })
    }

    const otp = generateOtp()
    const hashedOtp = await bcrypt.hash(otp, 10)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    // Delete any existing tokens for this email
    await prisma.passwordResetToken.deleteMany({ where: { email } })

    await prisma.passwordResetToken.create({
      data: { email, token: hashedOtp, expiresAt },
    })

    const { error: sendError } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@meraki.app',
      to: email,
      subject: 'Your Meraki password reset code',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <h2 style="font-size:24px;font-weight:700;color:#1e293b;margin-bottom:8px">Reset your password</h2>
          <p style="color:#64748b;margin-bottom:24px">Use the code below to reset your Meraki password. It expires in <strong>15 minutes</strong>.</p>
          <div style="background:#f1f5f9;border-radius:8px;padding:24px;text-align:center;letter-spacing:8px;font-size:32px;font-weight:700;color:#1e293b;margin-bottom:24px">
            ${otp}
          </div>
          <p style="color:#94a3b8;font-size:13px">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    })

    if (sendError) {
      // Roll back the token if email couldn't be delivered
      await prisma.passwordResetToken.deleteMany({ where: { email } })
      console.error('Resend error:', sendError)
      return NextResponse.json({ error: 'Failed to send reset code' }, { status: 500 })
    }

    return NextResponse.json({ message: 'If that email exists, a reset code has been sent.' })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }
    console.error('Forgot password error:', error)
    return NextResponse.json({ error: 'Failed to send reset code' }, { status: 500 })
  }
}
