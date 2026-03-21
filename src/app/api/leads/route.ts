import { NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { getRequiredSession, handleAuthError } from '@/lib/auth-helpers'

// Validation schema for creating a lead
const createLeadSchema = z.object({
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  company: z.string().optional(),
  jobTitle: z.string().optional(),
  phone: z.string().optional(),
  linkedinUrl: z.string().url().optional(),
  website: z.string().url().optional(),
  source: z.enum([
    'MANUAL',
    'LINKEDIN',
    'WEBSITE_FORM',
    'EMAIL_CAMPAIGN',
    'REFERRAL',
    'COLD_OUTREACH',
    'INBOUND',
    'EVENT',
    'API',
  ]).default('MANUAL'),
  tags: z.array(z.string()).optional(),
  customFields: z.record(z.string(), z.any()).optional(),
})

// GET /api/leads - Get all leads with filtering
export async function GET(request: Request) {
  try {
    const session = await getRequiredSession()
    const orgId = (session.user as any).organizationId

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')))
    const status = searchParams.get('status')
    const source = searchParams.get('source')
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc'

    const where: any = { organizationId: orgId }

    if (status) where.status = status
    if (source) where.source = source
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
      ]
    }

    const allowedSortFields = ['createdAt', 'updatedAt', 'score', 'firstName', 'lastName', 'company']
    const orderField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt'

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        orderBy: { [orderField]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          assignedTo: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.lead.count({ where }),
    ])

    return NextResponse.json({
      data: leads,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    try { return handleAuthError(error) } catch {}
    console.error('Error fetching leads:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leads' },
      { status: 500 }
    )
  }
}

// POST /api/leads - Create a new lead
export async function POST(request: Request) {
  try {
    const session = await getRequiredSession()
    const orgId = (session.user as any).organizationId
    const userId = (session.user as any).id

    const body = await request.json()
    const validatedData = createLeadSchema.parse(body)

    const lead = await prisma.lead.create({
      data: {
        ...validatedData,
        tags: validatedData.tags || [],
        organizationId: orgId,
      },
    })

    // Log activity
    await prisma.activity.create({
      data: {
        type: 'NOTE_ADDED',
        title: 'Lead created',
        description: `Lead ${validatedData.firstName || ''} ${validatedData.lastName || ''} (${validatedData.email}) was added`,
        leadId: lead.id,
        userId,
      },
    })

    return NextResponse.json(
      { data: lead, message: 'Lead created successfully' },
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
    console.error('Error creating lead:', error)
    return NextResponse.json(
      { error: 'Failed to create lead' },
      { status: 500 }
    )
  }
}
