import { NextResponse } from 'next/server'
import { z } from 'zod'
import OpenAI from 'openai'
import { getRequiredSession, handleAuthError } from '@/lib/auth-helpers'

export const dynamic = 'force-dynamic'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const chatSchema = z.object({
  stage: z.enum([
    'company_basics',
    'product_offer',
    'target_customer',
    'funnel_state',
    'goal_timeline',
    'channel_preferences',
  ]),
  userMessage: z.string().min(1).max(2000),
  conversationHistory: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
      })
    )
    .optional()
    .default([]),
})

const STAGE_PROMPTS: Record<string, string> = {
  company_basics: `You are a friendly growth strategist onboarding a B2B SaaS founder into Meraki, an autonomous customer acquisition platform.

Your job right now: learn about their company. Ask about their company name, industry, product category, how long they've been live, and their current team size. 

Be conversational â€” ask one or two questions at a time. Acknowledge their answers warmly before asking the next question. Keep responses under 80 words. When you have enough context (name, industry, stage, team size), say: "Great, I have a good picture of your company. Let's talk about your product next."`,

  product_offer: `You are a growth strategist helping a B2B SaaS founder define their offer. You already know their company basics.

Your job: understand their product deeply. Ask what it does, the core value promise (what outcome does it deliver?), how they currently price or charge (or plan to), and what their primary call-to-action is (demo, trial, freemium, etc.).

Be conversational â€” one or two questions at a time. Under 80 words. When done: "Perfect. Now let's understand your ideal customer."`,

  target_customer: `You are a growth strategist identifying the ICP (ideal customer profile) for a B2B SaaS founder.

Your job: define their target buyer. Ask who their ideal customer is (job title/role), what company profile fits best (size, stage, industry), what pain or problem drives the purchase, and whether they have any existing customers or early users to learn from.

Conversational, one or two questions at a time. Under 80 words. When done: "Got it. Let's assess where your funnel stands today."`,

  funnel_state: `You are a growth strategist assessing the current acquisition state of a B2B SaaS founder.

Your job: understand where they are in building their go-to-market. Ask whether they have any paying customers yet, what outreach or acquisition they've tried so far, what worked or didn't, and whether they have any inbound traffic or leads.

Conversational, under 80 words per message. When done: "Clear picture. Now let's set your goals."`,

  goal_timeline: `You are a growth strategist setting ambitious but realistic goals for a B2B SaaS founder.

Your job: define their goal. Ask how many customers they want in the next 30-90 days, what revenue milestone matters most right now, how urgent this is for their business, and whether they have a specific deadline (fundraising, launch event, etc.).

Conversational, under 80 words. When done: "Almost there. Last question â€” your preferred channels."`,

  channel_preferences: `You are a growth strategist completing the final intake for a B2B SaaS founder.

Your job: understand their channel preferences and constraints. Ask whether they prefer email outreach, LinkedIn, referrals, content, or paid. Ask if there are any channels they want to avoid. Ask if they have a dedicated person for outreach or if it's founder-led.

Conversational, under 80 words. When done: "I have everything I need to build your growth plan. Click Generate Plan when ready!"`,
}

// POST /api/onboarding/chat â€” Single-turn conversational question flow
export async function POST(request: Request) {
  try {
    await getRequiredSession()

    const body = await request.json()
    const { stage, userMessage, conversationHistory } = chatSchema.parse(body)

    const systemPrompt = STAGE_PROMPTS[stage]

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user', content: userMessage },
    ]

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      temperature: 0.7,
      max_tokens: 300,
    })

    const reply = completion.choices[0]?.message?.content || 'Tell me more about that.'

    return NextResponse.json({ reply, stage })
  } catch (error) {
    try {
      return handleAuthError(error)
    } catch {}
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
    }
    console.error('Onboarding chat error:', error)
    return NextResponse.json({ error: 'Chat failed' }, { status: 500 })
  }
}
