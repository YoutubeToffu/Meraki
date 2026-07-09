import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getRequiredSession, handleAuthError } from '@/lib/auth-helpers'
import { industryPlaybooks } from '@/lib/playbooks'

export const dynamic = 'force-dynamic'

// GET /api/templates/playbooks â€” list available playbooks with install status
export async function GET() {
  try {
    const session = await getRequiredSession()
    const orgId = (session.user as any).organizationId

    // Check which playbook templates have already been installed (by name prefix)
    const existingTemplates = await prisma.emailTemplate.findMany({
      where: { organizationId: orgId },
      select: { name: true },
    })
    const existingNames = new Set(existingTemplates.map((t) => t.name))

    const playbooks = industryPlaybooks.map((pb) => ({
      ...pb,
      templateCount: pb.templates.length,
      installedCount: pb.templates.filter((t) => existingNames.has(t.name)).length,
    }))

    return NextResponse.json({ data: playbooks })
  } catch (error) {
    try { return handleAuthError(error) } catch {}
    console.error('Error fetching playbooks:', error)
    return NextResponse.json({ error: 'Failed to fetch playbooks' }, { status: 500 })
  }
}

// POST /api/templates/playbooks â€” install a playbook's templates
export async function POST(request: Request) {
  try {
    const session = await getRequiredSession()
    const orgId = (session.user as any).organizationId

    const { playbookId } = await request.json()
    if (!playbookId || typeof playbookId !== 'string') {
      return NextResponse.json({ error: 'playbookId is required' }, { status: 400 })
    }

    const playbook = industryPlaybooks.find((p) => p.id === playbookId)
    if (!playbook) {
      return NextResponse.json({ error: 'Playbook not found' }, { status: 404 })
    }

    // Skip templates that already exist (by name)
    const existing = await prisma.emailTemplate.findMany({
      where: { organizationId: orgId, name: { in: playbook.templates.map((t) => t.name) } },
      select: { name: true },
    })
    const existingNames = new Set(existing.map((t) => t.name))

    const toCreate = playbook.templates.filter((t) => !existingNames.has(t.name))

    if (toCreate.length === 0) {
      return NextResponse.json({ message: 'All templates from this playbook are already installed', installed: 0 })
    }

    await prisma.emailTemplate.createMany({
      data: toCreate.map((t) => ({
        name: t.name,
        subject: t.subject,
        body: t.body,
        category: t.category,
        variables: t.variables,
        organizationId: orgId,
      })),
    })

    return NextResponse.json({ message: `Installed ${toCreate.length} templates`, installed: toCreate.length }, { status: 201 })
  } catch (error) {
    try { return handleAuthError(error) } catch {}
    console.error('Error installing playbook:', error)
    return NextResponse.json({ error: 'Failed to install playbook' }, { status: 500 })
  }
}
