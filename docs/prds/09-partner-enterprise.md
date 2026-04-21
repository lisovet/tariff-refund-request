# PRD 09 — Partner & Enterprise (Phase 3)

## Purpose

Once the recovery + prep + concierge motion is operationally repeatable, scale via channels that already serve our ICP — agencies, brokers, 3PLs, and accountants. Enterprise comes after the partner motion proves out.

This PRD is **Phase 3** (months 6–12). It is documented now so that v1 architecture (modular monolith, role model, multi-tenant readiness) does not foreclose it.

## Near-term partner strategy

Lead with channel partners that already touch our ICP:

- **Ecommerce agencies** (Shopify Plus partners, growth agencies).
- **Customs brokers** who want to offer refund prep without building it.
- **3PLs** with importer customer bases.
- **Accountants and fractional CFOs** who serve SMB importers.

Do **not** lead with enterprise direct sales. We are not staffed for it and the playbook is wrong-shaped.

## Partner offers

### Tier 1 — Referral

- Public referral link with attribution (`?ref=<partner>`).
- Partner dashboard surfaces referred leads, stage, revenue share.
- Revenue share: 15–25% of stage payments for first 12 months per referred customer.
- No white-labeling; partner is visible to customer as the referrer.

### Tier 2 — Co-branded

- Partner-branded screener embedded on the partner's site.
- Customer experience carries partner logo + customer-of co-branding.
- Partner sees customer activity in their dashboard.
- Higher revenue share (25–35%).

### Tier 3 — White-label (Phase 3 late)

- Full partner-branded experience.
- Partner is the brand; we are infrastructure.
- Pricing negotiated per-partner; we operate the back office.
- Requires multi-tenant architecture and carefully scoped data isolation.

## Enterprise (later)

When partner motion is proven, enterprise becomes possible because:

- Multi-entity reporting can be added (parent IOR with child entities).
- Approval workflows can be added on top of the existing case state machine.
- Portfolio-level dashboards become the new view.
- Custom contracts replace stage-based pricing.

We do not pursue enterprise until at least three of: (a) partner pipeline producing >30% of new revenue; (b) ops cost-per-case at target; (c) at least one inbound enterprise lead per month; (d) ground-truth dataset large enough that AI assist is meaningfully productive.

## Multi-tenancy architecture (preparatory work in v1)

Every customer-scoped record carries an `orgId` from day one. v1 has one default org per customer; Phase 3 introduces partner-orgs with sub-org customer scoping. Lint rule forbids any query that does not filter by `orgId` (analogous to row-level security).

## Domain model additions (Phase 3)

```ts
PartnerOrg = {
  id, name, tier: 'referral'|'co_branded'|'white_label'
  attributionCode, revShareRate
  brandingConfig?: { logoKey, palette, customDomain? }
}

PartnerStaff = { id, partnerOrgId, clerkUserId, role: 'partner_admin'|'partner_viewer' }

CaseAttribution = { caseId, partnerOrgId, capturedAt }
```

## Partner dashboard (Tier 1+)

- Lead list (referred customers, stage, revenue earned).
- Revenue summary by month.
- Marketing assets library (badges, copy, embed code).
- Settings: payout, branding (Tier 2+).

## Acceptance criteria (Phase 3)

- **Given** a partner referral URL,
  **When** the lead converts to paid,
  **Then** the `CaseAttribution` is recorded and the partner dashboard reflects revenue share.
- **Given** a co-branded embedded screener,
  **When** a lead completes it on the partner's site,
  **Then** the lead carries the partner attribution and the partner branding persists in the customer's first email.
- **Given** a white-label partner,
  **When** their customer logs into the white-labeled app,
  **Then** all surfaces show partner branding and no reference to our brand exists in the customer experience.
- **Given** a partner staff member,
  **When** they query their dashboard,
  **Then** they only see customers attributed to their org (RLS-enforced).

## Edge case inventory

- Partner refers a customer who already exists in our system → attribution applied to new cases only; existing cases unchanged.
- Customer changes their mind about their partner mid-engagement → attribution can be reassigned by admin with audit log.
- Partner staff leaves partner org → access revoked immediately; cases retain attribution.
- Revenue-share dispute → admin override with reason + audit log.
- Tax / 1099 reporting for partner payouts — handled via Stripe Connect or manual at v1.
- White-label CSS conflicts — partner-supplied themes constrained to a token allowlist.
- Custom domain for white-label — handled via Railway custom-domain assignment; SSL automated.
- Partner mass-uploads cases (bulk lead import) — supported via CSV import endpoint in Phase 3.
- Partner data export — full export of their attributed cases on request.
- Anti-abuse: partner fakes referrals — rate limits + manual review for suspicious patterns.

## Design notes

### Skills (Phase 3)

- **Taste — partner referral / co-branded screener embed**: `minimalist-ui` (mirrors the marketing/customer surfaces from PRDs 01 + 05).
- **Taste — partner dashboard** (lead list, revenue summary, marketing assets): `industrial-brutalist-ui` Swiss mode (inherits ops console rules from PRD 04 — partner dashboard is a data surface, not a marketing surface).
- **Taste — white-label**: same as above; only `--accent` and the logo are partner-overridable. Typography, layout, motion stay ours.
- **Pair with**: `full-output-enforcement` for the dashboard tables and embedded screener iframe shell.
- **Other**: `test-driven-development` for attribution capture, revenue-share math, and the partner RLS rules. `software-architecture` when introducing the multi-tenant `orgId` boundary across all contexts. `shopify-expert` when integrating with Shopify Plus partners or building embedded screener variants for ecommerce agencies' Shopify sites — covers Liquid templating, Storefront API, App Bridge, and theme-extension patterns.
- **Multi-tenant QA gates** (mandatory once `orgId` is wired everywhere): `qa-monkey` to stress-test cross-org isolation (data-leak attempts, role-boundary violations, attribution race conditions); `security-review` on every PR that touches the RLS rules or the white-label CSS allowlist; `judge` as the final gate.
- **Override from `docs/DESIGN-LANGUAGE.md`**: white-label CSS allowlist is restricted to two tokens (`--accent`, `--paper`) plus the logo asset — never typography, motion, or layout primitives. Reject any partner asks that would break the editorial-utilitarian contract.

### Aesthetic intent

- Partner dashboard inherits the design language; partner branding overrides only color tokens and the logo, not typography or layout.
- White-label CSS allows partner accent + paper colors; we never expose the rest of the system.

## Out of scope (Phase 3)

- Affiliate marketplace.
- Fully self-serve partner onboarding (until tier 1 proves).
- Custom contracts at scale (handled by ops until volume warrants automation).
