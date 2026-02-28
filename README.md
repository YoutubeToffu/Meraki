# Meraki - Growth Engine Platform

<div align="center">
  <h3>AI-Powered Customer Acquisition for Startups</h3>
  <p>Automate lead generation, nurturing, and sales with intelligent sequences</p>
</div>

---

## Overview

Meraki is a comprehensive growth engine platform designed to help startups like TalentMeta.ai acquire customers through automated lead generation, AI-powered outreach, and intelligent sales automation.

## Features

### 🎯 Lead Generation
- **Multi-channel capture**: LinkedIn scraping, website forms, email campaigns, API integration
- **Lead enrichment**: Automatically enrich lead data from multiple sources
- **Smart scoring**: AI-powered lead scoring based on engagement and fit
- **Tagging & segmentation**: Organize leads with custom tags and segments

### 🔄 Automated Sequences
- **Multi-step workflows**: Create email + LinkedIn sequences that run on autopilot
- **Smart delays**: Configure delays between steps in days/hours
- **AI personalization**: Generate personalized content for each lead
- **Trigger-based enrollment**: Auto-enroll leads based on actions or criteria

### 🤖 AI Assistant
- **Email generation**: Create compelling outreach emails with AI
- **LinkedIn messages**: Generate personalized connection requests
- **Follow-up content**: Smart follow-ups for non-responsive leads
- **Objection handling**: Get AI suggestions for common objections
- **Meeting prep**: Generate prep notes before sales calls

### 📊 Analytics Dashboard
- **Lead metrics**: Track leads by source, status, and conversion
- **Campaign performance**: Monitor email open rates, clicks, and replies
- **Sequence analytics**: See which sequences perform best
- **Revenue attribution**: Track pipeline and won deals

### 📧 Email Campaigns
- **Template library**: Reusable email templates with variables
- **A/B testing**: Test subject lines and content variations
- **Tracking**: Open, click, and reply tracking
- **Scheduling**: Schedule emails for optimal send times

### 🔗 Integrations
- **CRM**: HubSpot, Salesforce sync
- **Email**: Gmail, Outlook integration
- **Calendar**: Google Calendar, Calendly
- **Social**: LinkedIn automation
- **Communication**: Slack notifications
- **Developer**: Webhooks and API access

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS, Radix UI
- **Database**: PostgreSQL with Prisma ORM
- **State Management**: Zustand, TanStack Query
- **Charts**: Recharts
- **Validation**: Zod
- **Forms**: React Hook Form

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/meraki.git
cd meraki
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
DATABASE_URL="postgresql://..."
OPENAI_API_KEY="sk-..."
RESEND_API_KEY="re_..."
# ... other variables
```

4. Set up the database:
```bash
npm run db:generate
npm run db:push
```

5. Start the development server:
```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## Project Structure

```
meraki/
├── prisma/
│   └── schema.prisma      # Database schema
├── src/
│   ├── app/
│   │   ├── api/           # API routes
│   │   │   ├── leads/
│   │   │   ├── sequences/
│   │   │   ├── ai/
│   │   │   ├── forms/
│   │   │   └── webhooks/
│   │   ├── dashboard/     # Dashboard pages
│   │   │   ├── leads/
│   │   │   ├── sequences/
│   │   │   ├── campaigns/
│   │   │   ├── templates/
│   │   │   ├── ai/
│   │   │   ├── analytics/
│   │   │   ├── integrations/
│   │   │   └── settings/
│   │   └── page.tsx       # Landing page
│   ├── components/
│   │   ├── layout/        # Layout components
│   │   └── ui/            # UI components
│   └── lib/
│       ├── prisma.ts      # Database client
│       └── utils.ts       # Utility functions
└── package.json
```

## API Endpoints

### Leads
- `GET /api/leads` - List all leads with filtering
- `POST /api/leads` - Create a new lead

### Sequences
- `GET /api/sequences` - List all sequences
- `POST /api/sequences` - Create a new sequence

### AI
- `POST /api/ai/generate` - Generate AI content

### Forms
- `POST /api/forms/submit` - Public lead capture form submission

### Webhooks
- `POST /api/webhooks` - Handle incoming webhooks
- `GET /api/webhooks` - List configured webhooks

## Configuration

### Email Integration

Set up your email provider (Resend recommended):
```env
RESEND_API_KEY="re_your-api-key"
EMAIL_FROM="noreply@yourdomain.com"
```

### AI Integration

Configure OpenAI for AI-powered features:
```env
OPENAI_API_KEY="sk-your-api-key"
```

### LinkedIn Integration

Set up LinkedIn OAuth:
```env
LINKEDIN_CLIENT_ID="your-client-id"
LINKEDIN_CLIENT_SECRET="your-client-secret"
```

## Deployment

### Vercel (Recommended)

```bash
vercel deploy
```

### Docker

```bash
docker build -t meraki .
docker run -p 3000:3000 meraki
```

## Roadmap

- [ ] Advanced lead scoring with ML
- [ ] Email warm-up automation
- [ ] LinkedIn Sales Navigator integration
- [ ] Video messages (Loom integration)
- [ ] Team collaboration features
- [ ] Custom reporting builder
- [ ] Mobile app

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details.

## Support

- Documentation: [docs.meraki.dev](https://docs.meraki.dev)
- Email: support@meraki.dev
- Discord: [Join our community](https://discord.gg/meraki)

---

<div align="center">
  <p>Built with ❤️ for startups that want to grow</p>
</div>
