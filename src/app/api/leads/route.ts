import { NextResponse } from 'next/server'
import { z } from 'zod'

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
  ]).default('API'),
  tags: z.array(z.string()).optional(),
  customFields: z.record(z.string(), z.any()).optional(),
})

// GET /api/leads - Get all leads with filtering
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const status = searchParams.get('status')
    const source = searchParams.get('source')
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Mock response - replace with actual database query
    const leads = [
      {
        id: 'lead_1',
        email: 'sarah.chen@techcorp.com',
        firstName: 'Sarah',
        lastName: 'Chen',
        company: 'TechCorp Inc',
        jobTitle: 'Head of Talent Acquisition',
        status: 'QUALIFIED',
        score: 85,
        source: 'LINKEDIN',
        tags: ['Enterprise', 'High Priority'],
        createdAt: '2026-02-20T10:00:00Z',
        lastContactedAt: '2026-02-27T10:30:00Z',
      },
      {
        id: 'lead_2',
        email: 'm.rodriguez@startuplabs.io',
        firstName: 'Michael',
        lastName: 'Rodriguez',
        company: 'Startup Labs',
        jobTitle: 'CEO',
        status: 'PROPOSAL',
        score: 92,
        source: 'WEBSITE_FORM',
        tags: ['Startup', 'Demo Scheduled'],
        createdAt: '2026-02-18T14:00:00Z',
        lastContactedAt: '2026-02-26T14:15:00Z',
      },
    ]

    return NextResponse.json({
      data: leads,
      pagination: {
        page,
        limit,
        total: leads.length,
        totalPages: 1,
      },
    })
  } catch (error) {
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
    const body = await request.json()
    
    // Validate request body
    const validatedData = createLeadSchema.parse(body)

    // Mock response - replace with actual database insert
    const newLead = {
      id: `lead_${Date.now()}`,
      ...validatedData,
      status: 'NEW',
      score: 0,
      stage: 'AWARENESS',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    return NextResponse.json(
      { data: newLead, message: 'Lead created successfully' },
      { status: 201 }
    )
  } catch (error) {
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
