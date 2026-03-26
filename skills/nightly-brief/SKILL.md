---
description: Nightly 6pm improvement digest. Runs analysis, posts to Discord by 6pm for user review. User approves new scope by 10pm, then directors work autonomously overnight.
---

# Nightly Brief — Evening Planning Digest

A comprehensive nightly report that analyzes project health, surfaces opportunities, and prepares an overnight work queue. Posts at 6pm so the user has until 10pm to approve scope-expanding work before directors run autonomously through the night.

Leverages the `/next` scanner infrastructure for analysis. Output is a Discord post. In-scope work and approved proposals are executed overnight.

## When to Use
- Cron trigger at 6pm daily (`0 18 * * * /nightly-brief`)
- User runs `/nightly-brief`

## Customization

Directors can override or extend this skill by creating `skills/nightly-brief/project.md` in their project. See [customize.md](customize.md) for the override API — add project-specific scanners, suppress sections, adjust thresholds, or override the Discord format.

---

## What It Covers

Each brief contains **six analysis dimensions**:

| Dimension | What it captures |
|-----------|-----------------|
| **Status** | Overall project health — test pass rate, last deploy, open errors |
| **Progress** | What changed today — commits, closed issues, completed PLAN phases |
| **Blockers** | Anything preventing forward progress — failing tests, broken deps, unresolved decisions |
| **Issues & Solutions** | Active bugs or regressions with proposed fixes queued for tonight |
| **Opportunities** | Fixes, refactors, simplifications, evolutions ranked by value |
| **CHOICES.md Proposals** | Suggested additions, removals, or changes to project scope/direction |

---

## Work Schedule

```
6:00 PM  — Brief posted to Discord
6:00 PM  — In-scope work begins immediately
Evening  — User reviews proposals, replies approve/defer/dismiss
Approval — Approved proposals begin immediately
Morning  — Work complete, results available for review
```

The 6pm post gives the user a natural evening window to review proposals. There's no scheduled gate — work starts as soon as it's authorized (either by existing CHOICES.md or by the user's approval reply).

---

## Autonomous Action Policy

**In-scope items** (covered by existing CHOICES.md):
- Fixes for existing features
- Refactors that support existing architecture choices
- Test coverage gaps for implemented functionality
- Implementation gaps for existing choices
→ **Director starts immediately after posting the brief.** User can interrupt with `skip N` if something looks wrong.

**CHOICES.md proposals** (scope changes, new direction, trade-offs):
- New features not in CHOICES.md
- Architectural changes that contradict existing choices
- Removals or deprecations of existing scope
- Trade-offs requiring user judgment
→ **Starts immediately on approval.** User replies `approve N / defer N / dismiss N` at their own pace. No deadline.

---

## Discord Post Format

```
🌙 **Nightly Brief — {Project} — {Weekday, Month D}**

**Status** {emoji} — {1 sentence: overall health, key metric, last meaningful event today}

**Today's progress**
• {commit or PLAN phase or fix landed — what it was, why it mattered}
• {second item if exists, else omit bullet}

**Blockers** ⚠️
• {specific blocker — what it is, how long it's been present, what's stuck}
(omit section entirely if no blockers)

━━━━━━━━━━━━━━━━━━━━━━━━━━

**1. {Title}** ✅ in scope — {category}
{2-3 sentences: what the issue/opportunity is · why it matters · evidence (source, count)}
→ *{Specific action: file names, function names, metric targets}*

**2. {Title}** ✅ in scope — {category}
...

**3. {Title}** 📋 needs your approval — {category}
{2-3 sentences: what would change · why it adds value · what the trade-off is}
→ *{What gets built tonight if approved}*
Reply: **approve 3 / defer 3 / dismiss 3** (before 10pm)

**4. {Title}** 📋 needs your approval — {category}
...

━━━━━━━━━━━━━━━━━━━━━━━━━━

{closing line — one of:}
"Starting on items 1 & 2 now. Approve 3 & 4 whenever you're ready."
"Starting on item 1 now. Nothing needs approval tonight."
"Nothing to start autonomously — approve items above whenever you're ready."
```

**Hard constraints:**
- 3–4 opportunity items max. Never pad to hit 4.
- No item without concrete evidence (file path, error count, session pattern, log line).
- Total post ≤ 1800 characters. Trim justifications if needed (1 sentence min).
- Never repeat an item from the last brief unless evidence has worsened.

---

## Execution

### Step 1 — Load previous brief context

Check for `.pi/nightly-brief-last.md` (written at end of each run). Extract:
- Items that were deferred (skip tonight unless evidence worsened)
- Items that were dismissed (never resurface)
- What overnight work ran last night and whether it completed (reference in Progress section)

If file doesn't exist, treat as first run.

### Step 2 — Run scanners in parallel

Resolve the scout model:
```tool
resolve_model_group { "group": "scout" }
```

Run all scanners simultaneously using `{scout_model}`:

```tool
subagent {
  "tasks": [
    {
      "agent": "claude-code",
      "model": "{scout_model}",
      "task": "Read skills/next/lib/session-scanner.md and follow it exactly. Also check: (1) .pi/nightly-brief-last.md for what overnight work ran last night and whether it completed, (2) what PLAN.md phases completed today. Report today's issues, solutions applied, and what changed. Return findings as markdown."
    },
    {
      "agent": "claude-code",
      "model": "{scout_model}",
      "task": "Read skills/next/lib/code-scanner.md and follow it exactly. Focus on: complexity hotspots, untested code, dead exports, large files (>300 lines), TODO/FIXME comments with age context. Return findings as markdown."
    },
    {
      "agent": "claude-code",
      "model": "{scout_model}",
      "task": "Read skills/next/lib/choice-scanner.md and follow it exactly. Also identify: (1) CHOICES.md gaps — things the project does that have no choice backing them, (2) stale choices — decisions that contradict current codebase reality, (3) missing choices — patterns in the code that should be formalized. Return findings as markdown."
    },
    {
      "agent": "claude-code",
      "model": "{scout_model}",
      "task": "Read skills/next/lib/log-scanner.md and follow it exactly. Also check: (1) test results — pass/fail counts, duration trends, (2) any CI/build output in logs, (3) .pi/corrections.jsonl for recent agent failures. Report active errors, recurring patterns, and blockers. Return findings as markdown."
    },
    {
      "agent": "claude-code",
      "model": "{scout_model}",
      "task": "Project status snapshot. Check: (1) git log --oneline -10 for recent commits, (2) last modified timestamps on key source files, (3) PLAN.md — which phases are complete/in-progress/blocked, (4) any .env or config issues (missing vars, expired tokens). Return a concise status markdown block: health emoji (✅/⚠️/❌), last deploy or meaningful commit, open blockers count."
    }
  ]
}
```

Also check for a project-specific scanner override:
- If `skills/nightly-brief/project.md` exists, read it and run any additional scanners defined there.

Collect all responses as `{session_scan}`, `{code_scan}`, `{choice_scan}`, `{log_scan}`, `{status_scan}`.

### Step 3 — Synthesize brief

Resolve the tactical model:
```tool
resolve_model_group { "group": "tactical" }
```

```tool
subagent {
  "agent": "claude-code",
  "model": "{tactical_model}",
  "task": "You are synthesizing a nightly brief for a software project director agent. This brief will be posted at 6pm. The user has until 10pm to approve proposals. Approved and in-scope items run overnight.\n\nInputs:\n\n--- STATUS ---\n{status_scan}\n\n--- SESSION (today's work, progress) ---\n{session_scan}\n\n--- CODE (complexity, debt, opportunities) ---\n{code_scan}\n\n--- CHOICES (scope gaps, stale decisions) ---\n{choice_scan}\n\n--- LOGS (errors, blockers, test results) ---\n{log_scan}\n\n--- PREVIOUS BRIEF ---\n{previous_brief_context}\n\nYour task:\n1. Extract the Status line (health emoji + 1 sentence).\n2. Extract 1-2 Progress bullets (what meaningfully changed today).\n3. Extract Blockers (only items actively preventing progress — omit if none).\n4. Generate 3-4 overnight work items using the ranker from skills/next/lib/ranker.md:\n   - Score each: Impact × Effort × Evidence (1-3 each)\n   - Effort calibration: prefer items completable overnight (< 4 hours); large items are fine if they're clearly the highest value\n   - Classify each: scope:in (fits CHOICES.md, auto-queued for 10pm) or choices:proposal (needs approval before 10pm)\n   - Categories: fix | refactor | simplify | evolution | upskill\n   - Prefer category diversity — don't pick 3 refactors\n   - Exclude deferred/dismissed items from previous brief unless evidence worsened\n5. For choices:proposal items: write what CHOICES.md change would be needed.\n\nReturn a JSON object:\n{\n  \"status\": { \"emoji\": \"✅|⚠️|❌\", \"line\": \"...\" },\n  \"progress\": [\"bullet 1\", \"bullet 2\"],\n  \"blockers\": [\"blocker 1\"],\n  \"items\": [\n    {\n      \"title\": \"...\",\n      \"scope\": \"in|choices_proposal\",\n      \"category\": \"fix|refactor|simplify|evolution|upskill\",\n      \"justification\": \"2-3 sentences with evidence\",\n      \"action\": \"specific steps with file names\",\n      \"choices_change\": \"what CHOICES.md line would be added/changed (choices_proposal only)\",\n      \"estimated_hours\": 1.5,\n      \"score\": 0\n    }\n  ],\n  \"in_scope_count\": 0,\n  \"proposal_count\": 0\n}\n\nDo not write any files. Return only the JSON."
}
```

Save the JSON as `{brief_data}`.

### Step 4 — Critic review

Resolve the strategic model:
```tool
resolve_model_group { "group": "strategic" }
```

```tool
subagent {
  "agent": "critic",
  "model": "{strategic_model}",
  "task": "Review this nightly brief synthesis before it is posted to Discord. These items will run overnight if approved — quality and safety matter.\n\nBrief data:\n{brief_data}\n\nReview criteria:\n1. **Evidence quality** — Does each item cite concrete data (file, count, log line)? Reject speculative items.\n2. **Scope classification** — Are scope:in items genuinely covered by CHOICES.md? Would any actually change project direction (should be choices_proposal)?\n3. **Overnight safety** — Are any items risky to run unsupervised? Flag anything that could cause data loss, break prod, or leave the codebase in a broken state mid-run.\n4. **Effort realism** — Are estimated_hours plausible? Flag anything that looks underestimated for overnight work.\n5. **Blocker validity** — Are listed blockers real and current?\n6. **Action specificity** — Vague actions like 'improve X' will fail overnight without user to clarify. Flag them.\n7. **Category diversity** — Flag if >2 items share the same category.\n8. **Choices proposals** — Are proposed CHOICES.md changes well-scoped? Cascade conflicts?\n\nOutput: approval, approval-with-fixes (list changes), or rejection (list issues). Concise — this runs nightly."
}
```

- **Approved or approved-with-fixes**: apply fixes to `{brief_data}`, continue.
- **Rejected**: re-run Step 3 with critic feedback appended, then post best version with `⚠️ low confidence` noted.

### Step 5 — Format and post Discord message

Render the Discord post from `{brief_data}` using the format in the **Discord Post Format** section above.

**Post it as your text response** — this is the Discord message. Output it directly.

### Step 6 — Update NEXT.md

Append or update `NEXT.md` in the project root:
- **choices_proposal items** → add/update each as a NEXT.md entry with today's date
- **in-scope items** → add as `Status: Queued for tonight — {date}`
- **Previously deferred/dismissed items** → preserve their status, don't overwrite

```markdown
## {Title}
Generated: {date} | Category: {category} | Score: {N} | Est: {hours}h
Scope: {In scope | CHOICES.md proposal}
Evidence: {justification}
Proposed change: {choices_change — proposals only}
Action: {action}
Status: {Queued for tonight | Pending approval}
```

### Step 7 — Start in-scope work

If `in_scope_count > 0`:
1. Load the `/build` skill
2. Pass each in-scope item's `action` field as the task
3. The build skill handles PLAN.md generation and TDD execution

Do this immediately after posting the brief — no waiting.

### Step 8 — Save brief state

Write `.pi/nightly-brief-last.md`:

```markdown
# Nightly Brief State — {date}

## Items Posted
{list of all items with scope, title, status}

## Queued for tonight
{titles of in-scope items}

## Pending approval (deadline: 10pm)
{titles of choices_proposal items}

## Deferred (carry forward)
{deferred items with original date}

## Dismissed (never resurface)
{dismissed items}
```

### Step 9 — Handle user replies

**`approve N`**:
1. Read `choices_change` for item N from `{brief_data}`
2. Apply proposed change to CHOICES.md via `/choose` → change mode
3. `/choose` runs cascade audit + critic review automatically
4. If cascade passes → immediately load `/build` skill and implement item N
5. Update NEXT.md entry → `Status: In Progress — {date}`
6. Reply: "✅ Added to CHOICES.md. Starting item N now."

**`defer N`**:
1. Update `.pi/nightly-brief-last.md` — mark item N as deferred
2. Update NEXT.md entry → `Status: Deferred — {date}`
3. Reply: "⏸️ Item N deferred. Will resurface if evidence worsens."

**`dismiss N`**:
1. Update `.pi/nightly-brief-last.md` — mark item N as dismissed
2. Update NEXT.md entry → `Status: Dismissed — {date}`
3. Reply: "🗑️ Item N dismissed. Won't resurface."

**`skip N`** (interrupt an in-scope item already running):
1. Note the skip in `.pi/nightly-brief-last.md`
2. Reply: "⏭️ Noted — will wrap up the current step cleanly and stop item N."
3. The running `/build` session completes its current atomic step, then halts.
