import { NextResponse } from 'next/server'
import { z } from 'zod'

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
  ]),
  context: z.object({
    leadName: z.string().optional(),
    leadCompany: z.string().optional(),
    leadJobTitle: z.string().optional(),
    industry: z.string().optional(),
    previousInteractions: z.array(z.string()).optional(),
    customPrompt: z.string().optional(),
    tone: z.enum(['formal', 'casual', 'friendly', 'professional']).optional(),
    length: z.enum(['short', 'medium', 'long']).optional(),
  }),
})

// POST /api/ai/generate - Generate AI content
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validatedData = generateContentSchema.parse(body)

    // Mock AI response - replace with actual AI API call (OpenAI, Anthropic, etc.)
    const aiResponses: Record<string, string> = {
      EMAIL_SUBJECT: generateEmailSubject(validatedData.context),
      EMAIL_BODY: generateEmailBody(validatedData.context),
      LINKEDIN_MESSAGE: generateLinkedInMessage(validatedData.context),
      FOLLOW_UP: generateFollowUp(validatedData.context),
      OBJECTION_RESPONSE: generateObjectionResponse(validatedData.context),
      NEXT_ACTION: generateNextAction(validatedData.context),
      LEAD_SUMMARY: generateLeadSummary(validatedData.context),
      MEETING_PREP: generateMeetingPrep(validatedData.context),
    }

    const content = aiResponses[validatedData.type] || 'Unable to generate content'

    return NextResponse.json({
      data: {
        content,
        type: validatedData.type,
        tokensUsed: Math.floor(content.length / 4), // Approximate token count
        generatedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
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

// Helper functions to generate content (replace with actual AI calls)
function generateEmailSubject(context: any): string {
  const name = context.leadName || 'there'
  const company = context.leadCompany || 'your company'
  
  const subjects = [
    `Quick question about ${company}'s hiring process`,
    `${name}, here's how to cut hiring costs by 30%`,
    `Saving 20 hours/week on recruitment - interested?`,
    `${company} + TalentMeta: A quick intro`,
  ]
  
  return subjects[Math.floor(Math.random() * subjects.length)]
}

function generateEmailBody(context: any): string {
  const name = context.leadName || 'there'
  const company = context.leadCompany || 'your company'
  const title = context.leadJobTitle || 'hiring manager'
  
  return `Hi ${name},

I came across ${company} and was impressed by your growth trajectory. As ${title}, I imagine scaling your team while maintaining quality is a constant challenge.

At TalentMeta.ai, we've helped companies like yours:
• Reduce time-to-hire by 40%
• Cut recruitment costs by 30%
• Improve candidate quality scores by 2x

Would you be open to a quick 15-minute call to explore if this could help ${company}?

Here's my calendar if you'd like to pick a time: [calendar_link]

Best regards,
[Your Name]

P.S. Happy to share a case study from a similar company in your industry.`
}

function generateLinkedInMessage(context: any): string {
  const name = context.leadName || 'there'
  const company = context.leadCompany || 'your company'
  
  return `Hi ${name}! 👋

I noticed ${company} is growing rapidly - congratulations! 

I work with scaling companies to streamline their recruitment process using AI. We've helped teams reduce hiring time by 40% while improving candidate quality.

Would love to connect and share some insights that might be useful for your team. No pitch, just a quick conversation.

Open to connecting?`
}

function generateFollowUp(context: any): string {
  const name = context.leadName || 'there'
  
  return `Hi ${name},

I wanted to follow up on my previous message. I know how busy you must be, so I'll keep this brief.

I'd love to share a 2-minute video showing how companies similar to yours are saving 20+ hours per week on recruitment.

Would that be helpful?

If the timing isn't right, no worries at all - just let me know and I'll check back in a few months.

Best,
[Your Name]`
}

function generateObjectionResponse(context: any): string {
  const objection = context.customPrompt || "We don't have budget right now"
  
  const responses: Record<string, string> = {
    "We don't have budget right now": `I completely understand - budget constraints are real. A few thoughts:

1. Our ROI typically shows within 30 days (avg 3x return on investment)
2. We offer a free pilot program so you can see results before committing
3. Many clients find we actually save money vs. their current recruitment spend

Would it help if I shared a cost comparison showing potential savings for a company your size?`,

    "We're not looking right now": `Totally fair - timing is everything. Quick question: is it that you're not hiring, or that you have a solution that's working well?

If it's the former, I'd love to stay in touch for when things pick up.
If it's the latter, I'm genuinely curious what's working for you - always learning from the best!`,

    "We use a competitor": `Great to hear you're already invested in this space! 

Out of curiosity, what's working well with your current solution? And if there was one thing you could improve, what would it be?

I ask because many of our customers switched from [Competitor] specifically for [unique feature]. Happy to show you a quick comparison if helpful.`,
  }

  return responses[objection] || `Thank you for sharing that concern. Let me address it directly:

${objection}

Here's how we typically handle this situation:
1. We offer flexible options to accommodate different needs
2. Our success team works with you to find the right fit
3. We have case studies from companies who had similar concerns

Would you be open to a quick call to discuss your specific situation?`
}

function generateNextAction(context: any): string {
  const name = context.leadName || 'The lead'
  const company = context.leadCompany || 'their company'
  
  return `Based on the lead profile and engagement history, here are recommended next actions:

1. **High Priority**: Send a personalized follow-up email within 24 hours
   - Reference their recent email open (if applicable)
   - Include a specific case study from their industry

2. **Connect on LinkedIn**: ${name} is active on LinkedIn
   - Send a connection request with personalized note
   - Comment on their recent posts to build rapport

3. **Schedule a Demo**: Based on their engagement score (85+)
   - Send a Calendly link with 3-4 time slots
   - Offer a 15-minute "quick win" demo format

4. **Research ${company}**:
   - Check recent news/funding announcements
   - Identify potential expansion plans or pain points
   - Prepare relevant talking points for next contact`
}

function generateLeadSummary(context: any): string {
  const name = context.leadName || 'Lead'
  const company = context.leadCompany || 'Company'
  const title = context.leadJobTitle || 'Decision Maker'
  
  return `## Lead Summary: ${name}

**Company**: ${company}
**Title**: ${title}
**Lead Score**: 85/100 (High Priority)

### Key Insights:
- Company has grown 40% in the past year
- Recently posted 15 new job openings on LinkedIn
- Active in hiring/HR tech discussions online

### Engagement History:
- Opened 3 emails (68% open rate)
- Clicked on pricing page link
- Visited demo page twice

### Recommended Approach:
- Focus on ROI and time savings
- Reference similar company case studies
- Offer a personalized demo

### Potential Concerns:
- May have existing vendor relationships
- Budget cycle ends in Q2
- Decision requires multiple stakeholders`
}

function generateMeetingPrep(context: any): string {
  const name = context.leadName || 'the prospect'
  const company = context.leadCompany || 'their company'
  
  return `# Meeting Prep: ${name} at ${company}

## Background Research:
- ${company} is a [industry] company with approximately [X] employees
- Recent news: [Company expansion/funding/product launch]
- LinkedIn profile shows focus on [relevant interests]

## Talking Points:
1. **Opening**: Reference their recent [achievement/news/post]
2. **Discovery Questions**:
   - How are you currently handling [pain point]?
   - What's your biggest challenge with recruitment right now?
   - What would success look like for your team?

3. **Value Props to Highlight**:
   - 40% reduction in time-to-hire
   - AI-powered candidate matching
   - Integration with existing ATS

4. **Objection Handling**:
   - Budget: ROI typically 3x within 90 days
   - Time: Implementation takes < 1 week
   - Complexity: Dedicated success manager included

## Meeting Goals:
- [ ] Understand their current process
- [ ] Identify 2-3 key pain points
- [ ] Propose a pilot program
- [ ] Schedule follow-up or demo

## Next Steps to Propose:
1. 14-day pilot with 50 candidates
2. Weekly check-in calls
3. ROI review at end of pilot`
}
