/**
 * Populates an EXISTING tenant with realistic demo data — properties (with real
 * photos uploaded to MinIO/S3), leads across the pipeline, lead activities, and
 * property-view analytics — so the dashboard, properties, and leads screens can
 * be reviewed with content.
 *
 * Writes go through the app role with RLS (runInTenantContext), exactly like the
 * API, and images use the same object-key format the product uses, so the
 * gallery's presigned downloads resolve.
 *
 * Run:  pnpm --filter @propai/api tsx scripts/seed-magaiver.ts
 * Target defaults to the "magaiver test" tenant; override with SEED_TENANT_ID /
 * SEED_OWNER_ID. Idempotent: skips if the tenant already has properties.
 */
import { randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { CreateBucketCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import {
  analyticsEvents,
  closeDb,
  leadActivities,
  leads,
  pipelineStages,
  properties,
  propertyImages,
  runInTenantContext,
} from "@propai/db";

import { getStorageConfig } from "../src/lib/storage-config.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "../../..");
const LISTINGS_DIR = resolve(REPO_ROOT, "apps/web/public/listings");

// Load the monorepo .env into process.env (overrides shell so DATABASE_* point
// local and S3_* are available). The app DB role is always localhost propai_app.
function loadRootEnv() {
  const envPath = resolve(REPO_ROOT, ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    process.env[k] = v;
  }
}
loadRootEnv();

const TENANT_ID = (process.env.SEED_TENANT_ID ?? "843f3fa5-5aa7-4ba9-8b80-c8c552cd8b55").toLowerCase();
const OWNER_ID = process.env.SEED_OWNER_ID ?? "b65dfd62-b6a0-4672-8905-3714ce0c3dd6";

const daysAgo = (n: number, hour = 12): Date => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, Math.floor(Math.random() * 60), 0, 0);
  return d;
};

type PropSeed = {
  title: string;
  description: string;
  type: "single_family" | "condo" | "townhouse" | "multi_family";
  status: "draft" | "active" | "under_contract" | "sold" | "rented";
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
  latitude: string;
  longitude: string;
  images: string[];
};

const PROPS: PropSeed[] = [
  {
    title: "Glasswall Modern with Canyon Views",
    description:
      "A glass-and-limestone statement home where every principal room opens to the canyon. Walls of glass, an infinity pool, and a spa-like primary wing.",
    type: "single_family", status: "active", priceUsdCents: 425_000_000, rentOrSale: "sale",
    bedrooms: 5, bathrooms: "6", sqFt: 6400, yearBuilt: 2019,
    addressLine1: "1180 Bel Air Rd", city: "Los Angeles", state: "CA", zipCode: "90077",
    latitude: "34.0966", longitude: "-118.4300",
    images: ["listing-04.jpg", "listing-17.jpg", "listing-03.jpg"],
  },
  {
    title: "Cedar Hill Modern Farmhouse",
    description:
      "A warm modern farmhouse on a quiet Atherton lane, wrapped in cedar and light. Wide-plank oak floors and a covered loggia for dinners outdoors.",
    type: "single_family", status: "active", priceUsdCents: 298_000_000, rentOrSale: "sale",
    bedrooms: 4, bathrooms: "4", sqFt: 4100, yearBuilt: 2016,
    addressLine1: "72 Isabella Ave", city: "Atherton", state: "CA", zipCode: "94027",
    latitude: "37.4560", longitude: "-122.1977",
    images: ["listing-11.jpg", "listing-13.jpg", "listing-06.jpg"],
  },
  {
    title: "Downtown Condo with Skyline Views",
    description:
      "Two-bedroom condo in the heart of Denver with floor-to-ceiling windows, a chef's kitchen, and a rooftop pool and gym.",
    type: "condo", status: "active", priceUsdCents: 48_900_000, rentOrSale: "sale",
    bedrooms: 2, bathrooms: "2", sqFt: 1180, yearBuilt: 2017,
    addressLine1: "1750 Wewatta St #1204", city: "Denver", state: "CO", zipCode: "80202",
    latitude: "39.7531", longitude: "-105.0008",
    images: ["listing-12.jpg", "listing-08.jpg", "listing-14.jpg"],
  },
  {
    title: "Spacious Townhome near Wash Park",
    description:
      "Three-story townhome with an attached garage, rooftop deck, and an open floor plan. Walk to Washington Park and local cafes.",
    type: "townhouse", status: "active", priceUsdCents: 71_500_000, rentOrSale: "sale",
    bedrooms: 3, bathrooms: "3.5", sqFt: 2100, yearBuilt: 2015,
    addressLine1: "455 S Gaylord St", city: "Denver", state: "CO", zipCode: "80209",
    latitude: "39.7008", longitude: "-104.9617",
    images: ["listing-21.jpg", "listing-15.jpg", "listing-02.jpg"],
  },
  {
    title: "Lakeview Contemporary on Lake Austin",
    description:
      "A crisp contemporary perched above Lake Austin with water views from nearly every room, a cantilevered deck, and a private path to a shared dock.",
    type: "single_family", status: "active", priceUsdCents: 189_500_000, rentOrSale: "sale",
    bedrooms: 4, bathrooms: "3", sqFt: 3500, yearBuilt: 2018,
    addressLine1: "3402 Scenic Dr", city: "Austin", state: "TX", zipCode: "78703",
    latitude: "30.2988", longitude: "-97.7876",
    images: ["listing-16.jpg", "listing-18.jpg", "listing-05.jpg"],
  },
  {
    title: "Ridgecrest Desert-Modern Villa",
    description:
      "A desert-modern villa framed by Camelback Mountain, with clean stucco volumes, a negative-edge pool, ramada, and outdoor kitchen for year-round living.",
    type: "single_family", status: "under_contract", priceUsdCents: 510_000_000, rentOrSale: "sale",
    bedrooms: 5, bathrooms: "6", sqFt: 7200, yearBuilt: 2020,
    addressLine1: "5800 E Cheney Dr", city: "Paradise Valley", state: "AZ", zipCode: "85253",
    latitude: "33.5312", longitude: "-111.9560",
    images: ["listing-08.jpg", "listing-12.jpg", "listing-17.jpg"],
  },
  {
    title: "Renovated Duplex in Capitol Hill",
    description:
      "Income-producing duplex with two updated units, separate utilities, and off-street parking. A turnkey investment opportunity.",
    type: "multi_family", status: "sold", priceUsdCents: 85_000_000, rentOrSale: "sale",
    bedrooms: 4, bathrooms: "2", sqFt: 2600, yearBuilt: 1929,
    addressLine1: "1240 N Pennsylvania St", city: "Denver", state: "CO", zipCode: "80203",
    latitude: "39.7331", longitude: "-104.9806",
    images: ["listing-19.jpg", "listing-07.jpg", "listing-10.jpg"],
  },
  {
    title: "Harborlight Furnished Townhome",
    description:
      "A light-filled townhome steps from the Sausalito waterfront, offered furnished for a turnkey move, with a rooftop terrace facing the skyline.",
    type: "townhouse", status: "active", priceUsdCents: 680_000, rentOrSale: "rent",
    bedrooms: 3, bathrooms: "3", sqFt: 2900, yearBuilt: 2014,
    addressLine1: "80 Liberty Ship Way", city: "Sausalito", state: "CA", zipCode: "94965",
    latitude: "37.8591", longitude: "-122.4853",
    images: ["listing-15.jpg", "listing-21.jpg", "listing-13.jpg"],
  },
];

type LeadSeed = {
  firstName: string; lastName: string; email: string; phone: string;
  source: string; stage: string; propertyIndex?: number; aiScore: number;
  createdDaysAgo: number; note?: string; visit?: boolean;
};

const LEADS: LeadSeed[] = [
  { firstName: "Emily", lastName: "Carter", email: "emily.carter@example.com", phone: "(720) 555-0142", source: "Marketplace", stage: "New", propertyIndex: 0, aiScore: 88, createdDaysAgo: 1, note: "Submitted interest via the marketplace listing." },
  { firstName: "Noah", lastName: "Anderson", email: "noah.anderson@example.com", phone: "(720) 555-0102", source: "Cold Call", stage: "New", aiScore: 34, createdDaysAgo: 2 },
  { firstName: "Michael", lastName: "Nguyen", email: "michael.nguyen@example.com", phone: "(303) 555-0188", source: "Referral", stage: "New", propertyIndex: 2, aiScore: 71, createdDaysAgo: 3, note: "Referred by a past client." },
  { firstName: "Jessica", lastName: "Brown", email: "jessica.brown@example.com", phone: "(720) 555-0110", source: "Marketplace", stage: "Contacted", propertyIndex: 3, aiScore: 64, createdDaysAgo: 5, note: "Left a voicemail and emailed listing details." },
  { firstName: "David", lastName: "Kim", email: "david.kim@example.com", phone: "(512) 555-0173", source: "Website", stage: "Contacted", propertyIndex: 4, aiScore: 52, createdDaysAgo: 6 },
  { firstName: "Olivia", lastName: "Martinez", email: "olivia.martinez@example.com", phone: "(303) 555-0156", source: "Marketplace", stage: "Visit Scheduled", propertyIndex: 0, aiScore: 79, createdDaysAgo: 8, note: "Confirmed a weekend showing.", visit: true },
  { firstName: "James", lastName: "Wilson", email: "james.wilson@example.com", phone: "(720) 555-0199", source: "Open House", stage: "Visit Scheduled", propertyIndex: 1, aiScore: 68, createdDaysAgo: 9, visit: true },
  { firstName: "Sophia", lastName: "Garcia", email: "sophia.garcia@example.com", phone: "(303) 555-0124", source: "Referral", stage: "Negotiation", propertyIndex: 2, aiScore: 91, createdDaysAgo: 12, note: "Buyer offered $475k; discussing terms." },
  { firstName: "Daniel", lastName: "Lee", email: "daniel.lee@example.com", phone: "(512) 555-0137", source: "Marketplace", stage: "Negotiation", propertyIndex: 4, aiScore: 83, createdDaysAgo: 14 },
  { firstName: "Ava", lastName: "Thompson", email: "ava.thompson@example.com", phone: "(720) 555-0165", source: "Website", stage: "Won", propertyIndex: 6, aiScore: 95, createdDaysAgo: 18, note: "Deal closed and keys handed over." },
  { firstName: "Ethan", lastName: "Davis", email: "ethan.davis@example.com", phone: "(303) 555-0181", source: "Referral", stage: "Won", propertyIndex: 3, aiScore: 90, createdDaysAgo: 22 },
  { firstName: "Mia", lastName: "Rodriguez", email: "mia.rodriguez@example.com", phone: "(512) 555-0148", source: "Marketplace", stage: "Lost", propertyIndex: 4, aiScore: 28, createdDaysAgo: 20, note: "Chose another brokerage." },
  { firstName: "Liam", lastName: "Walker", email: "liam.walker@example.com", phone: "(720) 555-0133", source: "Marketplace", stage: "Contacted", propertyIndex: 0, aiScore: 74, createdDaysAgo: 4 },
  { firstName: "Charlotte", lastName: "Hall", email: "charlotte.hall@example.com", phone: "(303) 555-0170", source: "Open House", stage: "New", propertyIndex: 7, aiScore: 59, createdDaysAgo: 1 },
];

function pickStageId(stages: { id: string; name: string }[], name: string): string | undefined {
  return stages.find((s) => s.name.toLowerCase() === name.toLowerCase())?.id;
}

async function main() {
  const cfg = getStorageConfig();
  if (!cfg) {
    throw new Error("Storage not configured (S3_* env). Is MinIO running? `docker compose --profile storage up -d`");
  }

  const s3 = new S3Client({
    endpoint: cfg.endpoint,
    region: cfg.region,
    credentials: { accessKeyId: cfg.accessKeyId, secretAccessKey: cfg.secretAccessKey },
    forcePathStyle: true,
  });

  // Ensure the bucket exists.
  try {
    await s3.send(new CreateBucketCommand({ Bucket: cfg.bucket }));
    console.log(`Created bucket ${cfg.bucket}`);
  } catch {
    /* already exists — fine */
  }

  // Guard: skip if already seeded.
  const existing = await runInTenantContext(TENANT_ID, (tx) => tx.select({ id: properties.id }).from(properties));
  if (existing.length >= PROPS.length) {
    console.log(`Tenant already has ${existing.length} properties — skipping. (Reset by deleting them to re-seed.)`);
    return;
  }

  const stages = await runInTenantContext(TENANT_ID, (tx) =>
    tx.select({ id: pipelineStages.id, name: pipelineStages.name }).from(pipelineStages),
  );
  if (stages.length === 0) throw new Error("No pipeline stages for this tenant.");

  const created = { properties: 0, images: 0, leads: 0, activities: 0, views: 0 };
  const propertyIds: string[] = [];

  // 1) Properties + images.
  for (const p of PROPS) {
    const [row] = await runInTenantContext(TENANT_ID, (tx) =>
      tx
        .insert(properties)
        .values({
          tenantId: TENANT_ID,
          createdBy: OWNER_ID,
          title: p.title,
          description: p.description,
          type: p.type,
          status: p.status,
          priceUsdCents: p.priceUsdCents,
          rentOrSale: p.rentOrSale,
          bedrooms: p.bedrooms,
          bathrooms: p.bathrooms,
          sqFt: p.sqFt,
          yearBuilt: p.yearBuilt,
          addressLine1: p.addressLine1,
          city: p.city,
          state: p.state,
          zipCode: p.zipCode,
          latitude: p.latitude,
          longitude: p.longitude,
        })
        .returning({ id: properties.id }),
    );
    if (!row) continue;
    propertyIds.push(row.id);
    created.properties += 1;

    for (let i = 0; i < p.images.length; i++) {
      const file = resolve(LISTINGS_DIR, p.images[i]!);
      if (!existsSync(file)) {
        console.warn(`  image missing: ${p.images[i]}`);
        continue;
      }
      const bytes = readFileSync(file);
      const key = `tenant/${TENANT_ID}/property/${row.id.toLowerCase()}/${randomUUID()}.jpg`;
      await s3.send(
        new PutObjectCommand({ Bucket: cfg.bucket, Key: key, Body: bytes, ContentType: "image/jpeg" }),
      );
      await runInTenantContext(TENANT_ID, (tx) =>
        tx.insert(propertyImages).values({
          propertyId: row.id,
          storageKey: key,
          sortOrder: i,
          isPrimary: i === 0,
        }),
      );
      created.images += 1;
    }
  }

  // 2) Leads (+ activities).
  for (const l of LEADS) {
    const stageId = pickStageId(stages, l.stage);
    const propertyId = l.propertyIndex !== undefined ? propertyIds[l.propertyIndex] : undefined;
    const createdAt = daysAgo(l.createdDaysAgo);

    const [lead] = await runInTenantContext(TENANT_ID, (tx) =>
      tx
        .insert(leads)
        .values({
          tenantId: TENANT_ID,
          firstName: l.firstName,
          lastName: l.lastName,
          email: l.email,
          phone: l.phone,
          source: l.source,
          assignedAgentId: OWNER_ID,
          propertyId: propertyId ?? null,
          stageId: stageId ?? null,
          aiScore: l.aiScore,
          createdAt,
          updatedAt: createdAt,
        })
        .returning({ id: leads.id }),
    );
    if (!lead) continue;
    created.leads += 1;

    if (l.note) {
      await runInTenantContext(TENANT_ID, (tx) =>
        tx.insert(leadActivities).values({
          leadId: lead.id,
          type: "note",
          content: l.note!,
          createdBy: OWNER_ID,
          createdAt,
        }),
      );
      created.activities += 1;
    }
    if (l.visit) {
      await runInTenantContext(TENANT_ID, (tx) =>
        tx.insert(leadActivities).values({
          leadId: lead.id,
          type: "visit_scheduled",
          content: "Property showing scheduled with the buyer.",
          createdBy: OWNER_ID,
          createdAt,
        }),
      );
      created.activities += 1;
    }
  }

  // 3) Property-view analytics for the views chart (~last 30 days).
  const viewRows: { tenantId: string; type: "property_view"; propertyId: string; createdAt: Date }[] = [];
  for (let d = 0; d < 30; d++) {
    const perDay = 3 + Math.floor(Math.random() * 10);
    for (let n = 0; n < perDay; n++) {
      const pid = propertyIds[Math.floor(Math.random() * propertyIds.length)]!;
      viewRows.push({ tenantId: TENANT_ID, type: "property_view", propertyId: pid, createdAt: daysAgo(d, 9 + (n % 10)) });
    }
  }
  await runInTenantContext(TENANT_ID, (tx) => tx.insert(analyticsEvents).values(viewRows));
  created.views = viewRows.length;

  console.log("\nSeed complete — magaiver test Brokerage\n");
  console.log(`  Properties:  ${created.properties}`);
  console.log(`  Images:      ${created.images}`);
  console.log(`  Leads:       ${created.leads}`);
  console.log(`  Activities:  ${created.activities}`);
  console.log(`  Views:       ${created.views}\n`);
}

main()
  .then(async () => {
    await closeDb();
    process.exit(0);
  })
  .catch(async (err: unknown) => {
    console.error(err instanceof Error ? err.stack ?? err.message : String(err));
    await closeDb();
    process.exit(1);
  });
