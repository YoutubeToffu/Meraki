export interface PlaybookTemplate {
  name: string
  subject: string
  body: string
  category: string
  variables: string[]
}

export interface Playbook {
  id: string
  industry: string
  description: string
  icon: string
  templates: PlaybookTemplate[]
}

export const industryPlaybooks: Playbook[] = [
  {
    id: 'staffing-recruiting',
    industry: 'Staffing & Recruiting',
    description: 'Proven outreach sequences for recruiters and staffing firms targeting hiring managers.',
    icon: '👥',
    templates: [
      {
        name: '[Staffing] Initial Outreach — Talent Pipeline',
        subject: '{{firstName}}, struggling to fill {{roleType}} roles?',
        body: `Hi {{firstName}},

I noticed {{company}} has had a few {{roleType}} openings posted for a while — filling those can be brutal in this market.

We specialize in placing top {{roleType}} talent and currently have pre-vetted candidates who could be a strong fit.

Would it be worth a quick chat to see if we can help shorten your time-to-fill?

Best,
{{senderName}}`,
        category: 'Cold Outreach',
        variables: ['firstName', 'company', 'roleType', 'senderName'],
      },
      {
        name: '[Staffing] Follow-up — Social Proof',
        subject: 'Re: {{roleType}} hiring at {{company}}',
        body: `Hi {{firstName}},

Just following up — I wanted to share that we recently helped a similar company in {{industry}} fill 3 senior roles in under 30 days.

Happy to share how we did it and see if the same approach could work for {{company}}.

Worth 15 minutes this week?

{{senderName}}`,
        category: 'Follow-up',
        variables: ['firstName', 'company', 'roleType', 'industry', 'senderName'],
      },
      {
        name: '[Staffing] Breakup — Final Touch',
        subject: 'Should I close your file, {{firstName}}?',
        body: `Hi {{firstName}},

I've reached out a couple of times about helping with your {{roleType}} hiring needs at {{company}}.

I don't want to be a pest — if the timing isn't right, no worries at all. But if hiring picks up, I'd love to be a resource.

Feel free to reach out anytime.

Best,
{{senderName}}`,
        category: 'Follow-up',
        variables: ['firstName', 'company', 'roleType', 'senderName'],
      },
    ],
  },
  {
    id: 'saas-sales',
    industry: 'SaaS Sales',
    description: 'High-converting cold outreach templates for B2B SaaS targeting decision-makers.',
    icon: '💻',
    templates: [
      {
        name: '[SaaS] Cold Outreach — Pain Point Opening',
        subject: '{{firstName}}, quick question about {{painPoint}}',
        body: `Hi {{firstName}},

I was looking into {{company}} and noticed you might be dealing with {{painPoint}}.

We built {{product}} specifically to solve this — our customers typically see {{keyMetric}} within the first 90 days.

Would you be open to a 15-min demo to see if it's a fit?

{{senderName}}
{{senderTitle}}`,
        category: 'Cold Outreach',
        variables: ['firstName', 'company', 'painPoint', 'product', 'keyMetric', 'senderName', 'senderTitle'],
      },
      {
        name: '[SaaS] Follow-up — Case Study',
        subject: 'How {{similarCompany}} solved {{painPoint}}',
        body: `Hi {{firstName}},

Following up on my last note. Wanted to share a quick story:

{{similarCompany}} was facing the same {{painPoint}} challenge. After implementing {{product}}, they saw {{result}} in {{timeframe}}.

I put together a short case study — happy to send it over if you're interested.

{{senderName}}`,
        category: 'Follow-up',
        variables: ['firstName', 'similarCompany', 'painPoint', 'product', 'result', 'timeframe', 'senderName'],
      },
      {
        name: '[SaaS] Demo Follow-up — Next Steps',
        subject: 'Next steps after our chat, {{firstName}}',
        body: `Hi {{firstName}},

Great chatting today! Here's a quick recap of what we discussed:

1. Your challenge: {{painPoint}}
2. How {{product}} addresses it: {{solution}}
3. Next steps: {{nextStep}}

I'll follow up on {{followUpDate}}. In the meantime, feel free to reach out with any questions.

{{senderName}}`,
        category: 'Follow-up',
        variables: ['firstName', 'painPoint', 'product', 'solution', 'nextStep', 'followUpDate', 'senderName'],
      },
      {
        name: '[SaaS] Re-engagement — New Feature',
        subject: '{{firstName}}, we just launched something you asked about',
        body: `Hi {{firstName}},

We chatted a while back about {{company}}'s needs around {{painPoint}}. At the time, the timing wasn't right — totally understood.

Since then, we've launched {{newFeature}}, which directly addresses what you were looking for.

Would it be worth another quick look?

{{senderName}}`,
        category: 'Re-engagement',
        variables: ['firstName', 'company', 'painPoint', 'newFeature', 'senderName'],
      },
    ],
  },
  {
    id: 'agency',
    industry: 'Marketing & Design Agencies',
    description: 'Outreach templates for agencies selling creative, marketing, or development services.',
    icon: '🎨',
    templates: [
      {
        name: '[Agency] Cold Outreach — Website Audit',
        subject: 'Noticed something about {{company}}\'s {{channel}}',
        body: `Hi {{firstName}},

I took a look at {{company}}'s {{channel}} and noticed a few quick wins that could boost your {{metric}} significantly.

For example: {{specificObservation}}

We help companies like {{similarCompany}} improve their {{channel}} performance — they saw a {{result}} improvement after working with us.

Would you be open to a free 15-minute audit call?

{{senderName}}
{{agencyName}}`,
        category: 'Cold Outreach',
        variables: ['firstName', 'company', 'channel', 'metric', 'specificObservation', 'similarCompany', 'result', 'senderName', 'agencyName'],
      },
      {
        name: '[Agency] Follow-up — Portfolio Share',
        subject: 'Re: {{company}}\'s {{channel}} — some examples',
        body: `Hi {{firstName}},

Following up on my note about improving {{company}}'s {{channel}}.

Here are a couple of recent projects that might resonate:
• {{project1}} — {{project1Result}}
• {{project2}} — {{project2Result}}

Happy to walk through our approach and see if there's a fit.

{{senderName}}`,
        category: 'Follow-up',
        variables: ['firstName', 'company', 'channel', 'project1', 'project1Result', 'project2', 'project2Result', 'senderName'],
      },
      {
        name: '[Agency] Nurture — Monthly Tip',
        subject: '{{industry}} marketing tip: {{tipSubject}}',
        body: `Hi {{firstName}},

Quick tip that's been working well for our {{industry}} clients:

{{tip}}

We've seen this drive {{result}} on average. Let me know if you'd like to chat about implementing this for {{company}}.

{{senderName}}
{{agencyName}}`,
        category: 'Nurture',
        variables: ['firstName', 'industry', 'tipSubject', 'tip', 'result', 'company', 'senderName', 'agencyName'],
      },
    ],
  },
  {
    id: 'consulting',
    industry: 'Consulting & Professional Services',
    description: 'Thought-leadership-driven outreach for management, IT, and strategy consultants.',
    icon: '📊',
    templates: [
      {
        name: '[Consulting] Cold Outreach — Industry Insight',
        subject: '{{firstName}}, a trend in {{industry}} worth watching',
        body: `Hi {{firstName}},

I've been advising {{industry}} leaders on {{topic}} and thought you'd find this relevant:

{{insight}}

We recently helped {{similarCompany}} navigate this — resulting in {{result}}.

Would it be valuable to compare notes over a brief call?

{{senderName}}
{{firmName}}`,
        category: 'Cold Outreach',
        variables: ['firstName', 'industry', 'topic', 'insight', 'similarCompany', 'result', 'senderName', 'firmName'],
      },
      {
        name: '[Consulting] Follow-up — Whitepaper Offer',
        subject: 'Re: {{topic}} in {{industry}} — free resource',
        body: `Hi {{firstName}},

Following up on my earlier note about {{topic}}.

We recently published a brief guide: "{{whitepaperTitle}}" — it covers the key strategies high-performers in {{industry}} are using.

Happy to send it your way. No strings attached.

{{senderName}}`,
        category: 'Follow-up',
        variables: ['firstName', 'topic', 'industry', 'whitepaperTitle', 'senderName'],
      },
      {
        name: '[Consulting] Executive Touch — CEO/VP Level',
        subject: '{{firstName}}, a strategic question for {{company}}',
        body: `{{firstName}},

As {{company}} scales, one question I see leaders like you grapple with: {{strategicQuestion}}

We've helped {{numberOfClients}}+ companies in {{industry}} solve this by {{approach}}.

I'm not trying to sell — genuinely curious how you're thinking about it.

{{senderName}}
{{senderTitle}}, {{firmName}}`,
        category: 'Cold Outreach',
        variables: ['firstName', 'company', 'strategicQuestion', 'numberOfClients', 'industry', 'approach', 'senderName', 'senderTitle', 'firmName'],
      },
    ],
  },
  {
    id: 'local-business',
    industry: 'Local Business & Real Estate',
    description: 'Simple, direct outreach for local service providers, realtors, and small businesses.',
    icon: '🏠',
    templates: [
      {
        name: '[Local] Cold Outreach — Neighbor Approach',
        subject: 'Hi {{firstName}} — I work with businesses in {{area}}',
        body: `Hi {{firstName}},

I'm {{senderName}} with {{businessName}}. We help local businesses in {{area}} with {{service}}.

I noticed {{company}} and thought there might be a good fit. We recently helped {{nearbyBusiness}} achieve {{result}}.

Would you be interested in a quick call to see if we can do the same for you?

{{senderName}}
{{phone}}`,
        category: 'Cold Outreach',
        variables: ['firstName', 'area', 'senderName', 'businessName', 'service', 'company', 'nearbyBusiness', 'result', 'phone'],
      },
      {
        name: '[Local] Follow-up — Limited Offer',
        subject: 'Quick follow-up, {{firstName}} — spots filling up',
        body: `Hi {{firstName}},

Just wanted to circle back — we have {{availability}} spots left this month for our {{service}} package.

As a local business in {{area}}, you'd get {{specialOffer}}.

No pressure at all — just wanted to make sure you knew about it before we fill up.

{{senderName}}
{{phone}}`,
        category: 'Follow-up',
        variables: ['firstName', 'availability', 'service', 'area', 'specialOffer', 'senderName', 'phone'],
      },
      {
        name: '[Real Estate] Homeowner Outreach',
        subject: '{{address}} — what\'s it worth today?',
        body: `Hi {{firstName}},

I've been tracking the market in {{neighborhood}} and recent sales suggest homes like yours at {{address}} could be worth {{estimatedValue}}.

If you're curious about an updated valuation — or even just thinking long-term — I'd be happy to run a free comparative market analysis.

No obligation, just good information.

{{senderName}}
{{senderTitle}}, {{brokerage}}
{{phone}}`,
        category: 'Cold Outreach',
        variables: ['firstName', 'neighborhood', 'address', 'estimatedValue', 'senderName', 'senderTitle', 'brokerage', 'phone'],
      },
    ],
  },
]
