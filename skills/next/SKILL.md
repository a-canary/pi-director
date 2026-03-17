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
Spawn parallel scout agents to collect data from each source:
- Session scanner: parse recent sessions for failure patterns, token waste, repeated manual fixes
- Code scanner: find complexity hotspots, untested code, large files, dead exports
- Choice scanner: diff CHOICES.md against codebase reality
- Log scanner: parse app logs for recurring errors

### Step 2 — Analyze
Synthesize findings into recommendation categories:
- **refactor** — code quality improvements with clear before/after
- **simplify** — remove unnecessary complexity, dead code, over-abstraction
- **scope-change** — CHOICES.md additions/removals based on evidence
- **ux-improvement** — user experience issues found in logs or session patterns
- **upskill** — repeated agent failures suggesting a new skill or rule
- **debt** — technical debt items with effort estimates

### Step 3 — Rank
Score each recommendation by:
- **Impact**: how much does this improve the project? (high/medium/low)
- **Effort**: how much work? (small/medium/large)
- **Evidence**: how strong is the data? (count of supporting signals)
Priority = high-impact × low-effort × strong-evidence first.

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

### Step 5 — Present for Approval
Show top 5 recommendations. User selects items to:
- Execute immediately (feeds into `/build`)
- Add to CHOICES.md (feeds into `/choose`)
- Defer (stays in NEXT.md for next cycle)
- Dismiss (removed with reason logged)

## Output
- Writes `NEXT.md` in project root
- Returns summary of top recommendations for user selection
