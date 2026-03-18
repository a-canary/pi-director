# NEXT.md — Recommended Actions

Generated: 2026-03-18
Sources analyzed: 30 sessions, 0 correction entries, 33 files

---

## Priority 1: Complete Phase 7 — Setup skill tests and integration
Category: debt | Impact: high | Effort: small | Score: 18
Evidence: PLAN.md shows 3/4 steps incomplete (7.2, 7.3, 7.4). Setup skill SKILL.md exists (247 lines) but package.json pi.skills doesn't include it, no test coverage, README undocumented.
Action: Add setup-skill tests, register in package.json pi.skills, update README with /setup docs.
Supports: F-0007, I-0003, M-0002

## Priority 2: Verify nightly extension loads without errors
Category: debt | Impact: medium | Effort: small | Score: 12
Evidence: Phase 5 gate "Extension loads without errors when pi starts" is unchecked. Extension is 229 lines — largest .ts file. No runtime validation.
Action: Add extension load test or manually verify pi loads it. Check gate off in PLAN.md.
Supports: F-0004, A-0003, O-0100

## Priority 3: CHOICES.md is the largest file (254 lines) — consider section extraction
Category: simplify | Impact: low | Effort: medium | Score: 4
Evidence: CHOICES.md at 254 lines is dense. 37 choices across 8 sections. No evidence of confusion yet — defer unless it grows further.
Action: Monitor. If it exceeds 300 lines, consider splitting Architecture/Technology into a linked doc.
Supports: D-0003

## Priority 4: PLAN.md is a session hotspot (touched in 5 sessions)
Category: scope-change | Impact: low | Effort: medium | Score: 4
Evidence: Session analysis shows PLAN.md edited in 5 of last 30 sessions. Suggests frequent manual plan updates. Could indicate the replan flow isn't fully automated.
Action: Evaluate if `/replan` is being used or if manual edits are replacing it. Consider automating post-build plan updates.
Supports: F-0006, UX-0004

---

## In-Scope Items (autonomous — no approval needed)

These fall within CHOICES.md and the director can handle them:
- ✅ All 103 tests passing — no regressions
- ✅ No log errors, no runtime issues
- ✅ No dead code or unused dependencies detected
- ✅ No files exceed 300-line complexity threshold
