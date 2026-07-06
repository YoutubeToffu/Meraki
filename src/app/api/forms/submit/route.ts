import { NextResponse } from 'next/server'
import { z } from 'zod'

const formSubmissionSchema = z.object({
  formId: z.string().min(1),
  data: z.record(z.string(), z.any()),
  metadata: z.object({
    referrer: z.string().optional(),
    userAgent: z.string().optional(),
    ip: z.string().optional(),
    timestamp: z.string().optional(),
  }).optional(),
})

// POST /api/forms/submit — Public: creates/updates a Lead from a form submission
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validated = formSubmissionSchema.parse(body)
    const { prisma } = await import('@/lib/prisma')

    // Load form to get orgId + settings
    const form = await prisma.leadForm.findFirst({
      where: { id: validated.formId, isActive: true },
    })
    if (!form) {
      return NextResponse.json({ error: 'Form not found or inactive' }, { status: 404 })
    }

    const settings = (form.settings as any) ?? {}
    const fields = (form.fields as any[]) ?? []
    const fieldData = validated.data

    // Map submitted values to lead fields via mapTo
    const mapped: Record<string, string> = {}
    for (const field of fields) {
      const val = fieldData[field.id] ?? fieldData[field.label] ?? null
      if (val && field.mapTo) mapped[field.mapTo] = String(val).trim()
    }

    const email = mapped.email || fieldData.email || fieldData.Email
    if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 })

    // Upsert lead
    const lead = await prisma.lead.upsert({
      where: { email_organizationId: { email: String(email).toLowerCase().trim(), organizationId: form.organizationId } },
      update: {
        ...(mapped.firstName && { firstName: mapped.firstName }),
        ...(mapped.lastName && { lastName: mapped.lastName }),
        ...(mapped.company && { company: mapped.company }),
        ...(mapped.jobTitle && { jobTitle: mapped.jobTitle }),
        ...(mapped.phone && { phone: mapped.phone }),
        customFields: { ...fieldData, lastFormSubmission: new Date().toISOString() },
      },
      create: {
        email: String(email).toLowerCase().trim(),
        firstName: mapped.firstName ?? null,
        lastName: mapped.lastName ?? null,
        company: mapped.company ?? null,
        jobTitle: mapped.jobTitle ?? null,
        phone: mapped.phone ?? null,
        source: 'WEBSITE_FORM',
        sourceDetail: `Form: ${form.name}`,
        status: 'NEW',
        score: 15,
        tags: form.autoTags ?? [],
        customFields: fieldData as any,
        organizationId: form.organizationId,
      },
    })

    // Log activity
    await prisma.activity.create({
      data: { type: 'FORM_SUBMITTED', title: `Form submission: ${form.name}`, leadId: lead.id },
    }).catch(() => {})

    // Increment submission counter
    await prisma.leadForm.update({ where: { id: form.id }, data: { submissions: { increment: 1 } } }).catch(() => {})

    // Auto-enroll in sequence if configured
    if (form.autoSequenceId) {
      const seq = await prisma.sequence.findFirst({
        where: { id: form.autoSequenceId, status: 'ACTIVE' },
        include: { steps: { orderBy: { order: 'asc' }, take: 1 } },
      })
      if (seq) {
        const delay = seq.steps[0] ? (seq.steps[0].delayDays * 86400000 + seq.steps[0].delayHours * 3600000) : 0
        await prisma.sequenceEnrollment.upsert({
          where: { leadId_sequenceId: { leadId: lead.id, sequenceId: seq.id } },
          update: {},
          create: { leadId: lead.id, sequenceId: seq.id, status: 'ACTIVE', currentStep: 0, nextStepAt: new Date(Date.now() + delay) },
        }).catch(() => {})
      }
    }

    return NextResponse.json(
      { success: true, message: settings.successMessage ?? 'Thank you! We\'ll be in touch soon.', data: { leadId: lead.id } },
      { status: 201, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } }
    )
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
    console.error('Form submission error:', error)
    return NextResponse.json({ error: 'Submission failed' }, { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } } as any)
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } })
}
