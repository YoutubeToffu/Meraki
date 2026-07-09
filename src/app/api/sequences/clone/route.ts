import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getRequiredSession, handleAuthError } from '@/lib/auth-helpers'

// POST /api/sequences/clone — Duplicate a sequence with all its steps
export async function POST(request: Request) {
  try {
    const session = await getRequiredSession()
    const orgId = (session.user as any).organizationId

    const { sequenceId } = await request.json()
    if (!sequenceId || typeof sequenceId !== 'string') {
      return NextResponse.json({ error: 'sequenceId is required' }, { status: 400 })
    }

    // Fetch original sequence + steps
    const original = await prisma.sequence.findFirst({
      where: { id: sequenceId, organizationId: orgId },
      include: { steps: { orderBy: { order: 'asc' } } },
    })

    if (!original) {
      return NextResponse.json({ error: 'Sequence not found' }, { status: 404 })
    }

    // Create cloned sequence as DRAFT
    const cloned = await prisma.sequence.create({
      data: {
        name: `${original.name} (Copy)`,
        description: original.description,
        status: 'DRAFT',
        triggerType: original.triggerType,
        triggerConditions: original.triggerConditions ?? undefined,
        exitOnReply: original.exitOnReply,
        exitOnMeeting: original.exitOnMeeting,
        sendWindowStart: original.sendWindowStart,
        sendWindowEnd: original.sendWindowEnd,
        sendTimezone: original.sendTimezone,
        sendDays: original.sendDays,
        dailySendLimit: original.dailySendLimit,
        organizationId: orgId,
        steps: {
          create: original.steps.map((step) => ({
            order: step.order,
            type: step.type,
            delayDays: step.delayDays,
            delayHours: step.delayHours,
            templateId: step.templateId,
            subject: step.subject,
            body: step.body,
            linkedinAction: step.linkedinAction,
            linkedinMessage: step.linkedinMessage,
            taskTitle: step.taskTitle,
            taskDescription: step.taskDescription,
            useAiPersonalization: step.useAiPersonalization,
            aiPrompt: step.aiPrompt,
            conditionType: step.conditionType,
            conditionValue: step.conditionValue,
            trueGotoStep: step.trueGotoStep,
            falseGotoStep: step.falseGotoStep,
          })),
        },
      },
      include: { steps: { orderBy: { order: 'asc' } } },
    })

    return NextResponse.json({
      data: cloned,
      message: `Cloned "${original.name}" as draft with ${original.steps.length} steps`,
    }, { status: 201 })
  } catch (error) {
    try { return handleAuthError(error) } catch {}
    console.error('Error cloning sequence:', error)
    return NextResponse.json({ error: 'Failed to clone sequence' }, { status: 500 })
  }
}
