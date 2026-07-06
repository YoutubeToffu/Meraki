import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getRequiredSession, handleAuthError } from '@/lib/auth-helpers'

const fieldSchema = z.object({
  id: z.string(),
  type: z.enum(['text', 'email', 'tel', 'textarea', 'select', 'checkbox']),
  label: z.string(),
  placeholder: z.string().optional(),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(), // for select
  mapTo: z.string().optional(), // 'firstName','lastName','email','company','jobTitle','phone','message'
})

const createSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(2).max(60).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only'),
  fields: z.array(fieldSchema).min(1),
  settings: z.object({
    submitButtonText: z.string().default('Submit'),
    successMessage: z.string().default('Thank you! We\'ll be in touch soon.'),
    redirectUrl: z.string().url().optional().nullable(),
    autoSequenceId: z.string().optional().nullable(),
    autoTags: z.array(z.string()).default([]),
    notifyEmail: z.string().email().optional().nullable(),
  }).optional(),
  theme: z.object({
    primaryColor: z.string().default('#2563eb'),
    fontFamily: z.string().default('Inter'),
    borderRadius: z.string().default('8px'),
  }).optional(),
})

const updateSchema = createSchema.partial().extend({ id: z.string() })

// GET /api/forms — list all forms for org
export async function GET(request: Request) {
  try {
    const session = await getRequiredSession()
    const orgId = (session.user as any).organizationId

    const forms = await prisma.leadForm.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ data: forms })
  } catch (error) {
    try { return handleAuthError(error) } catch {}
    return NextResponse.json({ error: 'Failed to fetch forms' }, { status: 500 })
  }
}

// POST /api/forms — create form
export async function POST(request: Request) {
  try {
    const session = await getRequiredSession()
    const orgId = (session.user as any).organizationId

    const body = await request.json()
    const data = createSchema.parse(body)

    // Check slug uniqueness
    const existing = await prisma.leadForm.findUnique({
      where: { organizationId_slug: { organizationId: orgId, slug: data.slug } },
    })
    if (existing) {
      return NextResponse.json({ error: 'Slug already in use. Choose a different one.' }, { status: 409 })
    }

    const form = await prisma.leadForm.create({
      data: {
        name: data.name,
        slug: data.slug,
        fields: data.fields as any,
        settings: (data.settings ?? {
          submitButtonText: 'Submit',
          successMessage: "Thank you! We'll be in touch soon.",
          autoTags: [],
        }) as any,
        theme: (data.theme ?? { primaryColor: '#2563eb', fontFamily: 'Inter', borderRadius: '8px' }) as any,
        autoTags: (data.settings?.autoTags ?? []),
        autoSequenceId: data.settings?.autoSequenceId ?? null,
        isActive: true,
        organizationId: orgId,
      },
    })

    return NextResponse.json({ data: form, message: 'Form created' }, { status: 201 })
  } catch (error) {
    try { return handleAuthError(error) } catch {}
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
    console.error('Error creating form:', error)
    return NextResponse.json({ error: 'Failed to create form' }, { status: 500 })
  }
}

// PATCH /api/forms — update form
export async function PATCH(request: Request) {
  try {
    const session = await getRequiredSession()
    const orgId = (session.user as any).organizationId

    const body = await request.json()
    const data = updateSchema.parse(body)

    const existing = await prisma.leadForm.findFirst({ where: { id: data.id, organizationId: orgId } })
    if (!existing) return NextResponse.json({ error: 'Form not found' }, { status: 404 })

    const updated = await prisma.leadForm.update({
      where: { id: data.id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.fields && { fields: data.fields as any }),
        ...(data.settings && { settings: data.settings as any, autoTags: data.settings.autoTags ?? [], autoSequenceId: data.settings.autoSequenceId ?? null }),
        ...(data.theme && { theme: data.theme as any }),
        ...(data.slug && data.slug !== existing.slug && { slug: data.slug }),
      },
    })

    return NextResponse.json({ data: updated, message: 'Form updated' })
  } catch (error) {
    try { return handleAuthError(error) } catch {}
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
    return NextResponse.json({ error: 'Failed to update form' }, { status: 500 })
  }
}

// DELETE /api/forms
export async function DELETE(request: Request) {
  try {
    const session = await getRequiredSession()
    const orgId = (session.user as any).organizationId

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const existing = await prisma.leadForm.findFirst({ where: { id, organizationId: orgId } })
    if (!existing) return NextResponse.json({ error: 'Form not found' }, { status: 404 })

    await prisma.leadForm.delete({ where: { id } })
    return NextResponse.json({ message: 'Form deleted' })
  } catch (error) {
    try { return handleAuthError(error) } catch {}
    return NextResponse.json({ error: 'Failed to delete form' }, { status: 500 })
  }
}
