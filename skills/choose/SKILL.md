# Choose — Project Intent Clarification

Wrapper around pi-choose-wisely for managing CHOICES.md within the director workflow.

## When to Use
- User asks to clarify project intent, scope, goals
- User runs `/choose`
- New project without CHOICES.md

## Routing

| User Input | Delegate To |
|------------|-------------|
| No CHOICES.md exists | `pi-choose-wisely:choose-wisely` → bootstrap mode (scan docs, extract choices) |
| "audit" / "check" | `pi-choose-wisely:choose-wisely` → audit mode (8 validation checks) |
| "init" / "interview" | `pi-choose-wisely:choose-wisely` → interview mode (structured planning) |
| Describes a change | `pi-choose-wisely:choose-wisely` → change mode (apply + cascade) |
| "replan" / "plan" | `pi-choose-wisely:replan` → gap analysis → generate PLAN.md |

## Process

### Step 1 — Delegate to pi-choose-wisely
Route the user's request to the appropriate pi-choose-wisely operation (see table above). Pass through all user context.

### Step 2 — Post-Change Pipeline
After any CHOICES.md modification:

1. **Cascade audit** — pi-choose-wisely runs this automatically (upward, lateral, downward checks)
2. **Priority ladder check** — verify new/changed choices respect M-0100 ordering
3. **Suggest replan** — if PLAN.md exists, ask: "CHOICES.md changed. Regenerate PLAN.md?" If yes, delegate to `pi-choose-wisely:replan`
4. **Suggest /next** — "Run `/next` to see how this affects recommendations?"

### Step 3 — New Choice Validation
For any new choice added, verify:
- Has a `Supports:` line (unless top-level Mission)
- ID is a fresh UID (never reuse or renumber existing IDs)
- Positioned correctly within its section (position = priority)

See [pipeline.md](lib/pipeline.md) for the full intent-to-execution flow.

## Integration Points
- After CHOICES.md changes → suggest `/build` if PLAN.md exists
- After CHOICES.md changes → suggest `/next` for impact analysis
- CHOICES.md gaps feed into `/next` recommendations via choice-scanner

## Delegates To
- `pi-choose-wisely:choose-wisely` skill (all CHOICES.md operations)
- `pi-choose-wisely:replan` skill (gap analysis → PLAN.md generation)
