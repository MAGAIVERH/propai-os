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
    "CRM, pipeline, AI listings, and a public marketplace, all in one platform built for US brokerages.",
  primaryCta: { label: "Start free", href: "/signup" },
  secondaryCta: { label: "Sign in", href: "/login" },
  stats: [
    { value: "1 platform", label: "CRM, marketplace & analytics" },
    { value: "Real-time", label: "Live pipeline collaboration" },
    { value: "AI-native", label: "Listings, search & lead scoring" },
  ],
} as const;

/**
 * Brand statement — the signature display-type moment after the hero
 * (inspired by FIND's "Real Estate, Rewired." and Elyse's giant serif wordmark).
 */
export const STATEMENT = {
  eyebrow: "Our approach",
  leadIn: "Real estate,",
  emphasis: "reimagined.",
  body: "Behind every move is a person, a decision, a new chapter. We pair expert agents with intelligent technology, so finding, buying, and selling a home feels clear, calm, and genuinely yours.",
} as const;

export type LifestyleTile = {
  src: string;
  alt: string;
  caption: string;
};

/**
 * Editorial photo mosaic ("This isn't just about real estate") with staggered
 * reveals — borrows the mixed-size image grid from elyse-residence.
 */
export const LIFESTYLE = {
  heading: "Built around the moments that matter",
  subheading: "This isn't just about software. It's about the homes, the families, and the agents you serve every day.",
  tiles: [
    {
      src: "/listings/listing-04.jpg",
      alt: "Sunlit modern living room with floor-to-ceiling windows",
      caption: "Listings that sell themselves",
    },
    {
      src: "/listings/listing-11.jpg",
      alt: "Architectural home exterior at golden hour",
      caption: "A marketplace buyers trust",
    },
    {
      src: "/listings/listing-17.jpg",
      alt: "Designer kitchen with warm wood and stone finishes",
      caption: "Every lead, captured live",
    },
    {
      src: "/listings/listing-21.jpg",
      alt: "Serene primary suite with a view",
      caption: "Your brand, front and center",
    },
  ] satisfies LifestyleTile[],
} as const;

export type BlogPost = {
  slug: string;
  title: string;
  date: string;
  readableDate: string;
  readingTime: string;
  category: string;
  excerpt: string;
  src: string;
  /** Article body — an ordered list of paragraphs. */
  body: string[];
};

/**
 * Insights & resources — dated article cards (mirrors FIND's blog row). Each has
 * its own reader page at /insights/[slug]. Illustrative content for this demo.
 */
export const BLOG: BlogPost[] = [
  {
    slug: "ai-listing-copy-time-to-publish",
    title: "How AI listing copy changes time-to-publish",
    date: "2026-05-18",
    readableDate: "May 18, 2026",
    readingTime: "4 min read",
    category: "Product",
    excerpt:
      "We benchmarked agents writing listings by hand against PropAI's vision-to-copy flow. The gap is wider than we expected.",
    src: "/listings/listing-06.jpg",
    body: [
      "Writing a great listing has always been a quiet tax on an agent's week. A strong description takes research, a good ear for a neighborhood, and the patience to make a floor plan sound like a home. Multiply that by every property on the roster and the hours add up fast.",
      "We ran a simple experiment. Twelve agents wrote listings the way they always had — from notes, photos, and memory. Then the same agents used PropAI's vision-to-copy flow, where the model drafts a description, a feature list, and an SEO title directly from the photos, and the agent edits before publishing.",
      "The hand-written listings averaged just over an hour each. With PropAI, the first usable draft landed in under two minutes, and the final, agent-approved copy shipped in roughly eight. The words weren't just faster — reviewers rated the AI-assisted descriptions as clearer and more consistent across the portfolio.",
      "The point isn't to replace the agent's judgment. It's to move the starting line. When the blank page is already a solid draft, the agent spends their time on the part only they can do: the local knowledge, the honest framing, and the final polish that makes a listing feel trustworthy.",
    ],
  },
  {
    slug: "what-buyers-type-into-semantic-search",
    title: "What buyers actually type into semantic search",
    date: "2026-05-02",
    readableDate: "May 2, 2026",
    readingTime: "5 min read",
    category: "Research",
    excerpt:
      "Plain-English queries reveal what shoppers really want, and why keyword filters have been quietly failing them for years.",
    src: "/listings/listing-13.jpg",
    body: [
      "For decades, home search meant translating a feeling into a form. You wanted somewhere calm and full of light near good schools, and the website gave you three dropdowns and a price slider. Buyers learned to speak the database's language instead of their own.",
      "Semantic search flips that. When we let shoppers type in plain English, the queries changed completely. People stopped listing bedroom counts and started describing lives: \"a quiet street where my kids can bike,\" \"morning light in the kitchen,\" \"walkable to coffee, room for a home office.\"",
      "Those phrases don't map to a single filter — they map to a dozen signals at once. Embeddings let us rank homes by how well they match the whole intent, not whether they tripped a checkbox. The result is a shortlist that feels curated rather than filtered.",
      "The lesson for brokerages is straightforward: meet buyers in their own words. The teams that do it convert more of the traffic they already have, because the first page of results finally looks like what the buyer pictured.",
    ],
  },
  {
    slug: "brokerage-tech-stack-consolidated",
    title: "The brokerage tech stack, consolidated",
    date: "2026-04-21",
    readableDate: "April 21, 2026",
    readingTime: "6 min read",
    category: "Operations",
    excerpt:
      "CRM, marketplace, analytics, billing. A look at how teams collapse five subscriptions into one operating system.",
    src: "/listings/listing-19.jpg",
    body: [
      "Ask a growing brokerage what software it runs and you'll usually get a list: a CRM here, a listings site there, a spreadsheet for analytics, a separate tool for scheduling, and something for billing that nobody enjoys. Each was a reasonable choice on its own. Together, they leak data at every seam.",
      "The hidden cost isn't the subscriptions — it's the copying. A lead comes in through the marketplace, gets re-typed into the CRM, gets lost between the agent's inbox and the pipeline, and finally surfaces in a report that's already a week old.",
      "Consolidation isn't about having fewer logos on an invoice. It's about one source of truth. When the marketplace, the pipeline, and the analytics share the same data, a lead is live the moment it's created, and the numbers a broker sees at the end of the month are the same numbers the team acted on all along.",
      "That's the whole idea behind an operating system for a brokerage: not a bigger tool, but a quieter one — where the work flows through a single place and the team spends its energy on clients instead of on keeping systems in sync.",
    ],
  },
];

export const NEWSLETTER = {
  heading: "Get the brokerage playbook",
  subheading: "Occasional notes on AI, listings, and running a modern real estate team. No spam.",
  placeholder: "you@brokerage.com",
  cta: "Subscribe",
  success: "You're on the list. Talk soon.",
} as const;

/**
 * "Why PropAI" — a left label + a large scroll-filled statement, mirroring
 * findrealestate.com's "Your life's changing…" reveal block.
 */
export const WHY = {
  label: "Why PropAI",
  statement:
    "Your brokerage is changing. The tools shouldn't hold it back — they should move it forward, with clarity, speed, and one source of truth your whole team can trust.",
  media: "/listings/listing-02.jpg",
  mediaAlt: "Aerial view of a residential neighborhood at dusk",
} as const;

/**
 * Dark "services" band with giant single-word labels (Buy/Sell/Rent on FIND →
 * List/Match/Close for us) and a scroll-filled closing line.
 */
export type ServicePillar = {
  number: string;
  word: string;
  description: string;
};

export const SERVICES = {
  label: "What it does",
  pillars: [
    {
      number: "01",
      word: "List",
      description:
        "Turn photos into publish-ready listings with AI, then push them to a branded marketplace built to convert.",
    },
    {
      number: "02",
      word: "Match",
      description:
        "Plain-English semantic search connects buyers to the right homes, ranked by relevance, price, and distance.",
    },
    {
      number: "03",
      word: "Close",
      description:
        "A real-time pipeline and live analytics keep every lead moving, so your team closes more in less time.",
    },
  ] satisfies ServicePillar[],
  closing:
    "One platform guides your brokerage through every stage of the deal, with intelligence and support at each step.",
  cta: { label: "Start free", href: "/signup" },
} as const;

/** Full-bleed closing CTA over an image, with a scroll-filled headline. */
export const FINAL_CTA = {
  headline: "Run your brokerage on PropAI. We'll help you get there.",
  cta: { label: "Let's get started", href: "/signup" },
  media: "/listings/listing-14.jpg",
  mediaAlt: "Warm, light-filled living space",
} as const;

export type Market = {
  name: string;
  tagline: string;
  count: string;
  src: string;
};

/** Explore by market — the country's most coveted addresses. */
export const MARKETS: Market[] = [
  { name: "New York", tagline: "Manhattan & Brooklyn", count: "320+ homes", src: "/markets/newyork.jpg" },
  { name: "Los Angeles", tagline: "The Hills & the coast", count: "280+ homes", src: "/markets/losangeles.jpg" },
  { name: "Miami", tagline: "Waterfront living", count: "190+ homes", src: "/markets/miami.jpg" },
  { name: "Aspen", tagline: "Mountain retreats", count: "75+ homes", src: "/markets/aspen.jpg" },
];

export type BrokerageService = {
  label: string;
  title: string;
  description: string;
  src: string;
  href: string;
};

/** What the brokerage does for clients — a scrollable rail of service cards. */
export const BROKERAGE_SERVICES: BrokerageService[] = [
  {
    label: "Buy",
    title: "Find your next home",
    description:
      "From the first search to the closing table, our agents and intelligent search surface the right homes and guide every step.",
    src: "/listings/listing-04.jpg",
    href: "/listings",
  },
  {
    label: "Sell",
    title: "Sell for more, with less stress",
    description:
      "Polished listings, a marketplace buyers trust, and pricing backed by real market data, so your home stands out and moves faster.",
    src: "/listings/listing-11.jpg",
    href: "/contact",
  },
  {
    label: "Rent",
    title: "Rent with confidence",
    description:
      "Browse verified rentals and connect with agents who know the neighborhood, the building, and the fine print.",
    src: "/listings/listing-15.jpg",
    href: "/listings",
  },
  {
    label: "Invest",
    title: "Build a portfolio that performs",
    description:
      "Data-backed guidance on yield, appreciation, and timing, so every acquisition earns its place in your portfolio.",
    src: "/listings/listing-08.jpg",
    href: "/listings",
  },
  {
    label: "New developments",
    title: "Be first through the door",
    description:
      "Early access to pre-construction and new-build inventory, with the floor plans and incentives before they go public.",
    src: "/listings/listing-12.jpg",
    href: "/listings",
  },
  {
    label: "Relocation",
    title: "Land softly in a new city",
    description:
      "Neighborhood matchmaking, remote tours, and on-the-ground agents who make an out-of-state move feel effortless.",
    src: "/listings/listing-21.jpg",
    href: "/contact",
  },
];

export const SOCIAL_LINKS = [
  { label: "Twitter", href: "https://twitter.com" },
  { label: "Instagram", href: "https://instagram.com" },
  { label: "LinkedIn", href: "https://linkedin.com" },
  { label: "YouTube", href: "https://youtube.com" },
] as const;

/**
 * Scroll-driven product showcase. As the section is pinned, these steps
 * crossfade their image + copy one after another.
 */
export type ShowcaseStep = {
  eyebrow: string;
  title: string;
  description: string;
  src: string;
};

export const SHOWCASE: ShowcaseStep[] = [
  {
    eyebrow: "Consult",
    title: "Tell us what moves you.",
    description:
      "We start with a conversation about your goals, your timeline, and your must-haves. No pressure, just a clear plan for what comes next.",
    src: "/listings/listing-04.jpg",
  },
  {
    eyebrow: "Discover",
    title: "See the right homes, faster.",
    description:
      "Your agent, backed by intelligent search, surfaces homes that truly fit. You spend your time only on the ones worth seeing.",
    src: "/listings/listing-11.jpg",
  },
  {
    eyebrow: "Tour",
    title: "Walk through with an expert.",
    description:
      "Private showings and honest guidance, with answers to the questions that matter before you fall in love with a place.",
    src: "/listings/listing-03.jpg",
  },
  {
    eyebrow: "Close",
    title: "Move forward with confidence.",
    description:
      "From offer to keys in hand, we handle the details and negotiate hard on your behalf, so closing day feels like a celebration.",
    src: "/listings/listing-21.jpg",
  },
];

export type Story = {
  name: string;
  role: string;
  quote: string;
  /** Portrait photo in /public/avatars. */
  avatar: string;
};

/** Interactive "stories" wall — illustrative quotes for this portfolio demo. */
export const STORIES: Story[] = [
  { name: "Sarah Chen", role: "Managing Broker, Summit Realty", quote: "PropAI replaced three tools. Our agents live in the pipeline and marketplace leads land instantly.", avatar: "/avatars/sarah.jpg" },
  { name: "John Martinez", role: "Senior Agent, Summit Realty", quote: "The AI listing flow cut our time-to-publish from an hour to minutes. The copy is genuinely good.", avatar: "/avatars/john.jpg" },
  { name: "Priya Patel", role: "Team Lead, Front Range Homes", quote: "Semantic search finally lets buyers describe what they want. It feels like the future of home search.", avatar: "/avatars/priya.jpg" },
  { name: "Marcus Lee", role: "Founder, Harbor & Co.", quote: "We onboarded the whole team in an afternoon. It just made sense.", avatar: "/avatars/marcus.jpg" },
  { name: "Elena Rossi", role: "Luxury Specialist", quote: "My listings have never looked this polished. Clients notice the difference right away.", avatar: "/avatars/elena.jpg" },
  { name: "David Okafor", role: "Broker-Owner", quote: "The analytics tell me exactly where deals stall. That alone paid for the platform.", avatar: "/avatars/david.jpg" },
  { name: "Amelia Stone", role: "Agent, Lakeside Group", quote: "Leads from the marketplace hit my phone before the buyer closes the tab.", avatar: "/avatars/amelia.jpg" },
  { name: "Tomás Rivera", role: "Sales Director", quote: "One source of truth for the entire brokerage. Calm, finally.", avatar: "/avatars/tomas.jpg" },
  { name: "Grace Kim", role: "Operations Lead", quote: "Setup was effortless and support actually answers. A rare combination.", avatar: "/avatars/grace.jpg" },
  { name: "Noah Bennett", role: "Independent Agent", quote: "I look like a 20-person team. Buyers can't tell I'm solo.", avatar: "/avatars/noah.jpg" },
];

/** Trust band — illustrative figures for this portfolio demo. */
export const STATS = [
  { value: "$2.4B", label: "In closed volume" },
  { value: "1,800+", label: "Homes sold" },
  { value: "98%", label: "Client satisfaction" },
  { value: "40+", label: "Markets served" },
] as const;

export type Listing = {
  slug: string;
  src: string;
  /** Extra photos for the detail-page gallery. */
  gallery?: string[];
  price: string;
  title: string;
  location: string;
  beds: number;
  baths: number;
  sqft: string;
  status?: "New" | "Featured";
  /** For-sale by default; some homes are rentals. */
  kind?: "For sale" | "For rent";
  description?: string;
  features?: string[];
};

/**
 * Featured listings for the landing grid, each with its own detail page at
 * /listings/[slug]. Illustrative data for this portfolio demo; imagery is mock
 * property photography that real brokerages will replace with their own.
 */
export const LISTINGS: Listing[] = [
  {
    slug: "glasswall-residence",
    src: "/listings/listing-04.jpg",
    gallery: ["/listings/listing-17.jpg", "/listings/listing-03.jpg", "/listings/listing-21.jpg"],
    price: "$4,250,000",
    title: "Glasswall Residence",
    location: "Bel Air, Los Angeles",
    beds: 5,
    baths: 6,
    sqft: "6,400 sqft",
    status: "Featured",
    kind: "For sale",
    description:
      "A glass-and-limestone statement set behind private gates in Bel Air, where every principal room opens to the canyon view. Walls of glass dissolve the line between the great room and the infinity pool, and the primary suite reads like a private wing with its own terrace and spa bath.",
    features: [
      "Floor-to-ceiling glass throughout",
      "Infinity-edge pool & spa",
      "Chef's kitchen with dual islands",
      "Home theater & wellness room",
      "4-car gallery garage",
      "Smart-home automation",
    ],
  },
  {
    slug: "cedar-hill-house",
    src: "/listings/listing-11.jpg",
    gallery: ["/listings/listing-13.jpg", "/listings/listing-06.jpg", "/listings/listing-19.jpg"],
    price: "$2,980,000",
    title: "Cedar Hill House",
    location: "Atherton, California",
    beds: 4,
    baths: 4,
    sqft: "4,100 sqft",
    status: "New",
    kind: "For sale",
    description:
      "A warm modern farmhouse on a quiet Atherton lane, wrapped in cedar and light. Wide-plank oak floors run from the open kitchen to a covered loggia, and mature oaks shade a level backyard made for long dinners outdoors.",
    features: [
      "Cedar-clad modern exterior",
      "Open kitchen with pantry",
      "Covered outdoor loggia",
      "Level, oak-shaded lot",
      "Detached studio office",
      "Top-rated school district",
    ],
  },
  {
    slug: "the-oakline-estate",
    src: "/listings/listing-12.jpg",
    gallery: ["/listings/listing-08.jpg", "/listings/listing-14.jpg", "/listings/listing-02.jpg"],
    price: "$3,640,000",
    title: "The Oakline Estate",
    location: "Aspen, Colorado",
    beds: 6,
    baths: 5,
    sqft: "5,800 sqft",
    kind: "For sale",
    description:
      "A mountain retreat minutes from downtown Aspen, built for both deep winters and long summers. Vaulted timber ceilings frame the range beyond, and the ski-room, hot tub, and heated drive make coming home after a day on the slopes effortless.",
    features: [
      "Vaulted timber great room",
      "Ski room & heated driveway",
      "Outdoor hot tub & fire pit",
      "Chef's kitchen with butler's pantry",
      "Bunk room for guests",
      "Minutes to the gondola",
    ],
  },
  {
    slug: "lakeview-modern",
    src: "/listings/listing-21.jpg",
    gallery: ["/listings/listing-15.jpg", "/listings/listing-04.jpg", "/listings/listing-11.jpg"],
    price: "$1,895,000",
    title: "Lakeview Modern",
    location: "Lake Austin, Texas",
    beds: 4,
    baths: 3,
    sqft: "3,500 sqft",
    status: "New",
    kind: "For sale",
    description:
      "A crisp contemporary perched above Lake Austin, with water views from nearly every room. An open plan flows to a cantilevered deck, and a private path leads down to a shared dock and swimming cove.",
    features: [
      "Panoramic lake views",
      "Cantilevered entertaining deck",
      "Shared dock & swim cove",
      "Floor-to-ceiling windows",
      "Two-story great room",
      "EV-ready garage",
    ],
  },
  {
    slug: "ridgecrest-villa",
    src: "/listings/listing-08.jpg",
    gallery: ["/listings/listing-12.jpg", "/listings/listing-17.jpg", "/listings/listing-03.jpg"],
    price: "$5,100,000",
    title: "Ridgecrest Villa",
    location: "Paradise Valley, Arizona",
    beds: 5,
    baths: 6,
    sqft: "7,200 sqft",
    status: "Featured",
    kind: "For sale",
    description:
      "A desert-modern villa framed by Camelback Mountain, where clean stucco volumes open to resort-style grounds. A disappearing glass wall connects the great room to a negative-edge pool, ramada, and outdoor kitchen for year-round entertaining.",
    features: [
      "Camelback Mountain views",
      "Negative-edge pool & ramada",
      "Disappearing glass walls",
      "Casita guest house",
      "Outdoor kitchen & fireplace",
      "Motor court with 5-car garage",
    ],
  },
  {
    slug: "harborlight-townhome",
    src: "/listings/listing-15.jpg",
    gallery: ["/listings/listing-21.jpg", "/listings/listing-13.jpg", "/listings/listing-06.jpg"],
    price: "$6,800/mo",
    title: "Harborlight Townhome",
    location: "Sausalito, California",
    beds: 3,
    baths: 3,
    sqft: "2,900 sqft",
    kind: "For rent",
    description:
      "A light-filled townhome steps from the Sausalito waterfront, offered furnished for a turnkey move. Bay windows catch the morning fog burning off the water, and a rooftop terrace looks straight across to the city skyline.",
    features: [
      "Furnished, turnkey rental",
      "Rooftop skyline terrace",
      "Steps to the waterfront",
      "Two-car garage",
      "In-unit laundry",
      "Available immediately",
    ],
  },
];

/** Look up a single listing by its slug (for the detail route). */
export function getListing(slug: string): Listing | undefined {
  return LISTINGS.find((listing) => listing.slug === slug);
}

/** Look up a single insight article by slug (for the reader route). */
export function getPost(slug: string): BlogPost | undefined {
  return BLOG.find((post) => post.slug === slug);
}

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
      "No. PropAI OS is software for brokerages and agents, a tool to manage listings, leads, and your public marketplace. It is not a licensed real estate brokerage.",
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
