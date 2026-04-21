# Never auto-submit to CBP

The product **prepares** files. It does not submit. This is a hard rule, both because:
1. We are not licensed customs brokers (legal exposure).
2. Customers explicitly opt to retain submission control (trust posture).

## Forbidden patterns

- Code that calls into CBP submission endpoints (CAPE / ACE submission APIs).
- Workflows that mark a case as `filed` without explicit customer or coordinator action.
- Marketing copy implying "we file your refund."
- Any UI affordance labeled "submit to CBP."

## Permitted patterns

- Generating the CSV artifact for the customer to download.
- Writing instructions on how the customer or their broker submits.
- Recording the customer's confirmation that they (or their broker) filed.
- Coordinating with a partner broker who submits on the customer's behalf (Phase 3).

## Why this matters

Auto-submission would shift legal liability, regulatory burden, and customer-trust dynamics in ways the company is not staffed to handle. It would also break the explicit promise made on the homepage and Readiness Report.

## How to apply

Any PR that touches submission-related code paths must explicitly justify how it preserves this rule. If unsure, stop and ask — never assume the customer or product manager wants auto-submission.
