# Ralph Loop Status

**Updated**: 2026-04-21T11:17:00Z
**Branch**: claude/scaffold-platform
**Loop state**: active (iteration 49 → 50)

## Counts (v1 — task ids ≤ 86)

| Status | Count |
| --- | --- |
| completed | 49 |
| in-progress | 0 |
| pending | 37 |
| human-blocked | 0 |

## Quality gates (last run)

| Gate | Status |
| --- | --- |
| `npm test` | green — 76 files, 592 tests pass |
| `npm run lint` | clean |
| `npm run typecheck` | clean |
| `npm run build` | green — 22 routes |
| `npm run qa` (combined) | green |

## Last completed task

**#51 — Customer recovery workspace UI (3-pane)**

`/app/case/[id]/recovery` — server component at `src/app/(app)/app/case/[id]/recovery/page.tsx`:

- Resolves the recovery path by loading the case (`getCaseRepo`), the screener session (`findSessionById`), running `determineRecoveryPath`, and calling `recoveryPlanFor` + `renderOutreachKit`.
- **Left** — `RecoveryStatusPanel`: case id, status banner with path label + SLA, document checklist (one row per `plan.acceptedDocs`), prerequisite checks (required vs optional), uploaded list when docs exist.
- **Center** — `OutreachKitPanel`: rendered subject + body verbatim, `CopyButton` client subcomponent writes `"Subject: …\n\n<body>"` to `navigator.clipboard` with "Copied" feedback, attachments-needed list, template version footer.
- **Right** — `UploadPanel` wraps the existing `UploadZone` with the case-id binding.
- **Zero UI conditionals on `path` per ADR 015** — the workspace reads everything from the plan + the rendered outreach kit.
- 404 paths (via `notFound()`): case doesn't exist; case has no resolvable recovery path (no screener session OR disqualified). `not-found.tsx` renders an editorial fallback page.
- Auth: middleware gates `/app`; finer customer-to-case ownership scoping is a follow-up with #52 (case lifecycle workflow).

16 new tests: 6 `RecoveryStatusPanel` + 5 `OutreachKitPanel` (including clipboard write verification) + 5 integration-page via stubbed repos (broker happy path, uploaded list, three 404 paths).

## Human-verification still owes

- End-to-end walk once #52 wires case creation into the `platform/payment.completed` workflow: purchase → case created → workspace opens at the correct URL.
- Real upload flow through the workspace once R2 + worker asset are provisioned.
- Eyeball the three-pane layout at multiple breakpoints; confirm the right pane collapses under the center on narrow viewports (currently a single-column grid below `lg`).
- Copy-to-clipboard feedback against Safari + a non-HTTPS local context.

## Next eligible

Per dependency check (v1 only):
- Task #30 — deps satisfied. **Eligible — lowest id.**
- Task #52 — eligible.
- Task #55 (entries schema) — eligible.
- Task #67 (CAPE prep workflow scaffold) — eligible.
- Task #72 (admin dashboard scaffold) — eligible.

Lowest-id eligible is **task #30**.

## Notes

- Wave 8 (Recovery workspace) 4/many done — routing + templates + upload component + workspace page landed.
- Loop will continue with #30 next iteration.
