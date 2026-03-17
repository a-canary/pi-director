---
description: Analyze project data and generate ranked recommendations in NEXT.md. Use when user asks "what should I do next?" or runs /next.
---

# Next — Analysis & Recommendation Engine

Analyze project data and generate ranked recommendations in NEXT.md.

## When to Use
- User asks "what should I do next?"
- User runs `/next`
- Nightly scheduled analysis

## Data Sources
1. **Session history** — `.pi/agent/sessions/*.jsonl` — patterns of repeated work, failed attempts
2. **Correction logs** — `.pi/corrections.jsonl` — systematic failures (via pi-upskill)
3. **Code analysis** — complexity, test coverage gaps, dead code, large files
4. **CHOICES.md** — unimplemented choices, stale decisions
5. **PLAN.md** — incomplete phases, blocked items
6. **App output/logs** — runtime errors, performance issues

## Process

### Step 1 — Gather
Spawn **parallel** scout agents, one per scanner module:
- [Session scanner](lib/session-scanner.md): parse recent sessions for failure patterns, token waste, repeated manual fixes
- [Code scanner](lib/code-scanner.md): find complexity hotspots, untested code, large files, dead exports
- [Choice scanner](lib/choice-scanner.md): diff CHOICES.md against codebase reality
- [Log scanner](lib/log-scanner.md): parse app logs for recurring errors

Each scanner runs as an independent subagent. All four run in parallel.

### Step 2 — Analyze
Synthesize findings into recommendation categories:
- **refactor** — code quality improvements with clear before/after
- **simplify** — remove unnecessary complexity, dead code, over-abstraction
- **scope-change** — CHOICES.md additions/removals based on evidence
- **ux-improvement** — user experience issues found in logs or session patterns
- **upskill** — repeated agent failures suggesting a new skill or rule
- **debt** — technical debt items with effort estimates

### Step 3 — Rank
Apply the [ranking algorithm](lib/ranker.md):
- **Impact** × **Effort** × **Evidence** = priority score (1-27)
- Filter through priority ladder (M-0100): UX Quality > Security > Scale > Efficiency
- Flag any recommendation that would regress a higher priority with ⚠️

### Step 4 — Write NEXT.md
Generate structured output:

```markdown
# NEXT.md — Recommended Actions

Generated: {date}
Sources analyzed: {count} sessions, {count} corrections, {count} files

## Priority 1: {title}
Category: refactor | Impact: high | Effort: small
Evidence: {what data supports this}
Action: {specific steps}

## Priority 2: {title}
...
```

### Step 5 — Classify & Route

**Within CHOICES.md scope** → director handles autonomously (no NEXT.md entry needed):
- Bug fixes aligned with existing choices
- Test failures for implemented features
- Implementation gaps for existing choices
- Refactors that support existing architecture decisions

**Outside CHOICES.md scope** → write to NEXT.md for user review:
- Problems that contradict CHOICES.md decisions
- Opportunities that expand beyond current scope
- New concerns not addressed by any existing choice
- Trade-offs that require user judgment

### Step 6 — Present for Approval
Show NEXT.md items (scope-external only). User selects items to:
- Accept → feeds into `/choose` to update CHOICES.md, then director can act
- Defer (stays in NEXT.md for next cycle)
- Dismiss (removed with reason logged)

## Output
- Writes `NEXT.md` in project root
- Returns summary of top recommendations for user selection
