import { NextResponse } from 'next/server'
import { z } from 'zod'
import crypto from 'crypto'

// Webhook event types
const webhookEventSchema = z.object({
  event: z.enum([
    'lead.created',
    'lead.updated',
    'lead.status_changed',
    'email.sent',
    'email.opened',
    'email.clicked',
    'email.replied',
    'email.bounced',
    'meeting.scheduled',
    'meeting.completed',
    'sequence.enrolled',
    'sequence.completed',
  ]),
  data: z.record(z.string(), z.any()),
  timestamp: z.string().optional(),
})

// Verify webhook signature (for incoming webhooks from external services)
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}

// POST /api/webhooks - Handle incoming webhooks from external services
export async function POST(request: Request) {
  try {
    const signature = request.headers.get('x-webhook-signature')
    const rawBody = await request.text()
    
    // In production, verify the signature
    // const webhookSecret = process.env.WEBHOOK_SECRET
    // if (webhookSecret && signature) {
    //   if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
    //     return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    //   }
    // }

    const body = JSON.parse(rawBody)
    const validatedData = webhookEventSchema.parse(body)

    // Process different event types
    switch (validatedData.event) {
      case 'lead.created':
        // Handle new lead from external source
        console.log('New lead created:', validatedData.data)
        break
      
      case 'email.opened':
        // Update email tracking
        console.log('Email opened:', validatedData.data)
        break
      
      case 'email.clicked':
        // Track click events
        console.log('Email clicked:', validatedData.data)
        break
      
      case 'meeting.scheduled':
        // Handle calendar integration events
        console.log('Meeting scheduled:', validatedData.data)
        break
      
      default:
        console.log(`Unhandled event: ${validatedData.event}`, validatedData.data)
    }

    return NextResponse.json({
      success: true,
      event: validatedData.event,
      receivedAt: new Date().toISOString(),
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid webhook payload', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    )
  }
}

// GET /api/webhooks - List configured webhooks (authenticated)
export async function GET() {
  // Mock response - in production, fetch from database
  const webhooks = [
    {
      id: 'wh_1',
      url: 'https://hooks.zapier.com/hooks/xxx',
      events: ['lead.created', 'lead.status_changed'],
      status: 'active',
      createdAt: '2026-01-15T10:00:00Z',
    },
    {
      id: 'wh_2',
      url: 'https://api.hubspot.com/webhooks/xxx',
      events: ['email.sent', 'email.opened', 'email.clicked'],
      status: 'active',
      createdAt: '2026-02-01T14:00:00Z',
    },
  ]

  return NextResponse.json({ data: webhooks })
}
