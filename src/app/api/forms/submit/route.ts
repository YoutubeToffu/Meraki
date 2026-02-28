import { NextResponse } from 'next/server'
import { z } from 'zod'

// Schema for form submission
const formSubmissionSchema = z.object({
  formId: z.string(),
  data: z.record(z.string(), z.any()),
  metadata: z.object({
    referrer: z.string().optional(),
    userAgent: z.string().optional(),
    ip: z.string().optional(),
    timestamp: z.string().optional(),
  }).optional(),
})

// POST /api/forms/submit - Public endpoint for lead capture form submissions
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validatedData = formSubmissionSchema.parse(body)

    // Extract common fields
    const email = validatedData.data.email
    const firstName = validatedData.data.firstName || validatedData.data.first_name
    const lastName = validatedData.data.lastName || validatedData.data.last_name
    const company = validatedData.data.company || validatedData.data.companyName
    const phone = validatedData.data.phone || validatedData.data.phoneNumber

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Mock: In production, you would:
    // 1. Validate the form ID exists
    // 2. Create the lead in the database
    // 3. Trigger any auto-enrollment sequences
    // 4. Send webhook notifications if configured

    const lead = {
      id: `lead_${Date.now()}`,
      email,
      firstName,
      lastName,
      company,
      phone,
      source: 'WEBSITE_FORM',
      sourceDetail: `Form: ${validatedData.formId}`,
      status: 'NEW',
      score: 10, // Initial score for form submissions
      customFields: validatedData.data,
      metadata: validatedData.metadata,
      createdAt: new Date().toISOString(),
    }

    // Return success with CORS headers for cross-origin submissions
    return NextResponse.json(
      {
        success: true,
        message: 'Form submitted successfully',
        data: { leadId: lead.id },
      },
      {
        status: 201,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error processing form submission:', error)
    return NextResponse.json(
      { error: 'Failed to process submission' },
      { status: 500 }
    )
  }
}

// Handle CORS preflight requests
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    }
  )
}
