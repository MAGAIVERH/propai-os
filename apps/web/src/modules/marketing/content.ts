import {
  BarChart3,
  Building2,
  Bot,
  CalendarCheck,
  Globe2,
  KanbanSquare,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

/**
 * Static marketing copy for the public landing page. Kept in one place so the
 * page stays SSR-friendly and the copy is easy to review (en-US only).
 */

export const HERO = {
  eyebrow: "The operating system for modern real estate agencies",
  title: "Run your brokerage on one AI-powered platform",
  subtitle:
    "CRM, pipeline, AI listings, and a public marketplace — all in one platform built for US brokerages.",
  primaryCta: { label: "Start free", href: "/signup" },
  secondaryCta: { label: "Sign in", href: "/login" },
  stats: [
    { value: "1 platform", label: "CRM, marketplace & analytics" },
    { value: "Real-time", label: "Live pipeline collaboration" },
    { value: "AI-native", label: "Listings, search & lead scoring" },
  ],
} as const;

export type Feature = {
  icon: typeof Sparkles;
  title: string;
  description: string;
};

export const FEATURES: Feature[] = [
  {
    icon: Bot,
    title: "AI listing generation",
    description:
      "Upload property photos and let computer vision draft the description, features, and SEO title — agents review before publishing.",
  },
  {
    icon: Sparkles,
    title: "Semantic search",
    description:
      "Buyers search in plain English. pgvector embeddings surface the right homes, ranked by relevance, price, and distance.",
  },
  {
    icon: KanbanSquare,
    title: "Real-time CRM pipeline",
    description:
      "A drag-and-drop Kanban that updates live across your team over WebSockets — no refresh, no stale data.",
  },
  {
    icon: Globe2,
    title: "Public marketplace",
    description:
      "An SEO-friendly, server-rendered marketplace where every listing converts visitors into leads in your CRM instantly.",
  },
  {
    icon: BarChart3,
    title: "Analytics & reporting",
    description:
      "Conversion funnels, agent leaderboards, and days-to-close — exportable to CSV for the reports brokerages actually ask for.",
  },
  {
    icon: ShieldCheck,
    title: "Multi-tenant by design",
    description:
      "PostgreSQL Row-Level Security isolates every brokerage at the database layer — defense in depth, not just app code.",
  },
];

export type HowItWorksStep = {
  icon: typeof Building2;
  step: string;
  title: string;
  description: string;
};

export const HOW_IT_WORKS: HowItWorksStep[] = [
  {
    icon: Building2,
    step: "01",
    title: "Create your workspace",
    description:
      "Sign up, name your agency, and invite your agents. A default pipeline and US settings are ready in minutes.",
  },
  {
    icon: Sparkles,
    step: "02",
    title: "List with AI",
    description:
      "Add properties, upload photos, and generate listing copy with AI. Publish to your branded public marketplace.",
  },
  {
    icon: CalendarCheck,
    step: "03",
    title: "Close more deals",
    description:
      "Capture marketplace leads in real time, schedule visits with automated confirmations, and track performance.",
  },
];

export type PricingPlan = {
  name: string;
  price: string;
  cadence: string;
  description: string;
  features: string[];
  cta: { label: string; href: string };
  highlighted: boolean;
};

export const PRICING: PricingPlan[] = [
  {
    name: "Free",
    price: "$0",
    cadence: "forever",
    description: "Everything a small team needs to get started.",
    features: [
      "Up to 5 active listings",
      "Up to 2 agents",
      "Real-time CRM pipeline",
      "Public marketplace listings",
      "AI listing generation",
    ],
    cta: { label: "Start free", href: "/signup" },
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$49",
    cadence: "per month",
    description: "For growing brokerages that need room to scale.",
    features: [
      "Unlimited active listings",
      "Unlimited agents",
      "Semantic marketplace search",
      "Analytics & CSV export",
      "Custom branding & marketplace slug",
      "Priority email support",
    ],
    cta: { label: "Start free trial", href: "/signup" },
    highlighted: true,
  },
];

export type Testimonial = {
  quote: string;
  name: string;
  role: string;
};

export const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "PropAI OS replaced three tools. Our agents live in the pipeline and leads from the marketplace land instantly.",
    name: "Sarah Chen",
    role: "Managing Broker, Summit Realty Group",
  },
  {
    quote:
      "The AI listing flow cut our time-to-publish from an hour to a few minutes. The descriptions are genuinely good.",
    name: "John Martinez",
    role: "Senior Agent, Summit Realty Group",
  },
  {
    quote:
      "Semantic search finally lets buyers describe what they want. It feels like the future of home search.",
    name: "Priya Patel",
    role: "Team Lead, Front Range Homes",
  },
];

export type FaqItem = {
  question: string;
  answer: string;
};

export const FAQ: FaqItem[] = [
  {
    question: "Is PropAI OS a licensed brokerage?",
    answer:
      "No. PropAI OS is software for brokerages and agents — a tool to manage listings, leads, and your public marketplace. It is not a licensed real estate brokerage.",
  },
  {
    question: "Do I need a credit card to start?",
    answer:
      "No. The Free plan is available with no credit card. Upgrade to Pro whenever your team outgrows the Free limits.",
  },
  {
    question: "How does multi-tenancy keep my data private?",
    answer:
      "Every brokerage is isolated at the database level using PostgreSQL Row-Level Security. Queries always run within your tenant context, so one agency can never see another's data.",
  },
  {
    question: "What do the AI features cost me?",
    answer:
      "AI listing generation and semantic search are included in both plans. We rate-limit AI usage per tenant to keep things fast and predictable.",
  },
  {
    question: "Can buyers find my listings on Google?",
    answer:
      "Yes. The public marketplace is server-rendered with structured data and Open Graph tags, so your listings are indexable and share beautifully on social.",
  },
  {
    question: "Can I export my data?",
    answer:
      "Absolutely. Pro plans can export leads and properties to CSV at any time, respecting your team's roles and permissions.",
  },
];

export const FAIR_HOUSING =
  "Equal Housing Opportunity. PropAI OS does not discriminate based on race, color, religion, sex, handicap, familial status, or national origin.";
