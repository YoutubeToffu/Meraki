import { NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { getRequiredSession, handleAuthError } from '@/lib/auth-helpers'

export const dynamic = 'force-dynamic'

const createTemplateSchema = z.object({
  name: z.string().min(1),
  subject: z.string().min(1),
  body: z.string().min(1),
  category: z.string().optional(),
  variables: z.array(z.string()).optional(),
})

// GET /api/templates
export async function GET(request: Request) {
  try {
    const session = await getRequiredSession()
    const orgId = (session.user as any).organizationId

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    const where: any = { organizationId: orgId }
    if (category) where.category = category

    const templates = await prisma.emailTemplate.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json({ data: templates })
  } catch (error) {
    try { return handleAuthError(error) } catch {}
    console.error('Error fetching templates:', error)
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
  }
}

// POST /api/templates
export async function POST(request: Request) {
  try {
    const session = await getRequiredSession()
    const orgId = (session.user as any).organizationId

    const body = await request.json()
    const validatedData = createTemplateSchema.parse(body)

    const template = await prisma.emailTemplate.create({
      data: {
        ...validatedData,
        variables: validatedData.variables || [],
        organizationId: orgId,
      },
    })

    return NextResponse.json({ data: template, message: 'Template created' }, { status: 201 })
  } catch (error) {
    try { return handleAuthError(error) } catch {}
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 })
    }
    console.error('Error creating template:', error)
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 })
  }
}
