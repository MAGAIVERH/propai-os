# Architecture Decision Records (ADR)

Index of accepted decisions for PropAI OS. New ADRs use the template below and increment the number.

**Foundation v0.1** (Phase 1, Days 6–15): ADRs 001–003. **Phase 2:** ADR 004+.

---

## Index

| ADR | Title | Status | Date | Summary |
| --- | ----- | ------ | ---- | ------- |
| [001](./001-rls-multi-tenancy.md) | Row-Level Security (RLS) for multi-tenancy | Accepted (POC validated) | 2026-06-02 | `tenant_id` + `app.current_tenant` + `propai_app` role; POC on `test_items` |
| [002](./002-identity-organizations-roles.md) | Identity, organizations, and brokerage roles | Accepted | 2026-06-02 | Better Auth organization plugin; `organization` as tenant root; roles in `@propai/shared` |
| [003](./003-audit-logs.md) | Tenant-scoped audit logs | Accepted | 2026-06-04 | Append-only `audit_logs` with RLS; `GET /v1/audit-logs`; `audit:read` RBAC |
| [004](./004-properties-schema.md) | Properties schema and RLS | Accepted | 2026-06-05 | `properties` + child tables; direct vs parent-scoped RLS; US fields; migration `0007_properties` |
| [005](./005-object-storage-r2.md) | Object storage (R2) for listing photos | Accepted | 2026-06-05 | Private bucket; presigned PUT/GET; key `tenant/{id}/property/{id}/{uuid}.ext`; 10 MB image/* |
| [006](./006-ai-vision-listings.md) | AI vision for property listings | Accepted | 2026-06-13 | Gemini Flash async via BullMQ; rate limit 10/hour/tenant; `ENABLE_AI_VISION` flag; SSRF guard |
| [007](./007-semantic-search-pgvector.md) | Semantic search with pgvector | Accepted | 2026-06-13 | `text-embedding-3-small` (1536d); ivfflat index; public `GET /search/semantic`; hybrid SQL filters |
| [008](./008-hybrid-search-ranking.md) | Hybrid search ranking | Accepted | 2026-06-24 | Re-rank pgvector pool: semantic 40% + price 20% + distance 20% + recency 20%; `sort` options |

See [PHASE-2-PLAN.md](../PHASE-2-PLAN.md) and [FOUNDATION-SIGNOFF.md](../FOUNDATION-SIGNOFF.md).

---

## Template for ADR 004+

Copy into `docs/adr/NNN-short-title.md`:

```markdown
# ADR NNN: [Title]

**Status:** Proposed | Accepted | Superseded  
**Date:** YYYY-MM-DD  
**Context:** [Phase / Day — what problem or constraint triggered this decision]

---

## Decision

[What we chose — tables, APIs, libraries, boundaries.]

---

## Consequences

### Positive

- …

### Negative / follow-ups

- …

---

## References

- [Related ADR](./00X-….md)
- Code paths (`packages/…`, `apps/…`)
```

**Naming:** `NNN-kebab-case-topic.md` (three-digit prefix, zero-padded).

**When to write an ADR:** cross-cutting infra (RLS, auth, storage), security boundaries, or anything hard to reverse without migration pain.

---

## Related

| Document | Purpose |
| -------- | ------- |
| [architecture.md](../architecture.md) | Product + RLS data plane diagrams |
| [BACKEND-FOUNDATION-CHECKLIST.md](../BACKEND-FOUNDATION-CHECKLIST.md) | Phase 1 verification |
| [releases/foundation-v0.1.0.md](../releases/foundation-v0.1.0.md) | Tag `foundation-v0.1.0` |
