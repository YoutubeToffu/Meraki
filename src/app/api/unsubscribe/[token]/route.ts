import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/unsubscribe/[token] — Handle unsubscribe link clicks
// token = Email.trackingId (cuid, not guessable)
export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params

    if (!token || token.length < 10) {
      return new Response(unsubscribePage('Invalid link.', false), {
        headers: { 'Content-Type': 'text/html' },
        status: 400,
      })
    }

    // Find the email by tracking ID
    const email = await prisma.email.findUnique({
      where: { trackingId: token },
      select: { id: true, leadId: true, lead: { select: { email: true, organizationId: true } } },
    })

    if (!email) {
      return new Response(unsubscribePage('This link is no longer valid.', false), {
        headers: { 'Content-Type': 'text/html' },
        status: 404,
      })
    }

    // Mark lead as unsubscribed
    await prisma.lead.update({
      where: { id: email.leadId },
      data: { status: 'UNSUBSCRIBED' },
    })

    // Pause all active sequence enrollments for this lead
    await prisma.sequenceEnrollment.updateMany({
      where: { leadId: email.leadId, status: 'ACTIVE' },
      data: { status: 'UNSUBSCRIBED', nextStepAt: null },
    })

    // Log activity
    await prisma.activity.create({
      data: {
        type: 'STATUS_CHANGED',
        title: 'Lead unsubscribed',
        description: 'Unsubscribed via email link',
        leadId: email.leadId,
      },
    })

    return new Response(unsubscribePage('You have been successfully unsubscribed.', true), {
      headers: { 'Content-Type': 'text/html' },
    })
  } catch (error) {
    console.error('Unsubscribe error:', error)
    return new Response(unsubscribePage('Something went wrong. Please try again.', false), {
      headers: { 'Content-Type': 'text/html' },
      status: 500,
    })
  }
}

function unsubscribePage(message: string, success: boolean): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Unsubscribe</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f9fafb; }
    .card { background: white; border-radius: 12px; padding: 40px; max-width: 400px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .icon { font-size: 48px; margin-bottom: 16px; }
    h1 { font-size: 20px; margin: 0 0 8px; color: #111827; }
    p { color: #6b7280; font-size: 14px; margin: 0; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${success ? '✓' : '⚠'}</div>
    <h1>${success ? 'Unsubscribed' : 'Error'}</h1>
    <p>${message}</p>
  </div>
</body>
</html>`
}
