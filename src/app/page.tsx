import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Sparkles,
  Users,
  Mail,
  Zap,
  BarChart3,
  MessageSquare,
  Shield,
  ArrowRight,
  CheckCircle,
  Star,
} from 'lucide-react'

const features = [
  {
    icon: Users,
    title: 'Lead Generation',
    description:
      'Automatically capture and enrich leads from LinkedIn, website forms, and multiple channels.',
  },
  {
    icon: Zap,
    title: 'Automated Sequences',
    description:
      'Create multi-step email and LinkedIn sequences that nurture leads on autopilot.',
  },
  {
    icon: Sparkles,
    title: 'AI-Powered Content',
    description:
      'Generate personalized emails, messages, and follow-ups with AI assistance.',
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description:
      'Track every metric that matters - from lead sources to conversion rates.',
  },
  {
    icon: MessageSquare,
    title: 'Multi-Channel Outreach',
    description:
      'Reach prospects via email, LinkedIn, and more from a single platform.',
  },
  {
    icon: Shield,
    title: 'CRM Integration',
    description:
      'Seamlessly sync with HubSpot, Salesforce, and other popular CRMs.',
  },
]

const testimonials = [
  {
    quote:
      "Meraki transformed our outbound sales. We've 3x our qualified leads in just 2 months.",
    author: 'Sarah Chen',
    role: 'VP Sales, TechCorp',
    avatar: 'SC',
  },
  {
    quote:
      'The AI content suggestions are incredible. Every email feels personally crafted.',
    author: 'Michael Rodriguez',
    role: 'Founder, Startup Labs',
    avatar: 'MR',
  },
  {
    quote:
      'Finally, a growth platform that actually understands B2B sales cycles.',
    author: 'Emma Thompson',
    role: 'Head of Growth, RecruitPro',
    avatar: 'ET',
  },
]

const pricing = [
  {
    name: 'Starter',
    price: 49,
    description: 'Perfect for small teams getting started',
    features: [
      '1,000 leads',
      '5 email sequences',
      '500 AI credits/month',
      'Email support',
    ],
  },
  {
    name: 'Growth',
    price: 149,
    description: 'For growing teams ready to scale',
    features: [
      '10,000 leads',
      'Unlimited sequences',
      '2,000 AI credits/month',
      'LinkedIn integration',
      'Priority support',
    ],
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 399,
    description: 'For large teams with advanced needs',
    features: [
      'Unlimited leads',
      'Unlimited sequences',
      'Unlimited AI credits',
      'Custom integrations',
      'Dedicated success manager',
      'SSO & advanced security',
    ],
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold">Meraki</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-sm text-gray-600 hover:text-gray-900">
                Features
              </a>
              <a href="#pricing" className="text-sm text-gray-600 hover:text-gray-900">
                Pricing
              </a>
              <a href="#testimonials" className="text-sm text-gray-600 hover:text-gray-900">
                Testimonials
              </a>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/dashboard">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 to-white py-20 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Your AI-Powered
              <span className="text-blue-600"> Growth Engine</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
              Automate lead generation, nurturing, and sales with intelligent sequences.
              Turn prospects into customers while you focus on closing deals.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link href="/dashboard">
                <Button size="lg" className="h-12 px-8">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="h-12 px-8">
                Watch Demo
              </Button>
            </div>
            <p className="mt-4 text-sm text-gray-500">
              No credit card required. 14-day free trial.
            </p>
          </div>

          {/* Dashboard Preview */}
          <div className="mt-16 rounded-xl border bg-gray-900 p-2 shadow-2xl">
            <div className="rounded-lg bg-gray-800 p-4">
              <div className="flex items-center space-x-2">
                <div className="h-3 w-3 rounded-full bg-red-500" />
                <div className="h-3 w-3 rounded-full bg-yellow-500" />
                <div className="h-3 w-3 rounded-full bg-green-500" />
              </div>
              <div className="mt-4 grid grid-cols-4 gap-4">
                {[
                  { label: 'Total Leads', value: '2,847' },
                  { label: 'Emails Sent', value: '12,543' },
                  { label: 'Meetings Booked', value: '186' },
                  { label: 'Conversion Rate', value: '4.2%' },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-lg bg-gray-700 p-4">
                    <p className="text-sm text-gray-400">{stat.label}</p>
                    <p className="mt-1 text-2xl font-bold text-white">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need to grow
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
              A complete platform for lead generation, nurturing, and conversion
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                  <feature.icon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="bg-gray-50 py-20 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Trusted by growth teams
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
              See what our customers have to say
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-3">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.author}
                className="rounded-xl bg-white p-6 shadow-sm"
              >
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-5 w-5 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                <p className="mt-4 text-gray-600">"{testimonial.quote}"</p>
                <div className="mt-6 flex items-center space-x-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-600">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-medium">{testimonial.author}</p>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Simple, transparent pricing
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
              Choose the plan that's right for your team
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-3">
            {pricing.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-xl border p-8 ${
                  plan.popular
                    ? 'border-blue-600 ring-2 ring-blue-600'
                    : 'border-gray-200'
                }`}
              >
                {plan.popular && (
                  <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-600">
                    Most Popular
                  </span>
                )}
                <h3 className="mt-4 text-lg font-semibold">{plan.name}</h3>
                <p className="mt-2 text-sm text-gray-600">{plan.description}</p>
                <p className="mt-6">
                  <span className="text-4xl font-bold">${plan.price}</span>
                  <span className="text-gray-500">/month</span>
                </p>
                <ul className="mt-8 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-8 w-full"
                  variant={plan.popular ? 'default' : 'outline'}
                >
                  Get Started
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-600 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Ready to accelerate your growth?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-blue-100">
            Join thousands of sales teams using Meraki to convert more leads.
          </p>
          <div className="mt-8">
            <Link href="/dashboard">
              <Button size="lg" variant="secondary" className="h-12 px-8">
                Start Your Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold">Meraki</span>
            </div>
            <p className="text-sm text-gray-500">
              &copy; 2026 Meraki. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
