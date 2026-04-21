# PRD 08 — AI / Document Intelligence (Phase 2+)

## Purpose

Apply AI to bend the operational cost curve **after** the manual workflow is repeatable. AI roadmap follows the human workflow exactly — every automation candidate must first exist as a documented manual step that an analyst performs reliably. This is explicitly **Phase 2**: not in the MVP, not in the first 90 days.

## Guiding principle

> AI accelerates a known good workflow. It does not invent the workflow.

Anti-pattern we are explicitly avoiding: starting with an "AI-first" pipeline that does not match how humans actually solve the problem. That builds the wrong tool and erodes trust.

## What AI **does not** do — ever

These remain human-only by design:

- Final filing-readiness sign-off.
- Edge-case eligibility judgement.
- Dispute / rejection response writing.
- Final claim amount assertion when ambiguous.
- Customer-facing legal-like guidance.
- Decisions that affect refund timing or amount where the customer cannot see the rationale.

## What AI **does** do (Phase 2)

| Task | MVP (manual) | Phase 2 (AI-assisted) | Phase 3 (mostly auto) |
| --- | --- | --- | --- |
| 7501 / invoice extraction | Analyst extracts | OCR + LLM extracts to draft; analyst confirms | Auto-confirm at high confidence; sample for QA |
| Outreach email generation | Template + personalization | LLM tailors per broker/customer history | LLM drafts, coordinator edits |
| Triage / queue routing | Coordinator assigns | Rule-based + LLM priority score | LLM routes; coordinator overrides |
| Confidence scoring on entries | Heuristics | LLM cross-checks across sources | Calibrated model |
| Readiness Report drafting | Validator writes | LLM drafts notes; validator finalizes | LLM-finalized for clean cases |
| Reminder cadence | Static cadence | Adaptive based on customer engagement | Channel-aware (email vs SMS vs call) |
| Knowledge surface (ops) | Manual lookup | RAG over CBP guidance + our case history | LLM answers operator questions in console |

## Architecture

```
src/contexts/ai/
  extractors/         # OCR + LLM doc parsers (one per doc type)
  prompts/            # versioned prompt templates with golden tests
  evaluators/         # offline eval suites for each AI step
  guardrails/         # confidence thresholds, refusal patterns
```

- **Models**: Claude Opus 4.7 / Sonnet 4.6 for reasoning; Claude Haiku 4.5 for fast classification. (Use `claude-api` skill for implementation.)
- **OCR**: AWS Textract or Google Document AI for raw text + structure extraction; LLM does the semantic conversion.
- **RAG**: Postgres with pgvector for case-history + CBP-guidance index.
- **Prompt caching**: Mandatory on all multi-turn workflows (per `claude-api` skill guidance).
- **Eval-first**: Every prompt has a golden-file evaluation before being deployed; we never ship a prompt with no eval.

## Confidence + escalation

Every AI output carries a `confidence` and a `requiresHumanReview` boolean. Thresholds:

- `high` (>0.92) — auto-applied; sampled for QA at 5% rate.
- `medium` (0.70–0.92) — surfaced as a draft; analyst confirms.
- `low` (<0.70) — bypassed; manual workflow takes over.

The thresholds are **per task**, not global. Calibrated against real cases.

## Acceptance criteria (Phase 2)

- **Given** a 7501 PDF uploaded as a recovery source,
  **When** the OCR + LLM extractor runs,
  **Then** entries are drafted with field-level confidence and the analyst sees a side-by-side compare view.
- **Given** an LLM-drafted Readiness Report note,
  **When** the validator opens the case,
  **Then** the draft is editable inline and the original prompt + model version is recorded with the saved note.
- **Given** an extracted entry with confidence < threshold,
  **When** ingestion completes,
  **Then** the entry enters the manual extraction queue with the AI draft visible as a hint.
- **Given** a prompt-template change,
  **When** the change is merged,
  **Then** the offline eval suite passes and the new template is deployed with version tracking.
- **Given** a customer-facing artifact,
  **When** any AI-generated content appears in it,
  **Then** the audit log records which model + prompt version produced it.

## Edge case inventory

- LLM hallucination on entry numbers → confidence threshold blocks it; never auto-applied.
- Model downtime → fallback to manual workflow; queue still moves.
- PII in prompts — never sent to model providers without redaction; strict allowlist of fields.
- Prompt-injection in customer-uploaded docs → sanitization + system-prompt isolation; instructions inside docs are treated as data.
- Cost runaway — per-case budget cap; alerts when 80% used.
- Drift over time — quarterly re-eval against the golden set.
- Bias / fairness — not a primary concern for this domain (numeric extraction), but tracked in eval set across customer types.
- Multiple model versions in flight — every record carries the model version that produced it.
- Long documents exceeding context — chunked extraction with deterministic merge.
- Customer opts out of AI processing — supported; case routes to fully-manual workflow.

## Design notes

- Any AI-generated content in the customer-facing UI is labeled (`Drafted by analyst with AI assistance`) — restraint over hype.
- The ops console does not flash "AI" badges. Confidence is a number, not a sparkle.
- The "AI assist" capabilities are a force-multiplier the customer never sees as marketing.

## Out of scope

- Customer-facing chatbot.
- Generative content for marketing.
- LLM-driven pricing or refund estimation.
- AI-written legal advice.
