# Architecture Decision Records (ADR)

Index of accepted decisions for PropAI OS. New ADRs use the template below and increment the number.

**Foundation v0.1** (Phase 1, Days 6–15): ADRs 001–003. **Phase 2+:** start at 004.

---

## Index

| ADR | Title | Status | Date | Summary |
| --- | ----- | ------ | ---- | ------- |
| [001](./001-rls-multi-tenancy.md) | Row-Level Security (RLS) for multi-tenancy | Accepted (POC validated) | 2026-06-02 | `tenant_id` + `app.current_tenant` + `propai_app` role; POC on `test_items` |
| [002](./002-identity-organizations-roles.md) | Identity, organizations, and brokerage roles | Accepted | 2026-06-02 | Better Auth organization plugin; `organization` as tenant root; roles in `@propai/shared` |
| [003](./003-audit-logs.md) | Tenant-scoped audit logs | Accepted | 2026-06-04 | Append-only `audit_logs` with RLS; `GET /v1/audit-logs`; `audit:read` RBAC |

### Planned (Phase 2+)

| ADR | Title | Status | Target phase |
| --- | ----- | ------ | ------------ |
| 004 | Properties schema & RLS | Proposed | Phase 2 — Days 16–18 |
| 005 | Object storage (R2) for listing photos | Proposed | Phase 2 — Days 19–21 |
| 006 | AI workers & feature flags | Proposed | Phase 3+ |

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
