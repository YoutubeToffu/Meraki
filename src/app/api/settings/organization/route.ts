import { NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { getRequiredSession, handleAuthError } from '@/lib/auth-helpers'

export const dynamic = 'force-dynamic'

const updateOrganizationSchema = z.object({
  name: z.string().trim().min(2, 'Organization name must be at least 2 characters').max(100),
  domain: z.string().trim().max(255).optional().or(z.literal('')).nullable(),
  logo: z.string().trim().url('Logo must be a valid URL').optional().or(z.literal('')).nullable(),
})

function canManageOrganization(role: string | undefined) {
  return role === 'OWNER' || role === 'ADMIN'
}

export async function GET() {
  try {
    const session = await getRequiredSession()
    const orgId = (session.user as any).organizationId

    const [organization, teamMembers, leadCount] = await Promise.all([
      prisma.organization.findUnique({
        where: { id: orgId },
        select: {
          id: true,
          name: true,
          slug: true,
          domain: true,
          logo: true,
          plan: true,
          aiCredits: true,
        },
      }),
      prisma.user.count({ where: { organizationId: orgId } }),
      prisma.lead.count({ where: { organizationId: orgId } }),
    ])

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    return NextResponse.json({
      data: {
        ...organization,
        usage: {
          teamMembers,
          leads: leadCount,
          aiCredits: organization.aiCredits,
        },
      },
    })
  } catch (error) {
    try { return handleAuthError(error) } catch {}
    console.error('Error fetching organization settings:', error)
    return NextResponse.json({ error: 'Failed to fetch organization settings' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getRequiredSession()
    const orgId = (session.user as any).organizationId
    const role = (session.user as any).role as string | undefined

    if (!canManageOrganization(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const data = updateOrganizationSchema.parse(body)

    const organization = await prisma.organization.update({
      where: { id: orgId },
      data: {
        name: data.name,
        domain: data.domain || null,
        logo: data.logo || null,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        domain: true,
        logo: true,
        plan: true,
        aiCredits: true,
      },
    })

    const [teamMembers, leadCount] = await Promise.all([
      prisma.user.count({ where: { organizationId: orgId } }),
      prisma.lead.count({ where: { organizationId: orgId } }),
    ])

    return NextResponse.json({
      data: {
        ...organization,
        usage: {
          teamMembers,
          leads: leadCount,
          aiCredits: organization.aiCredits,
        },
      },
      message: 'Organization settings updated successfully',
    })
  } catch (error) {
    try { return handleAuthError(error) } catch {}
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error updating organization settings:', error)
    return NextResponse.json({ error: 'Failed to update organization settings' }, { status: 500 })
  }
}
