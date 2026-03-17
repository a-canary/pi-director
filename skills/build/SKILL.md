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

Follow the [phase loop](lib/phase-loop.md) for each PLAN.md phase:

1. **Read Gates** — parse PLAN.md + CHOICES.md for current phase
2. **Recon** — parallel scout agents survey codebase and web
3. **Refine Plan** — planner + writer agents break vague steps into concrete actions
4. **Experiments** — throwaway PoCs for unknowns
5. **Build & Test** — builder + reviewer agents, parallel when safe
6. **Gate Check** — verify exit criteria + [regression check](lib/regression-check.md)

If no PLAN.md exists, offer to run replan skill from pi-choose-wisely.

### Hard Stops vs Soft Issues
See [hard-stops.md](lib/hard-stops.md) for the decision tree. Key rule: any change that regresses a higher priority level (M-0100) is a hard stop.

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
