import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getRequiredSession, handleAuthError } from '@/lib/auth-helpers'

export const dynamic = 'force-dynamic'

const enrollSchema = z.object({
  sequenceId: z.string().min(1),
  leadIds: z.array(z.string().min(1)).min(1),
})

// POST /api/sequences/enroll â€” Enroll leads into a sequence
export async function POST(request: Request) {
  try {
    const session = await getRequiredSession()
    const orgId = (session.user as any).organizationId

    const body = await request.json()
    const { sequenceId, leadIds } = enrollSchema.parse(body)

    // Verify sequence belongs to org
    const sequence = await prisma.sequence.findFirst({
      where: { id: sequenceId, organizationId: orgId },
      include: {
        steps: { orderBy: { order: 'asc' }, take: 1 },
      },
    })
    if (!sequence) {
      return NextResponse.json({ error: 'Sequence not found' }, { status: 404 })
    }

    // Verify leads belong to org
    const leads = await prisma.lead.findMany({
      where: { id: { in: leadIds }, organizationId: orgId },
      select: { id: true, firstName: true, lastName: true, email: true },
    })
    if (leads.length === 0) {
      return NextResponse.json({ error: 'No valid leads found' }, { status: 400 })
    }

    // Check existing enrollments to avoid duplicates
    const existing = await prisma.sequenceEnrollment.findMany({
      where: {
        sequenceId,
        leadId: { in: leads.map((l) => l.id) },
      },
      select: { leadId: true },
    })
    const existingIds = new Set(existing.map((e) => e.leadId))
    const newLeads = leads.filter((l) => !existingIds.has(l.id))

    if (newLeads.length === 0) {
      return NextResponse.json({
        message: 'All selected leads are already enrolled in this sequence',
        enrolled: 0,
        skipped: leads.length,
      })
    }

    // Calculate when the first step should execute
    const firstStep = sequence.steps[0]
    const now = new Date()
    let nextStepAt = now // Execute immediately if no delay
    if (firstStep) {
      const delayMs =
        (firstStep.delayDays * 24 * 60 * 60 * 1000) +
        (firstStep.delayHours * 60 * 60 * 1000)
      if (delayMs > 0) {
        nextStepAt = new Date(now.getTime() + delayMs)
      }
    }

    // Create enrollments
    await prisma.sequenceEnrollment.createMany({
      data: newLeads.map((lead) => ({
        sequenceId,
        leadId: lead.id,
        status: sequence.status === 'ACTIVE' ? 'ACTIVE' : 'PAUSED',
        currentStep: 0,
        nextStepAt: sequence.status === 'ACTIVE' ? nextStepAt : null,
      })),
    })

    // Log activity for each enrolled lead
    const userId = (session.user as any).id
    await prisma.activity.createMany({
      data: newLeads.map((lead) => ({
        type: 'NOTE_ADDED' as const,
        title: `Enrolled in sequence: ${sequence.name}`,
        leadId: lead.id,
        userId,
      })),
    })

    return NextResponse.json({
      message: `${newLeads.length} lead(s) enrolled in "${sequence.name}"`,
      enrolled: newLeads.length,
      skipped: existingIds.size,
    })
  } catch (error) {
    try { return handleAuthError(error) } catch {}
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error enrolling leads:', error)
    return NextResponse.json({ error: 'Failed to enroll leads' }, { status: 500 })
  }
}

// GET /api/sequences/enroll?sequenceId=xxx â€” List enrollments for a sequence
export async function GET(request: Request) {
  try {
    const session = await getRequiredSession()
    const orgId = (session.user as any).organizationId

    const { searchParams } = new URL(request.url)
    const sequenceId = searchParams.get('sequenceId')
    if (!sequenceId) {
      return NextResponse.json({ error: 'sequenceId required' }, { status: 400 })
    }

    // Verify sequence belongs to org
    const seq = await prisma.sequence.findFirst({
      where: { id: sequenceId, organizationId: orgId },
      select: { id: true, steps: { select: { id: true }, orderBy: { order: 'asc' } } },
    })
    if (!seq) return NextResponse.json({ error: 'Sequence not found' }, { status: 404 })

    const enrollments = await prisma.sequenceEnrollment.findMany({
      where: { sequenceId },
      include: {
        lead: {
          select: { id: true, firstName: true, lastName: true, email: true, status: true },
        },
      },
      orderBy: { enrolledAt: 'desc' },
    })

    const data = enrollments.map((e) => ({
      id: e.id,
      lead: e.lead,
      status: e.status,
      currentStep: e.currentStep,
      totalSteps: seq.steps.length,
      nextStepAt: e.nextStepAt?.toISOString() || null,
      completedAt: e.completedAt?.toISOString() || null,
      enrolledAt: e.enrolledAt.toISOString(),
    }))

    return NextResponse.json({ data })
  } catch (error) {
    try { return handleAuthError(error) } catch {}
    console.error('Error listing enrollments:', error)
    return NextResponse.json({ error: 'Failed to list enrollments' }, { status: 500 })
  }
}

// PATCH /api/sequences/enroll â€” Pause/resume enrollment
export async function PATCH(request: Request) {
  try {
    const session = await getRequiredSession()
    const orgId = (session.user as any).organizationId

    const { enrollmentId, action } = await request.json()
    if (!enrollmentId || !action) {
      return NextResponse.json({ error: 'enrollmentId and action required' }, { status: 400 })
    }

    if (!['pause', 'resume'].includes(action)) {
      return NextResponse.json({ error: 'action must be "pause" or "resume"' }, { status: 400 })
    }

    const enrollment = await prisma.sequenceEnrollment.findFirst({
      where: {
        id: enrollmentId,
        sequence: { organizationId: orgId },
      },
      include: {
        sequence: { include: { steps: { orderBy: { order: 'asc' } } } },
      },
    })

    if (!enrollment) return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 })

    if (action === 'pause' && enrollment.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Can only pause active enrollments' }, { status: 400 })
    }
    if (action === 'resume' && enrollment.status !== 'PAUSED') {
      return NextResponse.json({ error: 'Can only resume paused enrollments' }, { status: 400 })
    }

    const now = new Date()
    const updateData: any = {
      status: action === 'pause' ? 'PAUSED' : 'ACTIVE',
    }

    if (action === 'resume') {
      // Set nextStepAt to now so it processes on next cycle
      updateData.nextStepAt = now
    } else {
      updateData.nextStepAt = null
    }

    await prisma.sequenceEnrollment.update({
      where: { id: enrollmentId },
      data: updateData,
    })

    return NextResponse.json({ message: `Enrollment ${action}d` })
  } catch (error) {
    try { return handleAuthError(error) } catch {}
    console.error('Error updating enrollment:', error)
    return NextResponse.json({ error: 'Failed to update enrollment' }, { status: 500 })
  }
}

// DELETE /api/sequences/enroll â€” Remove a lead from a sequence
export async function DELETE(request: Request) {
  try {
    const session = await getRequiredSession()
    const orgId = (session.user as any).organizationId

    const { searchParams } = new URL(request.url)
    const enrollmentId = searchParams.get('enrollmentId')
    if (!enrollmentId) {
      return NextResponse.json({ error: 'enrollmentId required' }, { status: 400 })
    }

    const enrollment = await prisma.sequenceEnrollment.findFirst({
      where: {
        id: enrollmentId,
        sequence: { organizationId: orgId },
      },
    })

    if (!enrollment) return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 })

    await prisma.sequenceEnrollment.delete({ where: { id: enrollmentId } })

    return NextResponse.json({ message: 'Lead removed from sequence' })
  } catch (error) {
    try { return handleAuthError(error) } catch {}
    console.error('Error removing enrollment:', error)
    return NextResponse.json({ error: 'Failed to remove enrollment' }, { status: 500 })
  }
}
