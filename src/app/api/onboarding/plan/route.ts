import { NextResponse } from 'next/server'
import { z } from 'zod'
import OpenAI from 'openai'
import { prisma } from '@/lib/prisma'
import { getRequiredSession, handleAuthError } from '@/lib/auth-helpers'

export const dynamic = 'force-dynamic'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const answersSchema = z.object({
  answers: z.object({
    companyName: z.string().optional(),
    industry: z.string().optional(),
    productCategory: z.string().optional(),
    launchAge: z.string().optional(),
    teamSize: z.string().optional(),
    productDescription: z.string().optional(),
    coreValuePromise: z.string().optional(),
    pricing: z.string().optional(),
    primaryCTA: z.string().optional(),
    targetRole: z.string().optional(),
    targetCompanyProfile: z.string().optional(),
    corePain: z.string().optional(),
    existingCustomers: z.string().optional(),
    currentAcquisition: z.string().optional(),
    whatWorked: z.string().optional(),
    inboundTraffic: z.string().optional(),
    customerGoal: z.string().optional(),
    revenueTarget: z.string().optional(),
    urgency: z.string().optional(),
    deadline: z.string().optional(),
    preferredChannels: z.string().optional(),
    channelsToAvoid: z.string().optional(),
    outreachOwner: z.string().optional(),
  }),
  rawTranscript: z.string().optional(),
})

// POST /api/onboarding/plan â€” Generate structured growth plan from collected answers
export async function POST(request: Request) {
  try {
    const session = await getRequiredSession()
    const orgId = (session.user as any).organizationId

    const body = await request.json()
    const { answers, rawTranscript } = answersSchema.parse(body)

    const systemPrompt = `You are an expert B2B SaaS growth strategist. Based on a founder's intake answers, generate a clear, specific, and actionable customer acquisition plan.

Structure your response in exactly this order using these section headers:

## ðŸŽ¯ ICP Definition
One precise ideal customer profile â€” role, company type, size, industry, specific pain, buying trigger.

## ðŸ’¡ Wedge Offer
One sharp offer statement (problem + solution + proof point + CTA). Under 50 words.

## ðŸš€ 30-Day Demand Channels
3-4 specific channels ranked by expected ROI for this business. For each: channel name, why it fits, and the first concrete action to take.

## ðŸ¤– Recommended Agents to Activate
Which Meraki agents to launch first and why. Choose from: Demand Sourcing Agent, Messaging Agent, Deliverability Agent, Qualification Agent, Demo Acceleration Agent, Deal Recovery Agent.

## ðŸ“‹ First 30-Day Execution Steps
Exactly 10 numbered steps. Each step must be concrete, assigned to a time window (Day 1-3, Day 4-7, Week 2, Week 3-4), and actionable without ambiguity.

## ðŸ“Š KPI Targets
A table with: Stage | Target | Timeline. Cover: New contacts/day, Positive reply rate, Qualified meetings/week, Demo-to-close rate, First customer date.

## âš ï¸ Top 3 Risks
The 3 most likely failure modes for this specific business and how to mitigate each.

Be specific to this company â€” no generic advice. Use their actual product, ICP, and constraints in every section.`

    const userPrompt = `Here are the founder's intake answers:

Company: ${answers.companyName || 'Not provided'}
Industry: ${answers.industry || 'Not provided'}
Product Category: ${answers.productCategory || 'Not provided'}
Time Since Launch: ${answers.launchAge || 'Not provided'}
Team Size: ${answers.teamSize || 'Not provided'}

Product: ${answers.productDescription || 'Not provided'}
Core Value Promise: ${answers.coreValuePromise || 'Not provided'}
Pricing / CTA: ${answers.pricing || 'Not provided'} / ${answers.primaryCTA || 'Not provided'}

Target Role: ${answers.targetRole || 'Not provided'}
Target Company Profile: ${answers.targetCompanyProfile || 'Not provided'}
Core Pain They Solve: ${answers.corePain || 'Not provided'}
Existing Customers: ${answers.existingCustomers || 'None yet'}

Current Acquisition Activity: ${answers.currentAcquisition || 'None yet'}
What Has Worked: ${answers.whatWorked || 'Nothing tested yet'}
Inbound Traffic: ${answers.inboundTraffic || 'None'}

Goal: ${answers.customerGoal || 'Not provided'} customers
Revenue Target: ${answers.revenueTarget || 'Not provided'}
Urgency / Deadline: ${answers.urgency || 'Not provided'} / ${answers.deadline || 'None'}

Preferred Channels: ${answers.preferredChannels || 'Not specified'}
Channels to Avoid: ${answers.channelsToAvoid || 'None'}
Outreach Owner: ${answers.outreachOwner || 'Not specified'}

${rawTranscript ? `\nFull conversation transcript for additional context:\n${rawTranscript}` : ''}`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.6,
      max_tokens: 2000,
    })

    const generatedPlan = completion.choices[0]?.message?.content || ''

    // Persist to database (upsert so re-running overwrites)
    await prisma.onboardingSession.upsert({
      where: { organizationId: orgId },
      create: {
        organizationId: orgId,
        answers,
        generatedPlan,
        completedAt: new Date(),
      },
      update: {
        answers,
        generatedPlan,
        completedAt: new Date(),
        planVersion: { increment: 1 },
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({ plan: generatedPlan })
  } catch (error) {
    try {
      return handleAuthError(error)
    } catch {}
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
    }
    console.error('Onboarding plan error:', error)
    return NextResponse.json({ error: 'Plan generation failed' }, { status: 500 })
  }
}

// GET /api/onboarding/plan â€” Load saved plan for this org
export async function GET() {
  try {
    const session = await getRequiredSession()
    const orgId = (session.user as any).organizationId

    const saved = await prisma.onboardingSession.findUnique({
      where: { organizationId: orgId },
    })

    return NextResponse.json({ data: saved || null })
  } catch (error) {
    try {
      return handleAuthError(error)
    } catch {}
    console.error('Onboarding plan fetch error:', error)
    return NextResponse.json({ error: 'Failed to load plan' }, { status: 500 })
  }
}
