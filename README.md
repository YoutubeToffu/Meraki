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

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI
- **Auth**: NextAuth.js v4 (credentials provider, JWT sessions)
- **Database**: PostgreSQL (Neon) with Prisma ORM
- **State Management**: Zustand, TanStack React Query
- **Charts**: Recharts
- **Validation**: Zod
- **Security**: bcryptjs (password hashing), CSRF protection, org-scoped queries

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
│   └── schema.prisma          # Database schema (17 models)
├── src/
│   ├── middleware.ts           # Auth middleware (protects /dashboard/*)
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── [...nextauth]/  # NextAuth handler
│   │   │   │   └── register/      # User registration
│   │   │   ├── leads/
│   │   │   │   ├── route.ts       # GET (list) + POST (create)
│   │   │   │   └── [id]/route.ts  # GET + PUT + DELETE
│   │   │   ├── templates/
│   │   │   │   ├── route.ts       # GET (list) + POST (create)
│   │   │   │   └── [id]/route.ts  # GET + PUT + DELETE
│   │   │   ├── sequences/
│   │   │   ├── ai/generate/
│   │   │   ├── forms/submit/
│   │   │   └── webhooks/
│   │   ├── auth/
│   │   │   ├── login/page.tsx     # Login page
│   │   │   └── register/page.tsx  # Registration page
│   │   ├── dashboard/             # Protected dashboard pages
│   │   │   ├── leads/
│   │   │   ├── templates/
│   │   │   ├── sequences/
│   │   │   ├── campaigns/
│   │   │   ├── ai/
│   │   │   ├── analytics/
│   │   │   ├── integrations/
│   │   │   └── settings/
│   │   └── page.tsx               # Landing page
│   ├── components/
│   │   ├── providers.tsx          # SessionProvider + QueryClient
│   │   ├── layout/                # Sidebar, Header
│   │   └── ui/                    # Button, Card, Input, Toast
│   └── lib/
│       ├── auth.ts                # NextAuth config
│       ├── auth-helpers.ts        # Server-side auth utilities
│       ├── prisma.ts              # Database client
│       └── utils.ts               # Utility functions
└── package.json
```

## API Endpoints

All `/api/leads` and `/api/templates` routes require authentication and are org-scoped.

### Auth
- `POST /api/auth/register` — Create account (org + user in one transaction)
- `POST /api/auth/callback/credentials` — NextAuth login (via `signIn()`)
- `GET /api/auth/session` — Get current session

### Leads ✅
- `GET /api/leads` — List leads with pagination, search, status/source filters, sorting
- `POST /api/leads` — Create a lead (+ activity log)
- `GET /api/leads/:id` — Get single lead
- `PUT /api/leads/:id` — Update lead (logs status changes)
- `DELETE /api/leads/:id` — Delete lead

### Templates ✅
- `GET /api/templates` — List templates with optional category filter
- `POST /api/templates` — Create template
- `GET /api/templates/:id` — Get single template
- `PUT /api/templates/:id` — Update template
- `DELETE /api/templates/:id` — Delete template

### Sequences (Phase 3)
- `GET /api/sequences` — List all sequences
- `POST /api/sequences` — Create a new sequence

### AI (Phase 2)
- `POST /api/ai/generate` — Generate AI content

### Forms
- `POST /api/forms/submit` — Public lead capture form submission

### Webhooks (Phase 4)
- `POST /api/webhooks` — Handle incoming webhooks
- `GET /api/webhooks` — List configured webhooks

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

## Implementation Plan

### Phase 1: Foundation — Auth + Core CRUD ✅ COMPLETE

- [x] **Authentication** — NextAuth.js with credentials provider, JWT sessions, bcrypt password hashing
- [x] **Registration** — `/api/auth/register` creates Organization + User in a single transaction
- [x] **Login / Logout** — `/auth/login`, `/auth/register` pages with auto-redirect
- [x] **Auth Middleware** — All `/dashboard/*` routes protected via `next-auth/middleware`
- [x] **Leads CRUD** — Full REST API (`GET`, `POST`, `PUT`, `DELETE`) with org-scoped Prisma queries, pagination, search, filtering, sorting
- [x] **Leads UI** — Real data via React Query, add/delete modals, status & source filters, loading/error/empty states
- [x] **Templates CRUD** — Full REST API + UI with create/edit modal, category filtering
- [x] **Dashboard** — Real lead metrics (total count, recent leads) fetched from API
- [x] **Sidebar** — Shows logged-in user name, org name, sign-out button via `useSession()`
- [x] **Activity Logging** — Lead creation and status changes logged as Activity records

### Phase 2: Email + AI Integration

- [ ] **Resend Integration** — Wire up email sending via Resend API (`RESEND_API_KEY`)
- [ ] **OpenAI Integration** — Connect `/api/ai/generate` to GPT-4o for real AI content generation
- [ ] **Email Sending from Templates** — Select a template → fill variables → send to lead(s)
- [ ] **AI Email Generation** — Generate personalized outreach emails for selected leads
- [ ] **AI Page** — Wire the AI assistant page to real OpenAI calls
- [ ] **Email Tracking** — Track opens/clicks via pixel + redirect links

### Phase 3: Sequences & Automation

- [ ] **Sequences CRUD** — Full REST API for creating multi-step sequences
- [ ] **Sequence Steps** — Add/edit/reorder steps (email, delay, condition)
- [ ] **Sequence Enrollment** — Enroll leads into sequences manually or via triggers
- [ ] **Sequence Execution Engine** — Background job to process sequence steps on schedule
- [ ] **Sequences UI** — Wire the sequences page to real data with enrollment management
- [ ] **Campaigns** — Wire campaigns page with sequence + template association

### Phase 4: Analytics & Integrations

- [ ] **Analytics Dashboard** — Real metrics: leads by source, conversion rates, pipeline value
- [ ] **Email Analytics** — Open rates, click rates, reply rates per template/campaign
- [ ] **Sequence Analytics** — Step-by-step conversion funnels, drop-off analysis
- [ ] **Webhook System** — Inbound/outbound webhooks for external integrations
- [ ] **Integration Connectors** — HubSpot, Gmail, Google Calendar initial setup
- [ ] **Settings Page** — Org settings, user management, API key management

### Phase 5: Advanced Features & Polish

- [ ] **Lead Scoring** — ML-based scoring using engagement signals
- [ ] **A/B Testing** — Subject line and content variant testing
- [ ] **Team Collaboration** — Multi-user orgs with role-based access (Admin, Member, Viewer)
- [ ] **Bulk Operations** — CSV import/export, bulk status changes, bulk enrollment
- [ ] **Landing Page** — Public marketing page with feature showcase
- [ ] **Mobile Responsive** — Full responsive design for all dashboard pages
- [ ] **Email Warm-up** — Gradual send volume ramp for new domains
- [ ] **LinkedIn Automation** — Connection requests, message sequences

---

## Current Status

| Area | Status | Details |
|------|--------|---------|
| Auth | ✅ Complete | NextAuth credentials, JWT, register/login/logout |
| Database | ✅ Complete | 17 models on Neon PostgreSQL, all tables live |
| Leads | ✅ Complete | Full CRUD + UI with real data |
| Templates | ✅ Complete | Full CRUD + UI with real data |
| Dashboard | ✅ Partial | Real lead metrics, quick actions (pipeline phases pending) |
| Sequences | 🔲 UI Shell | Mock data, no backend |
| Campaigns | 🔲 UI Shell | Mock data, no backend |
| AI Assistant | 🔲 UI Shell | Mock data, no OpenAI wired |
| Analytics | 🔲 UI Shell | Mock charts, no real data |
| Integrations | 🔲 UI Shell | No connectors wired |
| Settings | 🔲 UI Shell | No backend |
| Email Sending | 🔲 Not Started | Resend not wired |

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details.
- Discord: [Join our community](https://discord.gg/meraki)

---

<div align="center">
  <p>Built with ❤️ for startups that want to grow</p>
</div>

## Social Publishing

Posts are created under **Dashboard > Social**, must be approved by the workspace **Owner**, then published to connected accounts.

- After pulling: stop the dev server, run `npx prisma generate` and `npm run db:push`.
- Env: `CRON_SECRET` (scheduler auth), `ENCRYPTION_KEY` (token encryption), `OPENAI_API_KEY` (AI drafting), `NEXT_PUBLIC_APP_URL`.
- Schedule `GET /api/social/process` every few minutes with header `Authorization: Bearer <CRON_SECRET>`.
- Accounts are connected by pasted access token (no OAuth yet). YouTube is unsupported, Instagram is image-only, TikTok needs a video URL.
