import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getRequiredSession, handleAuthError } from '@/lib/auth-helpers'
import OpenAI from 'openai'

export const dynamic = 'force-dynamic'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// POST /api/onboarding/activate
// Reads the saved growth plan + answers, calls GPT-4o to generate a full agent
// configuration, then creates an AiCampaign and a multi-step Sequence with
// AI-written email copy. Idempotent â€” returns 409 if already activated.
export async function POST(_request: Request) {
  try {
    const session = await getRequiredSession()
    const orgId = (session.user as any).organizationId

    // â”€â”€ Load saved plan â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const onboarding = await prisma.onboardingSession.findUnique({
      where: { organizationId: orgId },
      include: { organization: true },
    })

    if (!onboarding?.generatedPlan) {
      return NextResponse.json(
        { error: 'No growth plan found. Generate a plan first.' },
        { status: 400 },
      )
    }

    if (onboarding.activatedAt) {
      return NextResponse.json(
        {
          error: 'Agents already activated.',
          agents: onboarding.agentManifest,
        },
        { status: 409 },
      )
    }

    const answers = (onboarding.answers as Record<string, string>) ?? {}
    const plan = onboarding.generatedPlan

    const companyName = answers.companyName || onboarding.organization.name
    const productDescription = answers.productDescription ?? ''
    const coreValuePromise = answers.coreValuePromise ?? ''
    const targetRole = answers.targetRole ?? ''
    const targetCompanyProfile = answers.targetCompanyProfile ?? ''
    const corePain = answers.corePain ?? ''
    const pricing = answers.pricing ?? ''
    const preferredChannels = answers.preferredChannels ?? 'email, LinkedIn'
    const customerGoal = answers.customerGoal ?? ''

    // â”€â”€ GPT-4o: generate full agent suite config â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.6,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are a B2B SaaS growth expert who builds autonomous customer acquisition systems.

Given a company's growth plan and ICP data, generate a production-ready agent suite configuration.

Return a valid JSON object with this exact shape:
{
  "aiCampaign": {
    "name": "short campaign name (max 60 chars)",
    "goal": "Specific, measurable goal this campaign achieves (2-3 sentences)",
    "context": "Full context paragraph the AI writer uses to craft each email. Include: what the product does, the core pain it solves, the ICP role, the unique value prop, and the desired CTA.",
    "targetAudience": "One-line description of who to target",
    "tone": "founder-to-founder",
    "maxEmails": 6,
    "dailyLimit": 25
  },
  "sequence": {
    "name": "nurture sequence name",
    "description": "What this sequence achieves",
    "steps": [
      {
        "order": 1,
        "type": "EMAIL",
        "delayDays": 0,
        "subject": "email subject",
        "body": "email body (plain text, NO HTML, 3-4 sentences max, conversational)",
        "useAiPersonalization": true,
        "aiPrompt": "Brief instruction for AI to hyper-personalize this step for the specific lead"
      }
    ]
  }
}

Sequence steps must follow this exact proven B2B cold outreach cadence:
- Step 1 (day 0): Problem-led cold intro. Name their specific pain in sentence 1. One soft CTA (15-min call or reply).
- Step 2 (day 3): Value-led follow-up. Lead with one concrete outcome/result your product delivers. Different angle from step 1.
- Step 3 (day 7): Social proof or credibility angle. Reference customer type or outcome. Ask if they have this problem.
- Step 4 (day 12): Alternative-angle email. Different hook â€” ROI, risk, or competitor angle. Still conversational.
- Step 5 (day 18): Break-up email. Short (2 sentences). Polite close. Leaves door open.

Rules:
- ALL email bodies must be plain text, 3-4 sentences MAX, no lists, no bullets, no HTML
- Each subject line must be unique, curiosity-driven, under 50 chars â€” NO spam words
- Use these personalisation tokens where natural: {{firstName}}, {{company}}, {{jobTitle}}
- The aiPrompt for each step should give the AI 1-2 specific personalisation instructions
- Do NOT use generic filler. Make every line specific to the ICP pain and value prop.`,
        },
        {
          role: 'user',
          content: `COMPANY: ${companyName}
PRODUCT: ${productDescription}
CORE VALUE PROMISE: ${coreValuePromise}
TARGET ROLE: ${targetRole}
TARGET COMPANY PROFILE: ${targetCompanyProfile}
CORE PAIN SOLVED: ${corePain}
PRICING: ${pricing}
PREFERRED CHANNELS: ${preferredChannels}
CUSTOMER GOAL: ${customerGoal}

GROWTH PLAN (excerpt):
${plan.slice(0, 3500)}`,
        },
      ],
    })

    let config: {
      aiCampaign: {
        name: string
        goal: string
        context: string
        targetAudience: string
        tone: string
        maxEmails: number
        dailyLimit: number
      }
      sequence: {
        name: string
        description: string
        steps: Array<{
          order: number
          type: string
          delayDays: number
          subject: string
          body: string
          useAiPersonalization: boolean
          aiPrompt: string
        }>
      }
    }

    try {
      config = JSON.parse(completion.choices[0].message.content ?? '{}')
    } catch {
      return NextResponse.json(
        { error: 'Failed to parse agent configuration from AI. Please try again.' },
        { status: 500 },
      )
    }

    const { aiCampaign: campaignConfig, sequence: sequenceConfig } = config

    if (!campaignConfig?.goal || !sequenceConfig?.steps?.length) {
      return NextResponse.json(
        { error: 'Incomplete agent configuration returned. Please try again.' },
        { status: 500 },
      )
    }

    // â”€â”€ Create AiCampaign â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const aiCampaign = await prisma.aiCampaign.create({
      data: {
        name: campaignConfig.name,
        goal: campaignConfig.goal,
        context: campaignConfig.context,
        targetAudience: campaignConfig.targetAudience,
        tone: campaignConfig.tone ?? 'founder-to-founder',
        maxEmails: Math.min(Math.max(campaignConfig.maxEmails ?? 6, 1), 15),
        dailyLimit: Math.min(Math.max(campaignConfig.dailyLimit ?? 25, 1), 200),
        sendWindowStart: 9,
        sendWindowEnd: 17,
        sendTimezone: 'America/New_York',
        sendDays: [1, 2, 3, 4, 5],
        organizationId: orgId,
        learnings: {
          totalSent: 0,
          totalOpened: 0,
          totalReplied: 0,
          totalBounced: 0,
          bestSubjects: [],
          bestAngles: [],
          avoidAngles: [],
        },
      },
    })

    // â”€â”€ Create Sequence with steps â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const sequence = await prisma.sequence.create({
      data: {
        name: sequenceConfig.name,
        description: sequenceConfig.description,
        status: 'ACTIVE',
        triggerType: 'MANUAL',
        exitOnReply: true,
        exitOnMeeting: true,
        sendWindowStart: 9,
        sendWindowEnd: 17,
        sendTimezone: 'America/New_York',
        sendDays: [1, 2, 3, 4, 5],
        dailySendLimit: 50,
        organizationId: orgId,
        steps: {
          create: sequenceConfig.steps.map((step, idx) => ({
            order: step.order ?? idx + 1,
            type: (step.type as any) ?? 'EMAIL',
            delayDays: step.delayDays ?? 0,
            delayHours: 0,
            subject: step.subject,
            body: step.body,
            useAiPersonalization: step.useAiPersonalization ?? true,
            aiPrompt: step.aiPrompt,
          })),
        },
      },
    })

    // â”€â”€ Persist activation manifest â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const manifest = {
      aiCampaignId: aiCampaign.id,
      aiCampaignName: aiCampaign.name,
      sequenceId: sequence.id,
      sequenceName: sequence.name,
      stepCount: sequenceConfig.steps.length,
      createdAt: new Date().toISOString(),
    }

    await prisma.onboardingSession.update({
      where: { organizationId: orgId },
      data: {
        activatedAt: new Date(),
        agentManifest: manifest,
      },
    })

    return NextResponse.json({
      message: 'Agent suite activated successfully',
      agents: {
        aiCampaign: { id: aiCampaign.id, name: aiCampaign.name },
        sequence: { id: sequence.id, name: sequence.name, steps: sequenceConfig.steps.length },
      },
    })
  } catch (error) {
    try {
      return handleAuthError(error)
    } catch {}
    console.error('[activate] Error:', error)
    return NextResponse.json({ error: 'Failed to activate agents' }, { status: 500 })
  }
}

// GET /api/onboarding/activate â€” Check activation status
export async function GET(_request: Request) {
  try {
    const session = await getRequiredSession()
    const orgId = (session.user as any).organizationId

    const onboarding = await prisma.onboardingSession.findUnique({
      where: { organizationId: orgId },
      select: { activatedAt: true, agentManifest: true },
    })

    if (!onboarding) {
      return NextResponse.json({ activated: false, agents: null })
    }

    return NextResponse.json({
      activated: !!onboarding.activatedAt,
      activatedAt: onboarding.activatedAt,
      agents: onboarding.agentManifest,
    })
  } catch (error) {
    try {
      return handleAuthError(error)
    } catch {}
    return NextResponse.json({ error: 'Failed to check activation status' }, { status: 500 })
  }
}
