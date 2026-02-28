import { NextResponse } from 'next/server'
import { z } from 'zod'

// Schema for creating a sequence
const createSequenceSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  triggerType: z.enum([
    'MANUAL',
    'FORM_SUBMISSION',
    'TAG_ADDED',
    'STAGE_CHANGED',
    'SCORE_THRESHOLD',
    'API',
  ]).default('MANUAL'),
  steps: z.array(z.object({
    type: z.enum(['EMAIL', 'LINKEDIN', 'TASK', 'WAIT', 'CONDITION']),
    delayDays: z.number().default(0),
    delayHours: z.number().default(0),
    // Email step fields
    subject: z.string().optional(),
    body: z.string().optional(),
    templateId: z.string().optional(),
    // LinkedIn step fields
    linkedinAction: z.enum(['CONNECT', 'MESSAGE', 'VIEW_PROFILE', 'FOLLOW']).optional(),
    linkedinMessage: z.string().optional(),
    // Task step fields
    taskTitle: z.string().optional(),
    taskDescription: z.string().optional(),
    // AI personalization
    useAiPersonalization: z.boolean().default(false),
    aiPrompt: z.string().optional(),
  })).optional(),
})

// GET /api/sequences - List all sequences
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    // Mock response - replace with actual database query
    const sequences = [
      {
        id: 'seq_1',
        name: 'Welcome Sequence',
        description: 'Onboard new leads with a 5-part email series',
        status: 'ACTIVE',
        triggerType: 'FORM_SUBMISSION',
        stepsCount: 5,
        enrolledCount: 234,
        completedCount: 156,
        metrics: {
          openRate: 68,
          replyRate: 12,
          conversionRate: 8.5,
        },
        createdAt: '2026-01-10T10:00:00Z',
        updatedAt: '2026-02-25T14:00:00Z',
      },
      {
        id: 'seq_2',
        name: 'Demo Follow-up',
        description: "Nurture leads who attended a demo but haven't converted",
        status: 'ACTIVE',
        triggerType: 'MANUAL',
        stepsCount: 4,
        enrolledCount: 89,
        completedCount: 45,
        metrics: {
          openRate: 72,
          replyRate: 18,
          conversionRate: 12.3,
        },
        createdAt: '2026-01-20T10:00:00Z',
        updatedAt: '2026-02-20T14:00:00Z',
      },
      {
        id: 'seq_3',
        name: 'Cold Outreach - HR Managers',
        description: 'Multi-channel outreach targeting HR managers',
        status: 'PAUSED',
        triggerType: 'MANUAL',
        stepsCount: 7,
        enrolledCount: 567,
        completedCount: 234,
        metrics: {
          openRate: 45,
          replyRate: 8,
          conversionRate: 4.2,
        },
        createdAt: '2026-02-01T10:00:00Z',
        updatedAt: '2026-02-15T14:00:00Z',
      },
    ]

    // Filter by status if provided
    const filteredSequences = status
      ? sequences.filter((s) => s.status === status.toUpperCase())
      : sequences

    return NextResponse.json({ data: filteredSequences })
  } catch (error) {
    console.error('Error fetching sequences:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sequences' },
      { status: 500 }
    )
  }
}

// POST /api/sequences - Create a new sequence
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validatedData = createSequenceSchema.parse(body)

    // Mock response - replace with actual database insert
    const newSequence = {
      id: `seq_${Date.now()}`,
      ...validatedData,
      status: 'DRAFT',
      stepsCount: validatedData.steps?.length || 0,
      enrolledCount: 0,
      completedCount: 0,
      metrics: {
        openRate: 0,
        replyRate: 0,
        conversionRate: 0,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    return NextResponse.json(
      { data: newSequence, message: 'Sequence created successfully' },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error creating sequence:', error)
    return NextResponse.json(
      { error: 'Failed to create sequence' },
      { status: 500 }
    )
  }
}
