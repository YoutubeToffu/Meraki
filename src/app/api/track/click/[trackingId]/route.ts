import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/track/click/[trackingId]?url=... — Click tracking redirect
export async function GET(
  request: Request,
  { params }: { params: { trackingId: string } }
) {
  const { trackingId } = params
  const { searchParams } = new URL(request.url)
  const targetUrl = searchParams.get('url')

  if (!targetUrl) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 })
  }

  // Validate URL to prevent open redirect
  let parsedUrl: URL
  try {
    parsedUrl = new URL(targetUrl)
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  // Record click (fire-and-forget)
  if (trackingId && trackingId.length >= 10) {
    prisma.email.updateMany({
      where: { trackingId, clickedAt: null },
      data: { clickedAt: new Date(), status: 'CLICKED' },
    }).then(async (result) => {
      if (result.count > 0) {
        const email = await prisma.email.findFirst({
          where: { trackingId: trackingId },
          select: { leadId: true, subject: true },
        })
        if (email) {
          await prisma.activity.create({
            data: {
              type: 'EMAIL_CLICKED',
              title: `Link clicked: ${email.subject}`,
              description: parsedUrl.hostname,
              leadId: email.leadId,
            },
          })
        }
      }
    }).catch((err) => console.error('Track click error:', err))
  }

  return NextResponse.redirect(parsedUrl.toString(), 302)
}
