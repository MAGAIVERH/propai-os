# Privacy Policy (Draft)

> **Draft for portfolio and demonstration purposes only — not legal advice.** Consult qualified counsel before using this policy in production.

**Effective date:** [TBD]  
**Last updated:** [TBD]  
**Contact:** privacy@propai-os.com

---

## 1. Who we are

PropAI OS (“**PropAI**,” “**we**,” “**us**”) provides a business-to-business (B2B) software platform for **licensed real estate brokerages and their authorized users** in the United States. PropAI OS is a **technology tool**; we are **not** a real estate brokerage, agent, lender, or appraiser.

This Privacy Policy describes how PropAI collects, uses, and shares information when brokerages and their users use our dashboard, API, workers, and related services (collectively, the “**Service**”).

When a brokerage (“**Customer**,” “**organization**,” or “**tenant**”) uses the Service, PropAI typically processes personal information **on behalf of that Customer**. Customers are responsible for their own privacy notices to leads, clients, and website visitors.

---

## 2. Information we collect

### 2.1 Account and organization data

- Name, email address, phone number, and role (e.g., Owner, Manager, Agent, Viewer)
- Organization name, address, license identifiers (if provided), branding, and billing contact
- Authentication credentials and session data (managed via our auth provider)

### 2.2 CRM and lead data (Customer content)

Customers and their users may store:

- Lead and contact information (e.g., name, email, phone, message content, source, preferences)
- Activity history (calls, notes, tasks, pipeline stage changes)
- Assignment and team metadata

### 2.3 Property and listing data (Customer content)

- Property descriptions, photos, pricing, location (address, city, state, ZIP), and US market fields (e.g., bedrooms, bathrooms, square footage)
- Media uploaded for listings (stored in object storage with access controls)

### 2.4 Marketplace and public interactions

- Information voluntarily submitted on public interest forms (e.g., name, email, phone, message, property reference)
- Technical data: IP address, browser type, device identifiers, and referral URLs (for security and analytics)

### 2.5 AI-related processing

When enabled, we may process photos and text to generate listing suggestions, embeddings for semantic search, lead scores, and non-binding price estimates. AI processing runs **asynchronously**; outputs are suggestions requiring human review.

### 2.6 Payment and billing

Subscription and payment data are processed by **Stripe**. PropAI receives limited billing metadata (e.g., customer ID, plan status, last four digits of card if applicable) — not full payment card numbers stored by PropAI.

### 2.7 Logs and security

- Server logs, error reports, and audit events (e.g., sign-in, permission changes)
- Data necessary to detect abuse, enforce terms, and maintain multi-tenant isolation

---

## 3. How we use information

We use information to:

- Provide, operate, and improve the Service (CRM, pipeline, marketplace integration, API, WebSocket updates)
- Authenticate users and enforce organization-level access controls and **Row-Level Security (RLS)** at the database layer
- Process Customer content, including AI features gated by feature flags (e.g., `ENABLE_AI_VISION`)
- Communicate about the Service (product updates, security notices, support)
- Comply with law, respond to lawful requests, and protect rights, safety, and integrity of the platform
- Analyze aggregated, de-identified usage to improve reliability and features

We do **not** sell personal information.

---

## 4. How we share information

We share information only as described below:

| Category           | Examples                                                                                           | Purpose                                                    |
| ------------------ | -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| **Infrastructure** | Cloud hosting (e.g., Vercel), database (e.g., Neon PostgreSQL), cache/queues (e.g., Upstash Redis) | Run the Service                                            |
| **Storage**        | Object storage (e.g., Cloudflare R2 or AWS S3)                                                     | Property photos and uploads                                |
| **Email**          | Transactional email (e.g., Resend)                                                                 | Invitations, notifications                                 |
| **AI providers**   | OpenAI, Anthropic, or similar (when enabled)                                                       | Vision, embeddings, scoring — under Customer configuration |
| **Observability**  | Error monitoring (e.g., Sentry)                                                                    | Diagnose outages and bugs                                  |
| **Payments**       | Stripe                                                                                             | Subscriptions and invoicing                                |
| **Legal**          | Courts, regulators, law enforcement                                                                | When required by law or to protect rights                  |

We require subprocessors to protect data under contractual terms appropriate to their role. A production vendor list will be maintained at [TBD URL].

We may share information in connection with a merger, acquisition, or asset sale, with notice where required by law.

---

## 5. Retention

- **Account data:** retained while the organization has an active subscription and for a reasonable period afterward for backup, legal, and dispute resolution.
- **Customer content (leads, listings):** retained according to Customer settings and applicable law; Customers may export or request deletion subject to their internal policies.
- **Logs:** retained for a limited period (e.g., 30–90 days) unless longer retention is required for security investigations.
- **AI inputs/outputs:** retained only as needed to provide the feature and improve quality; Customers may disable AI features via configuration.

---

## 6. Security

We implement technical and organizational measures designed to protect data, including encryption in transit (TLS), access controls, tenant isolation via `organization_id` and RLS, and least-privilege access for operations staff. No method of transmission or storage is 100% secure.

---

## 7. Your rights and choices

Depending on applicable US state privacy laws (e.g., California CPRA, Virginia VCDPA, Colorado CPA), individuals may have rights to access, correct, delete, or opt out of certain processing.

Because PropAI often processes data **on behalf of brokerages**:

- **Leads and consumers** should contact the **brokerage** that collected their information first.
- **Brokerage users** may contact their organization administrator or PropAI at privacy@propai-os.com for platform-level requests.

We will respond to verified requests within timeframes required by law.

---

## 8. Children

The Service is not directed to children under 13, and we do not knowingly collect personal information from children.

---

## 9. International users

The Service is intended for US brokerages and US-market property data. If data is processed outside the United States by subprocessors, we rely on appropriate safeguards as required by law.

---

## 10. Changes to this policy

We may update this Privacy Policy from time to time. We will post the revised policy with a new “Last updated” date and, for material changes, provide notice through the Service or email where appropriate.

---

## 11. Contact us

**PropAI OS**  
Email: privacy@propai-os.com  
[Mailing address — TBD]
