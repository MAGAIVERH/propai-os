/**
 * Seeds a realistic US demo tenant (Summit Realty Group) by driving the real
 * API endpoints via app.inject() — the exact code paths the product uses. This
 * guarantees the demo owner can actually sign in and that RLS, pipeline seeding,
 * notifications, and billing gates all behave like production.
 *
 * Run: pnpm db:seed   (DEMO_EMAIL / DEMO_PASSWORD configurable via env)
 *
 * Idempotent: if the demo owner already exists, the script logs and exits 0.
 * Reset the database to re-seed from scratch.
 */
import { buildApp } from "../src/app.js";
import { normalizeCookieHeader } from "../src/lib/forward-auth-cookies.js";

type App = Awaited<ReturnType<typeof buildApp>>;

const ORIGIN = "http://localhost:3333";

const DEMO_EMAIL = process.env.DEMO_EMAIL ?? "demo@propai.io";
const DEMO_PASSWORD = process.env.DEMO_PASSWORD ?? "DemoPass123!";
const ORG_NAME = "Summit Realty Group";

const AGENT = {
  name: "John Martinez",
  email: "john.martinez@summit-realty.demo",
  password: "DemoPass123!",
};

function headers(cookie?: string): Record<string, string> {
  const h: Record<string, string> = { origin: ORIGIN, "content-type": "application/json" };
  if (cookie) h.cookie = cookie;
  return h;
}

async function post(app: App, url: string, payload: unknown, cookie?: string) {
  return app.inject({ method: "POST", url, headers: headers(cookie), payload });
}

async function getJson(app: App, url: string, cookie?: string) {
  return app.inject({ method: "GET", url, headers: headers(cookie) });
}

function isoInDays(days: number, hour = 14): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

type PropertySeed = {
  title: string;
  description: string;
  type: "single_family" | "condo" | "townhouse" | "multi_family";
  status: "draft" | "active" | "under_contract" | "sold";
  priceUsdCents: number;
  rentOrSale: "sale" | "rent";
  bedrooms: number;
  bathrooms: string;
  sqFt: number;
  yearBuilt: number;
  addressLine1: string;
  city: string;
  state: string;
  zipCode: string;
  latitude: number;
  longitude: number;
};

// 6 listings, only 4 "active" to respect the Free plan gate (max 5 active).
const PROPERTIES: PropertySeed[] = [
  {
    title: "Charming Bungalow on Pearl Street",
    description:
      "Sun-filled craftsman bungalow steps from downtown Boulder. Hardwood floors, updated kitchen, and a landscaped backyard perfect for entertaining.",
    type: "single_family",
    status: "active",
    priceUsdCents: 62_500_000,
    rentOrSale: "sale",
    bedrooms: 3,
    bathrooms: "2",
    sqFt: 1842,
    yearBuilt: 1968,
    addressLine1: "1842 Pearl St",
    city: "Boulder",
    state: "CO",
    zipCode: "80302",
    latitude: 40.0193,
    longitude: -105.2756,
  },
  {
    title: "Modern Downtown Condo with Skyline Views",
    description:
      "Two-bedroom condo in the heart of Denver with floor-to-ceiling windows, a chef's kitchen, and access to a rooftop pool and gym.",
    type: "condo",
    status: "active",
    priceUsdCents: 48_900_000,
    rentOrSale: "sale",
    bedrooms: 2,
    bathrooms: "2",
    sqFt: 1180,
    yearBuilt: 2017,
    addressLine1: "1750 Wewatta St #1204",
    city: "Denver",
    state: "CO",
    zipCode: "80202",
    latitude: 39.7531,
    longitude: -105.0008,
  },
  {
    title: "Spacious Townhome near Wash Park",
    description:
      "Three-story townhome with an attached garage, rooftop deck, and an open floor plan. Walk to Washington Park and local cafes.",
    type: "townhouse",
    status: "active",
    priceUsdCents: 71_500_000,
    rentOrSale: "sale",
    bedrooms: 3,
    bathrooms: "3.5",
    sqFt: 2100,
    yearBuilt: 2015,
    addressLine1: "455 S Gaylord St",
    city: "Denver",
    state: "CO",
    zipCode: "80209",
    latitude: 39.7008,
    longitude: -104.9617,
  },
  {
    title: "Bright East Austin Rental",
    description:
      "Stylish two-bedroom rental minutes from East 6th Street. Private yard, in-unit laundry, and a dedicated home-office nook.",
    type: "single_family",
    status: "active",
    priceUsdCents: 210_000,
    rentOrSale: "rent",
    bedrooms: 2,
    bathrooms: "1",
    sqFt: 980,
    yearBuilt: 1995,
    addressLine1: "2207 E Cesar Chavez St",
    city: "Austin",
    state: "TX",
    zipCode: "78702",
    latitude: 30.2562,
    longitude: -97.7211,
  },
  {
    title: "Renovated Duplex in Capitol Hill",
    description:
      "Income-producing duplex with two updated units, separate utilities, and off-street parking. A turnkey investment opportunity.",
    type: "multi_family",
    status: "under_contract",
    priceUsdCents: 85_000_000,
    rentOrSale: "sale",
    bedrooms: 4,
    bathrooms: "2",
    sqFt: 2600,
    yearBuilt: 1929,
    addressLine1: "1240 N Pennsylvania St",
    city: "Denver",
    state: "CO",
    zipCode: "80203",
    latitude: 39.7331,
    longitude: -104.9806,
  },
  {
    title: "Mountain-View Ranch in Golden",
    description:
      "Single-level ranch on a quarter-acre lot with unobstructed foothill views, a two-car garage, and a newly updated primary suite.",
    type: "single_family",
    status: "sold",
    priceUsdCents: 67_900_000,
    rentOrSale: "sale",
    bedrooms: 4,
    bathrooms: "3",
    sqFt: 2250,
    yearBuilt: 1988,
    addressLine1: "780 Lookout Mountain Rd",
    city: "Golden",
    state: "CO",
    zipCode: "80401",
    latitude: 39.7555,
    longitude: -105.2211,
  },
];

type LeadSeed = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  source: string;
  stage: string; // pipeline stage name
  propertyIndex?: number;
  assignTo: "owner" | "agent";
  notes?: string;
  note?: string; // activity note
  scheduleVisitInDays?: number;
};

const LEADS: LeadSeed[] = [
  { firstName: "Emily", lastName: "Carter", email: "emily.carter@example.com", phone: "(720) 555-0142", source: "Marketplace", stage: "New", propertyIndex: 0, assignTo: "agent", notes: "Relocating from Chicago, pre-approved.", note: "Submitted interest via the marketplace listing." },
  { firstName: "Michael", lastName: "Nguyen", email: "michael.nguyen@example.com", phone: "(303) 555-0188", source: "Referral", stage: "New", propertyIndex: 1, assignTo: "owner", notes: "Referred by past client." },
  { firstName: "Jessica", lastName: "Brown", email: "jessica.brown@example.com", phone: "(720) 555-0110", source: "Marketplace", stage: "Contacted", propertyIndex: 2, assignTo: "agent", note: "Left a voicemail and sent listing details by email." },
  { firstName: "David", lastName: "Kim", email: "david.kim@example.com", phone: "(512) 555-0173", source: "Website", stage: "Contacted", propertyIndex: 3, assignTo: "owner", notes: "Interested in the East Austin rental." },
  { firstName: "Olivia", lastName: "Martinez", email: "olivia.martinez@example.com", phone: "(303) 555-0156", source: "Marketplace", stage: "Visit Scheduled", propertyIndex: 0, assignTo: "agent", scheduleVisitInDays: 2, note: "Confirmed availability for a weekend showing." },
  { firstName: "James", lastName: "Wilson", email: "james.wilson@example.com", phone: "(720) 555-0199", source: "Open House", stage: "Visit Scheduled", propertyIndex: 2, assignTo: "owner", scheduleVisitInDays: 4 },
  { firstName: "Sophia", lastName: "Garcia", email: "sophia.garcia@example.com", phone: "(303) 555-0124", source: "Referral", stage: "Negotiation", propertyIndex: 1, assignTo: "agent", notes: "Submitted an offer; awaiting counter.", note: "Buyer offered $475k, discussing terms." },
  { firstName: "Daniel", lastName: "Lee", email: "daniel.lee@example.com", phone: "(512) 555-0137", source: "Marketplace", stage: "Negotiation", propertyIndex: 4, assignTo: "owner", scheduleVisitInDays: 6 },
  { firstName: "Ava", lastName: "Thompson", email: "ava.thompson@example.com", phone: "(720) 555-0165", source: "Website", stage: "Won", propertyIndex: 5, assignTo: "agent", notes: "Closed — congratulations!", note: "Deal closed and keys handed over." },
  { firstName: "Ethan", lastName: "Davis", email: "ethan.davis@example.com", phone: "(303) 555-0181", source: "Referral", stage: "Won", propertyIndex: 2, assignTo: "owner" },
  { firstName: "Mia", lastName: "Rodriguez", email: "mia.rodriguez@example.com", phone: "(512) 555-0148", source: "Marketplace", stage: "Lost", propertyIndex: 3, assignTo: "agent", notes: "Chose another brokerage." },
  { firstName: "Noah", lastName: "Anderson", email: "noah.anderson@example.com", phone: "(720) 555-0102", source: "Cold Call", stage: "New", assignTo: "owner", notes: "Just browsing for now." },
];

async function main(): Promise<void> {
  const app = await buildApp();
  const created = { properties: 0, leads: 0, activities: 0, visits: 0 };

  try {
    // 1) Owner sign-up (creates org + owner + password).
    const signUp = await post(app, "/api/auth/brokerage-sign-up", {
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      name: "Sarah Chen",
      organizationName: ORG_NAME,
    });

    if (signUp.statusCode !== 201) {
      const detail = (() => {
        try {
          return JSON.stringify(signUp.json());
        } catch {
          return signUp.body;
        }
      })();
      console.log(
        `Demo owner sign-up returned ${signUp.statusCode} (likely already seeded). ` +
          `Reset the database to re-seed.\n${detail}`,
      );
      return;
    }

    const ownerCookie = normalizeCookieHeader(signUp.headers["set-cookie"]);
    if (!ownerCookie) throw new Error("Owner session cookie missing after sign-up.");

    const ownerSession = (await getJson(app, "/api/auth/get-session", ownerCookie).then((r) =>
      r.json(),
    )) as { user?: { id?: string } };
    const ownerId = ownerSession.user?.id ?? null;

    // 2) Invite + onboard the agent (John Martinez).
    let agentId: string | null = null;
    const invite = await post(app, "/api/auth/brokerage-invite", {
      email: AGENT.email,
      role: "agent",
    }, ownerCookie);

    if (invite.statusCode === 201) {
      const invitationId = (invite.json() as { invitation: { id: string } }).invitation.id;
      const agentSignUp = await post(app, "/api/auth/sign-up/email", {
        email: AGENT.email,
        password: AGENT.password,
        name: AGENT.name,
      });
      const agentCookie = normalizeCookieHeader(agentSignUp.headers["set-cookie"]);
      if (agentCookie) {
        await post(app, "/api/auth/organization/accept-invitation", { invitationId }, agentCookie);
        const agentSession = (await getJson(app, "/api/auth/get-session", agentCookie).then((r) =>
          r.json(),
        )) as { user?: { id?: string } };
        agentId = agentSession.user?.id ?? null;
      }
    } else {
      console.warn(`Agent invite returned ${invite.statusCode}; continuing without agent.`);
    }

    // 3) Pipeline stages (seeded automatically for a new org).
    const stagesRes = await getJson(app, "/v1/pipeline-stages", ownerCookie);
    const stages = (stagesRes.json() as { stages: Array<{ id: string; name: string }> }).stages;
    const stageByName = new Map(stages.map((s) => [s.name.toLowerCase(), s.id]));

    // 4) Properties.
    const propertyIds: string[] = [];
    for (const p of PROPERTIES) {
      const res = await post(app, "/v1/properties", p, ownerCookie);
      if (res.statusCode === 201) {
        propertyIds.push((res.json() as { property: { id: string } }).property.id);
        created.properties += 1;
      } else {
        console.warn(`Property "${p.title}" returned ${res.statusCode} (skipped).`);
        propertyIds.push("");
      }
    }

    // 5) Leads (+ activities + visits).
    for (const l of LEADS) {
      const stageId = stageByName.get(l.stage.toLowerCase());
      const assignedAgentId = l.assignTo === "agent" ? (agentId ?? ownerId) : ownerId;
      const propertyId =
        l.propertyIndex !== undefined ? propertyIds[l.propertyIndex] || undefined : undefined;

      const payload: Record<string, unknown> = {
        firstName: l.firstName,
        lastName: l.lastName,
        email: l.email,
        phone: l.phone,
        source: l.source,
      };
      if (stageId) payload.stageId = stageId;
      if (assignedAgentId) payload.assignedAgentId = assignedAgentId;
      if (propertyId) payload.propertyId = propertyId;
      if (l.notes) payload.notes = l.notes;

      const res = await post(app, "/v1/leads", payload, ownerCookie);
      if (res.statusCode !== 201) {
        console.warn(`Lead ${l.firstName} ${l.lastName} returned ${res.statusCode} (skipped).`);
        continue;
      }
      created.leads += 1;
      const leadId = (res.json() as { lead: { id: string } }).lead.id;

      if (l.note) {
        const a = await post(app, `/v1/leads/${leadId}/activities`, { type: "note", content: l.note }, ownerCookie);
        if (a.statusCode === 201) created.activities += 1;
      }

      if (l.scheduleVisitInDays !== undefined && propertyId) {
        const v = await post(
          app,
          `/v1/leads/${leadId}/schedule-visit`,
          {
            scheduledAt: isoInDays(l.scheduleVisitInDays),
            timezone: "America/Denver",
            propertyId,
            notes: "Property showing scheduled with the buyer.",
          },
          ownerCookie,
        );
        if (v.statusCode === 201) created.visits += 1;
        else console.warn(`Visit for ${l.firstName} returned ${v.statusCode} (skipped).`);
      }
    }

    console.log("\nDemo seed complete — Summit Realty Group\n");
    console.log(`  Owner login:  ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
    console.log(`  Agent login:  ${AGENT.email} / ${AGENT.password}`);
    console.log(`  Properties:   ${created.properties}`);
    console.log(`  Leads:        ${created.leads}`);
    console.log(`  Activities:   ${created.activities}`);
    console.log(`  Visits:       ${created.visits}`);
    console.log("");
  } finally {
    await app.close();
  }
}

main()
  .then(() => {
    // buildApp() opens long-lived handles (Redis/BullMQ, WebSocket) that keep
    // the event loop alive, so exit explicitly once seeding is done.
    process.exit(0);
  })
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exit(1);
  });
