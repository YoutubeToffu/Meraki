import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import PublicFormClient from './client'

interface Props {
  params: { slug: string }
  searchParams: { embed?: string }
}

export default async function PublicFormPage({ params, searchParams }: Props) {
  const form = await prisma.leadForm.findFirst({
    where: { slug: params.slug, isActive: true },
    select: { id: true, name: true, slug: true, fields: true, settings: true, theme: true, organizationId: true },
  })

  if (!form) notFound()

  // Increment view counter (fire-and-forget)
  prisma.leadForm.update({ where: { id: form.id }, data: { views: { increment: 1 } } }).catch(() => {})

  const isEmbed = searchParams.embed === '1'

  return (
    <PublicFormClient
      form={form as any}
      isEmbed={isEmbed}
    />
  )
}

export async function generateMetadata({ params }: Props) {
  const form = await prisma.leadForm.findFirst({
    where: { slug: params.slug, isActive: true },
    select: { name: true },
  })
  return { title: form?.name ?? 'Form' }
}
