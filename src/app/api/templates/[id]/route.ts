import { NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { getRequiredSession, handleAuthError } from '@/lib/auth-helpers'

const updateTemplateSchema = z.object({
  name: z.string().min(1).optional(),
  subject: z.string().min(1).optional(),
  body: z.string().min(1).optional(),
  category: z.string().optional().nullable(),
  variables: z.array(z.string()).optional(),
})

// GET /api/templates/[id]
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getRequiredSession()
    const orgId = (session.user as any).organizationId

    const template = await prisma.emailTemplate.findFirst({
      where: { id: params.id, organizationId: orgId },
    })

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    return NextResponse.json({ data: template })
  } catch (error) {
    try { return handleAuthError(error) } catch {}
    return NextResponse.json({ error: 'Failed to fetch template' }, { status: 500 })
  }
}

// PUT /api/templates/[id]
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getRequiredSession()
    const orgId = (session.user as any).organizationId

    const existing = await prisma.emailTemplate.findFirst({
      where: { id: params.id, organizationId: orgId },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    const body = await request.json()
    const validatedData = updateTemplateSchema.parse(body)

    const template = await prisma.emailTemplate.update({
      where: { id: params.id },
      data: validatedData,
    })

    return NextResponse.json({ data: template })
  } catch (error) {
    try { return handleAuthError(error) } catch {}
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 })
  }
}

// DELETE /api/templates/[id]
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getRequiredSession()
    const orgId = (session.user as any).organizationId

    const existing = await prisma.emailTemplate.findFirst({
      where: { id: params.id, organizationId: orgId },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    await prisma.emailTemplate.delete({ where: { id: params.id } })

    return NextResponse.json({ message: 'Template deleted' })
  } catch (error) {
    try { return handleAuthError(error) } catch {}
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 })
  }
}
