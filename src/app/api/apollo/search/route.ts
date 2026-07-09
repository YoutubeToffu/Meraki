import { NextResponse } from 'next/server'
import { getRequiredSession, handleAuthError } from '@/lib/auth-helpers'

export const dynamic = 'force-dynamic'

// POST /api/apollo/search
// Proxies Apollo.io People Search API
// Body: { jobTitles?, companies?, locations?, industries?, keywords?, page? }
export async function POST(request: Request) {
  try {
    await getRequiredSession()
  } catch (e) {
    return handleAuthError(e)
  }

  const apiKey = process.env.APOLLO_API_KEY
  if (!apiKey || apiKey === 'your-apollo-api-key') {
    return NextResponse.json(
      { error: 'Apollo API key not configured. Add APOLLO_API_KEY to your .env file.' },
      { status: 503 }
    )
  }

  const body = await request.json()
  const {
    jobTitles = [],
    companies = [],
    locations = [],
    industries = [],
    keywords = '',
    page = 1,
    perPage = 25,
  } = body

  // Build Apollo People Search payload
  const apolloPayload: Record<string, any> = {
    page,
    per_page: Math.min(perPage, 50),
    person_titles: jobTitles,
    organization_locations: locations,
    q_organization_domains_or_names: companies,
    organization_industry_tag_ids: industries,
  }
  if (keywords) apolloPayload.q_keywords = keywords

  const res = await fetch('https://api.apollo.io/api/v1/mixed_people/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'X-Api-Key': apiKey,
    },
    body: JSON.stringify(apolloPayload),
  })

  if (!res.ok) {
    const errText = await res.text()
    console.error('[Apollo] search error', res.status, errText)
    return NextResponse.json(
      { error: `Apollo API error: ${res.status}` },
      { status: res.status }
    )
  }

  const data = await res.json()

  // Normalize Apollo people into lead-friendly shape
  const people = (data.people ?? []).map((p: any) => ({
    apolloId: p.id,
    firstName: p.first_name ?? '',
    lastName: p.last_name ?? '',
    email: p.email ?? null,
    emailStatus: p.email_status ?? 'unknown', // verified, unverified, invalid, etc.
    jobTitle: p.title ?? '',
    company: p.organization?.name ?? p.employment_history?.[0]?.organization_name ?? '',
    companyDomain: p.organization?.primary_domain ?? '',
    companySize: p.organization?.estimated_num_employees ?? null,
    companyIndustry: p.organization?.industry ?? '',
    linkedinUrl: p.linkedin_url ?? null,
    location: [p.city, p.state, p.country].filter(Boolean).join(', '),
    photo: p.photo_url ?? null,
  }))

  return NextResponse.json({
    people,
    pagination: {
      page: data.pagination?.page ?? page,
      perPage: data.pagination?.per_page ?? perPage,
      totalEntries: data.pagination?.total_entries ?? 0,
      totalPages: data.pagination?.total_pages ?? 0,
    },
  })
}
