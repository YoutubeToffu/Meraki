import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getRequiredSession, handleAuthError } from '@/lib/auth-helpers'

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
  exitOnReply: z.boolean().default(true),
  exitOnMeeting: z.boolean().default(false),
  sendWindowStart: z.number().min(0).max(23).nullable().default(null),
  sendWindowEnd: z.number().min(0).max(23).nullable().default(null),
  sendTimezone: z.string().default('America/New_York'),
  sendDays: z.array(z.number().min(0).max(6)).default([1, 2, 3, 4, 5]),
  dailySendLimit: z.number().min(1).max(10000).default(100),
  steps: z.array(z.object({
    type: z.enum(['EMAIL', 'LINKEDIN', 'TASK', 'WAIT', 'CONDITION']),
    delayDays: z.number().default(0),
    delayHours: z.number().default(0),
    subject: z.string().optional(),
    body: z.string().optional(),
    templateId: z.string().optional(),
    linkedinAction: z.enum(['CONNECT', 'MESSAGE', 'VIEW_PROFILE', 'FOLLOW']).optional(),
    linkedinMessage: z.string().optional(),
    taskTitle: z.string().optional(),
    taskDescription: z.string().optional(),
    useAiPersonalization: z.boolean().default(false),
    aiPrompt: z.string().optional(),
  })).optional(),
})

// GET /api/sequences
export async function GET(request: Request) {
  try {
    const session = await getRequiredSession()
    const orgId = (session.user as any).organizationId

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const where: any = { organizationId: orgId }
    if (status) where.status = status.toUpperCase()

    const sequences = await prisma.sequence.findMany({
      where,
      include: {
        steps: { orderBy: { order: 'asc' } },
        enrollments: { select: { id: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const data = sequences.map((seq) => ({
      id: seq.id,
      name: seq.name,
      description: seq.description,
      status: seq.status,
      triggerType: seq.triggerType,
      exitOnReply: seq.exitOnReply,
      exitOnMeeting: seq.exitOnMeeting,
      sendWindowStart: seq.sendWindowStart,
      sendWindowEnd: seq.sendWindowEnd,
      sendTimezone: seq.sendTimezone,
      sendDays: seq.sendDays,
      dailySendLimit: seq.dailySendLimit,
      stepsCount: seq.steps.length,
      enrolledCount: seq.enrollments.length,
      completedCount: seq.enrollments.filter((e) => e.status === 'COMPLETED').length,
      steps: seq.steps,
      createdAt: seq.createdAt.toISOString(),
      updatedAt: seq.updatedAt.toISOString(),
    }))

    return NextResponse.json({ data })
  } catch (error) {
    try { return handleAuthError(error) } catch {}
    console.error('Error fetching sequences:', error)
    return NextResponse.json({ error: 'Failed to fetch sequences' }, { status: 500 })
  }
}

// POST /api/sequences
export async function POST(request: Request) {
  try {
    const session = await getRequiredSession()
    const orgId = (session.user as any).organizationId

    const body = await request.json()
    const validatedData = createSequenceSchema.parse(body)

    const sequence = await prisma.sequence.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        triggerType: validatedData.triggerType,
        exitOnReply: validatedData.exitOnReply,
        exitOnMeeting: validatedData.exitOnMeeting,
        sendWindowStart: validatedData.sendWindowStart,
        sendWindowEnd: validatedData.sendWindowEnd,
        sendTimezone: validatedData.sendTimezone,
        sendDays: validatedData.sendDays,
        dailySendLimit: validatedData.dailySendLimit,
        organizationId: orgId,
        steps: validatedData.steps
          ? {
              create: validatedData.steps.map((step, i) => ({
                order: i + 1,
                type: step.type,
                delayDays: step.delayDays,
                delayHours: step.delayHours,
                subject: step.subject,
                body: step.body,
                templateId: step.templateId,
                linkedinAction: step.linkedinAction,
                linkedinMessage: step.linkedinMessage,
                taskTitle: step.taskTitle,
                taskDescription: step.taskDescription,
                useAiPersonalization: step.useAiPersonalization,
                aiPrompt: step.aiPrompt,
              })),
            }
          : undefined,
      },
      include: { steps: { orderBy: { order: 'asc' } } },
    })

    return NextResponse.json(
      { data: sequence, message: 'Sequence created successfully' },
      { status: 201 }
    )
  } catch (error) {
    try { return handleAuthError(error) } catch {}
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error creating sequence:', error)
    return NextResponse.json({ error: 'Failed to create sequence' }, { status: 500 })
  }
}

const patchSequenceSchema = z.object({
  id: z.string().min(1),
  status: z.enum(['ACTIVE', 'PAUSED', 'DRAFT', 'ARCHIVED']),
})

const editSequenceSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  triggerType: z.enum([
    'MANUAL', 'FORM_SUBMISSION', 'TAG_ADDED', 'STAGE_CHANGED', 'SCORE_THRESHOLD', 'API',
  ]).optional(),
  exitOnReply: z.boolean().optional(),
  exitOnMeeting: z.boolean().optional(),
  sendWindowStart: z.number().min(0).max(23).nullable().optional(),
  sendWindowEnd: z.number().min(0).max(23).nullable().optional(),
  sendTimezone: z.string().optional(),
  sendDays: z.array(z.number().min(0).max(6)).optional(),
  dailySendLimit: z.number().min(1).max(10000).optional(),
  steps: z.array(z.object({
    type: z.enum(['EMAIL', 'LINKEDIN', 'TASK', 'WAIT', 'CONDITION']),
    delayDays: z.number().default(0),
    delayHours: z.number().default(0),
    subject: z.string().optional(),
    body: z.string().optional(),
    templateId: z.string().optional(),
    linkedinAction: z.enum(['CONNECT', 'MESSAGE', 'VIEW_PROFILE', 'FOLLOW']).optional(),
    linkedinMessage: z.string().optional(),
    taskTitle: z.string().optional(),
    taskDescription: z.string().optional(),
    useAiPersonalization: z.boolean().default(false),
    aiPrompt: z.string().optional(),
  })).optional(),
})

// PATCH /api/sequences - Update sequence status
export async function PATCH(request: Request) {
  try {
    const session = await getRequiredSession()
    const orgId = (session.user as any).organizationId

    const body = await request.json()
    const { id, status } = patchSequenceSchema.parse(body)

    const seq = await prisma.sequence.findFirst({ where: { id, organizationId: orgId } })
    if (!seq) return NextResponse.json({ error: 'Sequence not found' }, { status: 404 })

    // Validate state transitions
    const validTransitions: Record<string, string[]> = {
      DRAFT: ['ACTIVE', 'ARCHIVED'],
      ACTIVE: ['PAUSED', 'ARCHIVED'],
      PAUSED: ['ACTIVE', 'ARCHIVED'],
      ARCHIVED: ['DRAFT'],
    }
    if (!validTransitions[seq.status]?.includes(status)) {
      return NextResponse.json(
        { error: `Cannot transition from ${seq.status} to ${status}` },
        { status: 400 }
      )
    }

    const updated = await prisma.sequence.update({
      where: { id },
      data: { status },
    })

    return NextResponse.json({ data: updated, message: `Sequence ${status.toLowerCase()}` })
  } catch (error) {
    try { return handleAuthError(error) } catch {}
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 })
    }
    console.error('Error updating sequence:', error)
    return NextResponse.json({ error: 'Failed to update sequence' }, { status: 500 })
  }
}

// PUT /api/sequences - Edit sequence details and steps
export async function PUT(request: Request) {
  try {
    const session = await getRequiredSession()
    const orgId = (session.user as any).organizationId

    const body = await request.json()
    const { id, ...updates } = body
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const seq = await prisma.sequence.findFirst({ where: { id, organizationId: orgId } })
    if (!seq) return NextResponse.json({ error: 'Sequence not found' }, { status: 404 })

    // Prevent editing active sequences with enrollments
    if (seq.status === 'ACTIVE') {
      const activeEnrollments = await prisma.sequenceEnrollment.count({
        where: { sequenceId: id, status: 'ACTIVE' },
      })
      if (activeEnrollments > 0 && updates.steps) {
        return NextResponse.json(
          { error: 'Cannot edit steps of an active sequence with active enrollments. Pause the sequence first.' },
          { status: 400 }
        )
      }
    }

    const validated = editSequenceSchema.parse(updates)
    const { steps, ...sequenceFields } = validated

    const updated = await prisma.$transaction(async (tx) => {
      // Update sequence fields
      const updatedSeq = await tx.sequence.update({
        where: { id },
        data: sequenceFields,
      })

      // Replace steps if provided
      if (steps) {
        await tx.sequenceStep.deleteMany({ where: { sequenceId: id } })
        await tx.sequenceStep.createMany({
          data: steps.map((step, i) => ({
            sequenceId: id,
            order: i + 1,
            type: step.type,
            delayDays: step.delayDays,
            delayHours: step.delayHours,
            subject: step.subject,
            body: step.body,
            templateId: step.templateId,
            linkedinAction: step.linkedinAction,
            linkedinMessage: step.linkedinMessage,
            taskTitle: step.taskTitle,
            taskDescription: step.taskDescription,
            useAiPersonalization: step.useAiPersonalization,
            aiPrompt: step.aiPrompt,
          })),
        })
      }

      return tx.sequence.findUnique({
        where: { id },
        include: { steps: { orderBy: { order: 'asc' } } },
      })
    })

    return NextResponse.json({ data: updated, message: 'Sequence updated' })
  } catch (error) {
    try { return handleAuthError(error) } catch {}
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 })
    }
    console.error('Error editing sequence:', error)
    return NextResponse.json({ error: 'Failed to edit sequence' }, { status: 500 })
  }
}

// DELETE /api/sequences - Delete/archive a sequence
export async function DELETE(request: Request) {
  try {
    const session = await getRequiredSession()
    const orgId = (session.user as any).organizationId

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const seq = await prisma.sequence.findFirst({ where: { id, organizationId: orgId } })
    if (!seq) return NextResponse.json({ error: 'Sequence not found' }, { status: 404 })

    // Check for active enrollments — archive instead of delete
    const activeEnrollments = await prisma.sequenceEnrollment.count({
      where: { sequenceId: id, status: 'ACTIVE' },
    })

    if (activeEnrollments > 0) {
      await prisma.sequence.update({
        where: { id },
        data: { status: 'ARCHIVED' },
      })
      return NextResponse.json({
        message: `Sequence archived (${activeEnrollments} active enrollments remain). Pause or remove enrollments first to fully delete.`,
      })
    }

    // Safe to delete — remove steps and enrollments first
    await prisma.$transaction([
      prisma.sequenceStep.deleteMany({ where: { sequenceId: id } }),
      prisma.sequenceEnrollment.deleteMany({ where: { sequenceId: id } }),
      prisma.sequence.delete({ where: { id } }),
    ])

    return NextResponse.json({ message: 'Sequence deleted' })
  } catch (error) {
    try { return handleAuthError(error) } catch {}
    console.error('Error deleting sequence:', error)
    return NextResponse.json({ error: 'Failed to delete sequence' }, { status: 500 })
  }
}
