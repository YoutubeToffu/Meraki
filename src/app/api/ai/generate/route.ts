import { NextResponse } from 'next/server'
import { z } from 'zod'
import OpenAI from 'openai'
import { getRequiredSession, handleAuthError } from '@/lib/auth-helpers'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const generateContentSchema = z.object({
  type: z.enum([
    'EMAIL_SUBJECT',
    'EMAIL_BODY',
    'LINKEDIN_MESSAGE',
    'FOLLOW_UP',
    'OBJECTION_RESPONSE',
    'NEXT_ACTION',
    'LEAD_SUMMARY',
    'MEETING_PREP',
    'FIRST_LINE',
    'REPLY_SENTIMENT',
    'CAMPAIGN_COACH',
  ]),
  context: z.object({
    leadName: z.string().optional(),
    leadCompany: z.string().optional(),
    leadJobTitle: z.string().optional(),
    industry: z.string().optional(),
    previousInteractions: z.array(z.string()).optional(),
    customPrompt: z.string().optional(),
    tone: z.enum(['formal', 'casual', 'friendly', 'professional', 'founder-to-founder', 'recruiter', 'executive']).optional(),
    length: z.enum(['short', 'medium', 'long']).optional(),
    // For reply sentiment analysis
    replyText: z.string().optional(),
    // For campaign coaching
    campaignMetrics: z.object({
      openRate: z.number().optional(),
      replyRate: z.number().optional(),
      clickRate: z.number().optional(),
      bounceRate: z.number().optional(),
      totalSent: z.number().optional(),
      sequenceName: z.string().optional(),
      subjectLine: z.string().optional(),
      emailBody: z.string().optional(),
      targetPersona: z.string().optional(),
    }).optional(),
    // For first-line generator
    companyNews: z.string().optional(),
    recentPost: z.string().optional(),
    hiringInfo: z.string().optional(),
    personalDetail: z.string().optional(),
  }),
})

// POST /api/ai/generate - Generate AI content via GPT-4o
export async function POST(request: Request) {
  try {
    const session = await getRequiredSession()
    const body = await request.json()
    const validatedData = generateContentSchema.parse(body)

    const { type, context } = validatedData
    const systemPrompt = buildSystemPrompt(type, context)
    const userPrompt = buildUserPrompt(type, context)

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: type === 'REPLY_SENTIMENT' ? 0.2 : 0.7,
      max_tokens: type === 'EMAIL_SUBJECT' || type === 'FIRST_LINE' ? 300 : 1200,
    })

    const content = completion.choices[0]?.message?.content || 'Unable to generate content'
    const tokensUsed = completion.usage?.total_tokens || 0

    return NextResponse.json({
      data: {
        content,
        type,
        tokensUsed,
        generatedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    try { return handleAuthError(error) } catch {}
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error generating AI content:', error)
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    )
  }
}

function buildSystemPrompt(type: string, context: any): string {
  const toneMap: Record<string, string> = {
    formal: 'Write in a formal, corporate tone.',
    casual: 'Write in a casual, conversational tone. Use contractions.',
    friendly: 'Write in a warm, friendly tone. Be personable.',
    professional: 'Write in a professional but approachable tone.',
    'founder-to-founder': 'Write as one founder/CEO to another. Be direct, peer-level, no fluff.',
    recruiter: 'Write in the voice of an experienced recruiter. Be warm but efficient.',
    executive: 'Write for a C-level audience. Be concise, strategic, and data-driven.',
  }
  const toneInstruction = toneMap[context.tone] || toneMap.professional

  const base = `You are an expert B2B outreach copywriter inside Meraki, an AI outreach platform. ${toneInstruction}
Never use filler phrases like "I hope this email finds you well" or "I came across your profile." Be specific, relevant, and human.
Never use emojis in emails unless the tone is casual. Keep paragraphs short (2-3 sentences max).`

  const typeInstructions: Record<string, string> = {
    EMAIL_SUBJECT: `${base}
Generate 3 email subject lines. Each should be under 60 characters, create curiosity, and be personalized. Return them numbered 1-3, one per line. No quotes around them.`,

    EMAIL_BODY: `${base}
Write a cold outreach email. Structure: personalized opening referencing something specific about the prospect → 1-2 sentences on the pain point → brief value prop (no bullet-point lists of features) → soft CTA (question, not a demand). Keep under 150 words.
Do NOT include a subject line. Do NOT include placeholders like [Your Name] — leave the sign-off as just a dash or "Best,".`,

    LINKEDIN_MESSAGE: `${base}
Write a LinkedIn connection request or message. Must be under 300 characters for connection requests, under 500 for DMs. Be human, not salesy. Reference something specific. No "I'd love to pick your brain."`,

    FOLLOW_UP: `${base}
Write a follow-up email for someone who hasn't responded. Do NOT repeat the original pitch. Add new value: a relevant insight, a short case study mention, or a different angle. Keep under 100 words. End with an easy yes/no question.`,

    OBJECTION_RESPONSE: `${base}
The prospect has raised an objection. Generate 3 reply options:
1. **Soft reply** — empathetic, low-pressure, keeps the door open
2. **Confident reply** — addresses the concern directly with evidence
3. **Value-driven reply** — reframes around ROI or a specific benefit

Label each clearly. Keep each under 80 words.`,

    NEXT_ACTION: `${base}
You are an AI sales coach. Based on the lead's profile and engagement history, recommend the top 3 next actions ranked by likelihood of advancing the deal. Be specific and actionable — not generic advice. Include timing recommendations.`,

    LEAD_SUMMARY: `${base}
Generate a concise lead intelligence brief. Include: key insights about the person/company, likely pain points, recommended outreach angle, potential objections to prepare for, and a "Why this lead is a fit" score (0-100) with reasoning.`,

    MEETING_PREP: `${base}
Create a meeting preparation brief. Include: 3 discovery questions tailored to this prospect, 2-3 talking points based on their likely challenges, potential objections with suggested responses, and 2 concrete next steps to propose.`,

    FIRST_LINE: `${base}
Generate 3 hyper-personalized opening lines for a cold email. Each line should reference something specific about the prospect, their company, or their recent activity. The line should connect that observation to a relevant business challenge.
Rules:
- No generic flattery ("impressive growth")
- No questions as openers
- Each line should be 1-2 sentences max
- Explain in parentheses WHY each line works

Return them numbered 1-3.`,

    REPLY_SENTIMENT: `You are an AI reply classifier for a sales outreach platform. Analyze the prospect's reply and return a JSON object with these fields:
{
  "sentiment": one of ["interested", "not_now", "not_interested", "objection", "forwarded", "unsubscribe", "wrong_contact", "meeting_likely", "needs_info", "competitor"],
  "confidence": 0-100,
  "summary": "1-sentence summary of their intent",
  "suggestedAction": "specific next step to take",
  "suggestedReply": "a brief draft reply (under 60 words)",
  "urgency": "high" | "medium" | "low"
}
Return ONLY valid JSON. No markdown, no explanation outside the JSON.`,

    CAMPAIGN_COACH: `You are an expert outreach strategist and campaign coach inside Meraki. Analyze the campaign metrics provided and give specific, actionable advice. Structure your response as:

**Overall Assessment**: 1-2 sentences on campaign health (good/needs work/underperforming)
**What's Working**: bullet points on strengths
**What's Not Working**: bullet points with specific problems identified
**Recommendations**: numbered list of specific changes to make, ordered by expected impact
**Quick Win**: one thing they can change right now for immediate improvement

Be direct and specific. Use benchmark data: average cold email open rate is 20-25%, reply rate 2-5%, click rate 3-5%. Reference these when comparing.`,
  }

  return typeInstructions[type] || base
}

function buildUserPrompt(type: string, context: any): string {
  const parts: string[] = []

  if (context.leadName) parts.push(`Lead: ${context.leadName}`)
  if (context.leadJobTitle) parts.push(`Title: ${context.leadJobTitle}`)
  if (context.leadCompany) parts.push(`Company: ${context.leadCompany}`)
  if (context.industry) parts.push(`Industry: ${context.industry}`)

  if (context.companyNews) parts.push(`Recent company news: ${context.companyNews}`)
  if (context.recentPost) parts.push(`Recent LinkedIn post/activity: ${context.recentPost}`)
  if (context.hiringInfo) parts.push(`Hiring info: ${context.hiringInfo}`)
  if (context.personalDetail) parts.push(`Personal detail: ${context.personalDetail}`)

  if (context.previousInteractions?.length) {
    parts.push(`Previous interactions:\n${context.previousInteractions.map((i: string) => `- ${i}`).join('\n')}`)
  }

  if (context.customPrompt) parts.push(`Additional context: ${context.customPrompt}`)

  // Reply sentiment
  if (type === 'REPLY_SENTIMENT' && context.replyText) {
    return `Classify this prospect reply:\n\n"${context.replyText}"`
  }

  // Campaign coach
  if (type === 'CAMPAIGN_COACH' && context.campaignMetrics) {
    const m = context.campaignMetrics
    const metricLines = [
      m.sequenceName && `Campaign/Sequence: ${m.sequenceName}`,
      m.totalSent != null && `Total Sent: ${m.totalSent}`,
      m.openRate != null && `Open Rate: ${m.openRate}%`,
      m.replyRate != null && `Reply Rate: ${m.replyRate}%`,
      m.clickRate != null && `Click Rate: ${m.clickRate}%`,
      m.bounceRate != null && `Bounce Rate: ${m.bounceRate}%`,
      m.targetPersona && `Target Persona: ${m.targetPersona}`,
      m.subjectLine && `Subject Line: "${m.subjectLine}"`,
      m.emailBody && `Email Body:\n${m.emailBody}`,
    ].filter(Boolean)
    return `Analyze this campaign:\n\n${metricLines.join('\n')}`
  }

  // Objection handling
  if (type === 'OBJECTION_RESPONSE' && context.customPrompt) {
    return `The prospect said: "${context.customPrompt}"\n\n${parts.filter(p => !p.startsWith('Additional')).join('\n')}`
  }

  const lengthHint = context.length === 'short' ? '\nKeep it concise — under 75 words.' :
                     context.length === 'long' ? '\nThis can be detailed — up to 300 words.' : ''

  return parts.join('\n') + lengthHint
}
