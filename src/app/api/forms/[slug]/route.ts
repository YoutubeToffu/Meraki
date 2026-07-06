import { NextResponse } from 'next/server'

// GET /api/forms/[slug] — public: return form config for rendering
export async function GET(
  _request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { prisma } = await import('@/lib/prisma')

    const form = await prisma.leadForm.findFirst({
      where: { slug: params.slug, isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        fields: true,
        settings: true,
        theme: true,
      },
    })

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 })
    }

    return NextResponse.json(
      { data: form },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=60',
        },
      }
    )
  } catch (error) {
    console.error('Error fetching form:', error)
    return NextResponse.json({ error: 'Failed to fetch form' }, { status: 500 })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    },
  })
}
