# Build — TDD Iterative Development Loop

Execute PLAN.md phases through the director pattern: recon → plan → build → test → gate check.

## When to Use
- User asks to "build", "implement", "execute the plan"
- User runs `/build`
- After user approves recommendations from `/next`

## Prerequisites
- CHOICES.md must exist (run `/choose` first)
- PLAN.md must exist (run replan first)

## Process

### Step 1 — Establish Phase Gates
Read PLAN.md and CHOICES.md. Identify:
- Next incomplete phase
- Exit criteria (what "done" means)
- Assumptions that must hold
- Blockers that would make phase infeasible

If no PLAN.md exists, offer to run replan skill from pi-choose-wisely.

### Step 2 — Recon
Delegate to read-only agents in parallel:
- **scout**: survey codebase — relevant files, patterns, dependencies
- **web recon** (if needed): research libraries, APIs via context7 or web-search skills

### Step 3 — Refine Phase Plan
Using recon findings:
- Break vague tasks into concrete steps with file paths and function names
- Identify risks, unknowns, edge cases
- Delegate to planner agent if architecturally complex
- Update PLAN.md with refined tasks (delegate to writer agent)

### Step 4 — Feasibility Experiments
For unfamiliar libraries, new patterns, or unvalidated assumptions:
- Delegate throwaway PoC to builder agent
- If experiment fails and impacts CHOICES.md goals → **STOP, report to user**
- If experiment fails but alternative exists → update plan, continue

### Step 5 — Build, Test, Gate Check
- Delegate implementation to builder agents (parallel when independent)
- After each builder completes, delegate review to reviewer agent
- If reviewer finds issues, delegate fixes back to builder
- Verify every exit criterion
- Mark phase complete in PLAN.md

### Step 6 — Loop or Stop
- If autonomous mode: loop to Step 1 for next phase
- Hard stops (require user): mission infeasible, security issue, external dep broken
- Soft issues (handle autonomously): API changed, test failure, review nits

## Subagent Delegation
- **scout** (operational model): fast codebase recon
- **planner** (strategic model): architecture decisions
- **builder** (operational model): code implementation
- **reviewer** (tactical model): code review
- **writer** (operational model): documentation updates

## Output Format
After each phase:
```
## Phase {N}: {title} — ✅ Complete | ❌ Blocked

### Gate Check
- [x] criterion passed
- [ ] criterion failed — reason

### Files Changed
- `path/to/file` — what changed

### Next
What comes next or what user input is needed
```
