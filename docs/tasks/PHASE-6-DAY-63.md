# Phase 6 · Day 63 — Team management

> The owner invites and manages agents.

## Tasks
- [x] **T1** — Shared: team/invite/role schemas in `packages/shared/src/settings/settings.ts` (`TeamMember`, `inviteMemberSchema`, `updateMemberRoleSchema`, assignable roles).
- [x] **T2** — API `modules/settings`: `GET /v1/team` (active members + pending invitations), `PATCH /v1/team/members/:id/role` (owner only), `DELETE /v1/team/members/:id` (owner only, can't remove the owner). Audited (`member.role_changed`, `member.removed`).
- [x] **T3** — Invite reuses `POST /api/auth/brokerage-invite` (Better Auth invitation) + the agent-limit feature gate.
- [x] **T4** — Web `/settings/team` (`team-management.tsx`): invite form (email + role), member table with inline role Select + remove, pending-invite badges.

## Done
Owner invites an agent by email → invitation appears as pending → agent signs up and joins the workspace; owner can change roles and remove members. Verified in `settings.integration.test.ts`.
