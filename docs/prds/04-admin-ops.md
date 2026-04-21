# PRD 04 — Admin / Operations Console

## Purpose

Give internal staff (analysts, validators, coordinators, admins) the cockpit they need to move cases through the state machine without losing accuracy, time, or trust. The console is **dense, keyboard-first, and unapologetically utilitarian** — Bloomberg-terminal energy, not Linear-clone.

## Roles

| Role | Capabilities |
| --- | --- |
| `coordinator` | Triage queues, assign cases, send outreach, manage SLA breaches |
| `analyst` | Extract entries, validate uploads, draft Readiness Reports |
| `validator` | QA pass on Readiness Reports, sign-off authority |
| `admin` | Everything + role management, refund/credit issuance, system config |

Roles managed in Clerk org (per ADR 004) and enforced inside contexts (not just middleware).

## Case state machine (the spine)

Encoded in XState (per ADR 008). See `src/contexts/ops/case-machine.ts`.

| State | Meaning | Entry conditions | Exit transitions |
| --- | --- | --- | --- |
| `new_lead` | Screener completed | Email captured | → `qualified` / `disqualified` |
| `qualified` | Likely eligible | Result computed | → `awaiting_purchase` |
| `disqualified` | Not currently eligible | Result computed | → (terminal, opt-in for re-engagement) |
| `awaiting_purchase` | Result delivered, no paid step yet | Lifecycle email sent | → `awaiting_docs` |
| `awaiting_docs` | Recovery purchased, awaiting customer uploads | Stripe webhook | → `entry_recovery_in_progress` |
| `entry_recovery_in_progress` | Analyst working the case | First doc uploaded or staff claim | → `entry_list_ready` / `stalled` |
| `entry_list_ready` | Validated entry list available | Analyst sign-off | → `awaiting_prep_purchase` |
| `awaiting_prep_purchase` | Recovery done, prep not bought | Hand-off | → `cape_prep_in_progress` |
| `cape_prep_in_progress` | Validator running, draft report | Stripe webhook | → `batch_qa` |
| `batch_qa` | QA pass underway | Validator triggered | → `submission_ready` / `cape_prep_in_progress` |
| `submission_ready` | Artifacts available to customer | Validator sign-off | → `concierge_active` / `filed` |
| `concierge_active` | High-touch support engaged | Concierge purchased | → `filed` |
| `filed` | Customer (or partner) submitted | Customer marks filed | → `pending_cbp` |
| `pending_cbp` | Awaiting CBP response | Filing recorded | → `paid` / `deficient` |
| `deficient` | CBP rejected / requested more | CBP response | → `cape_prep_in_progress` (re-prep) |
| `paid` | Refund received | Customer or coordinator confirms | → `closed` (success-fee invoiced) |
| `stalled` | No activity past SLA | Inngest cadence | → resumes any prior state |
| `closed` | Terminal | All work done | (terminal) |

Every transition emits an `audit_log` row + an Inngest event. No state changes outside the machine.

## Queues

| Queue | Owners | Default SLA |
| --- | --- | --- |
| New leads | Coordinator | 2 hours first touch |
| Recovery orders (paid) | Analyst | 4 business hours first touch |
| Doc upload review | Analyst | Same business day |
| Entry extraction | Analyst | 24–48 hours completion |
| CSV / readiness prep | Validator | 24 hours |
| QA | Validator | Same day |
| Stalled | Coordinator | 48h / 96h / day-7 cadence |

SLA timers are surfaced on every case row in the queue list, color-coded against the policy.

## Screens

### Queue list

- Three-column table: case ID (mono), state (status pill in state color), SLA timer (mono, color-coded).
- Filters at top: state, queue, owner, SLA-status, customer.
- Saved views (e.g., "My open recovery cases", "Breached SLAs").
- Keyboard: `j/k` row nav, `enter` open, `c` claim, `o` open in new tab.

### Case workspace

A three-pane layout that adapts to the case's current state:

- **Left** — case header (ID, customer, state, SLA), action panel (transitions allowed from current state, claim, escalate), notes log.
- **Center** — state-specific work surface (entry-extraction form when in recovery; entry table when in prep; Readiness Report editor when in QA).
- **Right** — document viewer (side-by-side with the work surface), audit log, comments.

### Document viewer

- PDF preview at full fidelity.
- Zoom, page nav, search.
- Side-by-side with extraction form so analyst eyes never leave the screen.
- Highlight + copy-to-form interaction (drag a region of the PDF, value flows to focused form field).

### Inspector / detail panel

- Full case timeline (every state transition + actor).
- Document list with provenance.
- Linked Stripe events (purchases, refunds, credits, success-fee invoices).
- Internal notes log (markdown supported, @-mentions for staff).

### Admin views

- Role management.
- Refund / credit issuance UI (Stripe-backed).
- SLA policy config.
- System health (Inngest queue depth, Sentry error rate).

## QA checklist (the validator's gate)

Codified in the validator workflow. Cannot mark a batch `submission_ready` without:

- All entry numbers in valid format.
- No duplicates.
- All entries within IEEPA window.
- Phase flags separated correctly.
- Batch size within recommended threshold (or analyst note explaining).
- Duty values present (or low-confidence flag with note).
- ACE status known.
- ACH status known.
- Filing actor identified.
- Reviewing analyst signed off with timestamp.

## Domain model additions

```ts
StaffUser = { id, clerkUserId, role, name, active }

CaseAssignment = { caseId, staffUserId, queue, claimedAt, releasedAt? }

NoteEntry = { id, caseId, authorId, body, createdAt, mentions[] }

AuditLogRow = { id, caseId, actorId, kind, fromState?, toState?, payload jsonb, occurredAt }
```

## Acceptance criteria

- **Given** a coordinator views the queue,
  **When** an SLA is within 1 hour of breach,
  **Then** the row renders in the warning color and surfaces in the "At-Risk" saved view.
- **Given** an analyst attempts to transition a case to `submission_ready`,
  **When** any QA checklist item is missing,
  **Then** the action is rejected and the missing items are listed.
- **Given** a case enters `stalled`,
  **When** the cadence Inngest workflow fires at 48h, 96h, day-7,
  **Then** the appropriate follow-up action is queued and the audit log records each fire.
- **Given** an admin issues a refund,
  **When** the refund posts in Stripe,
  **Then** the local `Payment` aggregate updates and the audit log records the actor + reason.
- **Given** a staff user without `validator` role attempts QA sign-off,
  **When** they click sign-off,
  **Then** the action is rejected with a permission error and an audit row is recorded.

## Edge case inventory

- Two staff claim the same case simultaneously → first write wins, second sees claim conflict; audit row.
- A staff member leaves the org → cases reassigned to coordinator queue automatically; audit row.
- Customer messages staff via email reply → currently stored in case notes via mailbox forwarding (Phase 1).
- Manual state correction needed (admin override) → explicit "Force transition" action, requires reason, audit log captures full context.
- Case is opened by a partner / agency on behalf of a customer → partner role (Phase 3); v1 ignores.
- Invalid state-machine input via direct API call → rejected with structured error; never throws unhandled.
- High queue depth → queue list pagination + warm-cached counts.
- Time zone for SLA → policy stored in UTC with display in viewer's TZ.
- Concurrent edits to Readiness Report → row-level optimistic locking + conflict resolution UI.
- Inngest outage → state machine still works; reminder cadences resume on recovery.
- Dark-mode parity required (staff often work late) — both modes designed, not auto-derived.
- Onboarding new staff → in-app keyboard shortcut overlay (`?`).
- Audit log immutability — append-only table; no DELETE permission for any role.
- Stripe webhook re-deliveries → idempotency on case-side handlers via event id.

## Design notes (taste)

### Skills

- **Taste**: `industrial-brutalist-ui`, **Swiss Industrial Print mode only** (degradation effects disabled). The entire ops console is the Bloomberg-terminal surface.
- **Pair with**: `full-output-enforcement` for queue-list virtualization, three-pane workspace shell, audit-log viewer — every component is dense and long.
- **Other**: `test-driven-development` for the case state machine (`@xstate/test` model-based), the SLA-timer math, queue-permission rules. `software-architecture` when shaping the public surface of `src/contexts/ops/`.
- **Bug + QA gates** (mandatory for ops console PRs): `qa-monkey` to proactively stress-test every state-machine transition and concurrency edge before merge; `debugger` for any reactive production-bug investigation (the audit log is the primary instrumentation surface); `judge` as the final gate before merge — the ops console is high-stakes because it controls customer artifacts.
- **Cross-cutting** (per `docs/SKILLS-ROUTING.md`): `coder` → `qa-monkey` → `judge` → `ship` is the required pipeline for any ops console PR.
- Invoke via `/taste-skill data-dense ops console with queue list, three-pane case workspace, side-by-side document viewer, audit-log timeline, keyboard-first navigation`.
- **Apply from `industrial-brutalist-ui` Swiss**: rigid CSS Grid (`gap: 1px` over contrasting bg for hairline grid lines), zero `border-radius` on every surface, monospace dominance for case IDs / state tokens / SLA timers / coordinates, generous uppercase tracking on column headers and queue labels, bimodal density (dense tables next to calculated negative space around the action panel), semantic `<data>` / `<output>` / `<dl>` / `<kbd>` markup throughout, visible compartmentalization via solid 1–2px hairlines.
- **Override from `docs/DESIGN-LANGUAGE.md` (binding)**: customs-orange `--accent` substitutes for aviation hazard red `#E61919`. **No** CRT scanlines, halftone overlays, 1-bit dithering, ASCII brackets `[ ... ]`, viewport-bleeding numerals (clamp 4rem–15rem reserved for the queue's count headline only and capped at 4rem), randomized "REV / UNIT" decoration strings. **No** Tactical Telemetry dark mode at v1; dark mode is a real designed Swiss-Industrial-Print-on-dark mode (not phosphor green CRT).

### Aesthetic intent

- Density is the point. The console looks like a Bloomberg terminal because the work demands it.
- Berkeley Mono everywhere a number, ID, or timestamp appears.
- Color used sparingly — only for state pills and SLA risk; everything else is ink-on-paper.
- No animations on the queue list. State changes are instant.
- The shortcut overlay (`?`) is the only friendly surface in the console.

## Out of scope

- Multi-tenant partner staff — Phase 3 (PRD 09).
- Mobile ops UI — staff work on desktop.
- AI-suggested triage / next-action — Phase 2 (PRD 08).
