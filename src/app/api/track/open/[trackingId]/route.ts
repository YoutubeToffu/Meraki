import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/track/open/[trackingId] — 1x1 tracking pixel
export async function GET(
  request: Request,
  { params }: { params: { trackingId: string } }
) {
  const { trackingId } = params

  // Fire-and-forget: don't block the pixel response
  if (trackingId && trackingId.length >= 10) {
    prisma.email.updateMany({
      where: { trackingId, openedAt: null },
      data: { openedAt: new Date(), status: 'OPENED' },
    }).then(async (result) => {
      if (result.count > 0) {
        const email = await prisma.email.findFirst({
          where: { trackingId },
          select: { leadId: true, subject: true },
        })
        if (email) {
          await prisma.activity.create({
            data: {
              type: 'EMAIL_OPENED',
              title: `Email opened: ${email.subject}`,
              leadId: email.leadId,
            },
          })
        }
      }
    }).catch((err) => console.error('Track open error:', err))
  }

  // Return 1x1 transparent GIF
  const pixel = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    'base64'
  )
  return new Response(pixel, {
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  })
}
