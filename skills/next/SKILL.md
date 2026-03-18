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

## Output
- Writes `NEXT.md` in project root
- Returns summary of top recommendations for user selection

---

## Execution

When an agent loads this skill, execute the following steps exactly.

### Step 1 — Resolve scout model
```tool
resolve_model_group { "group": "scout" }
```
Use the returned model ref as `{scout_model}` in parallel tasks below.

### Step 2 — Run 4 scanners in parallel

```tool
subagent {
  "tasks": [
    {
      "agent": "claude-code",
      "model": "{scout_model}",
      "task": "Read the scanner instructions at skills/next/lib/session-scanner.md (relative to cwd). Follow those instructions exactly. Analyze session files in .pi/agent/sessions/ and ~/.pi/agent/sessions/. Output your findings as markdown in the session-scanner format described in that file. Return the full markdown block as your response."
    },
    {
      "agent": "claude-code",
      "model": "{scout_model}",
      "task": "Read the scanner instructions at skills/next/lib/code-scanner.md (relative to cwd). Follow those instructions exactly. Scan all source files in the project (excluding node_modules, .git, dist). Output your findings as markdown in the code-scanner format described in that file. Return the full markdown block as your response."
    },
    {
      "agent": "claude-code",
      "model": "{scout_model}",
      "task": "Read the scanner instructions at skills/next/lib/choice-scanner.md (relative to cwd). Follow those instructions exactly. Read CHOICES.md and diff it against the codebase. Also check PLAN.md alignment. Output your findings as markdown in the choice-scanner format described in that file. Return the full markdown block as your response."
    },
    {
      "agent": "claude-code",
      "model": "{scout_model}",
      "task": "Read the scanner instructions at skills/next/lib/log-scanner.md (relative to cwd). Follow those instructions exactly. Find and parse all log files in the project. Also check .pi/corrections.jsonl for correction patterns. Output your findings as markdown in the log-scanner format described in that file. Return the full markdown block as your response."
    }
  ]
}
```

Collect all four responses. Each will be a markdown block.

### Step 3 — Synthesize and write NEXT.md

```tool
subagent {
  "agent": "claude-code",
  "model": "{tactical_model}",
  "task": "You are the synthesis agent for the /next skill. You have four scanner reports as input.\n\nRead the ranking algorithm at skills/next/lib/ranker.md. Apply it to the combined findings.\n\n--- SESSION SCANNER ---\n{session_scanner_output}\n\n--- CODE SCANNER ---\n{code_scanner_output}\n\n--- CHOICE SCANNER ---\n{choice_scanner_output}\n\n--- LOG SCANNER ---\n{log_scanner_output}\n\nSteps:\n1. Combine all findings into a single list of candidate recommendations.\n2. Score each by Impact × Effort × Evidence (1-3 each, max score 27).\n3. Classify each as scope:in (covered by CHOICES.md) or scope:out (needs user approval).\n4. Filter to top 10 scope:out recommendations by priority score.\n5. Apply the priority ladder from ranker.md — flag regressions with ⚠️.\n6. Write NEXT.md to the project root using the format:\n\n```\n# NEXT.md — Recommended Actions\n\nGenerated: {today's date}\nSources analyzed: {counts}\n\n## Priority 1: {title}\nCategory: {category} | Impact: {high/med/low} | Effort: {small/med/large} | Score: {N}\nEvidence: {supporting data — scanner, count, files}\nAction: {specific steps to take}\nSupports: {CHOICES.md IDs affected, if any}\n\n## Priority 2: {title}\n...\n```\n\nWrite NEXT.md then return a brief summary (3-5 lines) of the top 3 recommendations for the user."
}
```

### Step 4 — Route and Execute

After the synthesis agent completes:

**If there are scope:in items** (covered by CHOICES.md):
1. Display the brief summary
2. Immediately proceed to plan and build these items autonomously
3. Use the `/build` skill workflow: generate PLAN.md, implement via TDD
4. No user approval needed — these are within current scope

**If no scope:in items exist** (all recommendations need user decision):
1. Display the brief summary of scope:out items
2. Launch `/choose` to discuss NEXT.md items that need user insight and approval
3. Present each item for: accept → update CHOICES.md, defer, dismiss

**Mixed scenario** (both scope:in and scope:out):
1. Handle scope:in items first (plan & build)
2. Then present scope:out items via /choose for user decisions
3. Summarize what was done autonomously vs what needs approval
