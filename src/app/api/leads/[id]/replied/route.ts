import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getRequiredSession, handleAuthError } from '@/lib/auth-helpers'

export const dynamic = 'force-dynamic'

// POST /api/leads/[id]/replied — Mark a lead as having replied and stop its automated outreach
export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getRequiredSession()
    const orgId = (session.user as any).organizationId
    const userId = (session.user as any).id

    const lead = await prisma.lead.findFirst({
      where: { id: params.id, organizationId: orgId },
      select: { id: true },
    })
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    const now = new Date()

    const result = await prisma.$transaction(async (tx) => {
      const lastSent = await tx.email.findFirst({
        where: { leadId: lead.id, sentAt: { not: null }, repliedAt: null },
        orderBy: { sentAt: 'desc' },
        select: { id: true, subject: true },
      })
      if (lastSent) {
        await tx.email.update({
          where: { id: lastSent.id },
          data: { repliedAt: now, status: 'REPLIED' },
        })
      }

      // Only sequences with exitOnReply enabled are stopped
      const enrollments = await tx.sequenceEnrollment.updateMany({
        where: {
          leadId: lead.id,
          status: { in: ['ACTIVE', 'PAUSED'] },
          sequence: { organizationId: orgId, exitOnReply: true },
        },
        data: { status: 'COMPLETED', completedAt: now, nextStepAt: null, lockedAt: null },
      })

      const outreaches = await tx.aiOutreach.updateMany({
        where: {
          leadId: lead.id,
          status: { in: ['PENDING', 'ACTIVE', 'PAUSED'] },
          aiCampaign: { organizationId: orgId },
        },
        data: {
          status: 'STOPPED',
          stoppedReason: 'REPLIED',
          nextActionAt: null,
          resumeAt: null,
          totalReplied: { increment: 1 },
        },
      })

      await tx.activity.create({
        data: {
          type: 'EMAIL_REPLIED',
          title: lastSent ? `Replied: ${lastSent.subject}` : 'Lead replied',
          description: 'Marked as replied manually. Automated sequence steps were stopped.',
          leadId: lead.id,
          userId,
        },
      })

      return { sequencesStopped: enrollments.count, campaignsStopped: outreaches.count }
    })

    return NextResponse.json({
      message: 'Marked as replied. Automated outreach stopped.',
      ...result,
    })
  } catch (error) {
    try { return handleAuthError(error) } catch {}
    console.error('Error marking lead as replied:', error)
    return NextResponse.json({ error: 'Failed to mark lead as replied' }, { status: 500 })
  }
}
