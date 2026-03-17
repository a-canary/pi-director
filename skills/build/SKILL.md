---
description: Execute PLAN.md phases through TDD iterative development. Use when user runs /build or wants to implement planned features.
---

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
2. **Recon** (operational) — parallel scout agents, many tool calls
3. **Plan** (tactical) — planner synthesizes concrete steps, few tool calls
4. **Critique** (strategic) — critic reviews plan with zero tools, produces decision tree
5. **Finalize** (tactical) — planner resolves branches, incorporates feedback
6. **Build & Test** (operational) — builder + reviewer agents, parallel when safe
7. **Gate Critique** (strategic) — critic reviews results with zero tools, approves or rejects

If no PLAN.md exists, offer to run replan skill from pi-choose-wisely.

### Hard Stops vs Soft Issues
See [hard-stops.md](lib/hard-stops.md) for the decision tree. Key rule: any change that regresses a higher priority level (M-0100) is a hard stop.

## Subagent Delegation
- **scout** (operational): fast codebase recon, many tool calls
- **planner** (tactical): architecture and plan synthesis, few tool calls
- **critic** (strategic): thinking-only review, zero tools, decision trees
- **builder** (operational): code implementation, many tool calls
- **reviewer** (tactical): code review, few tool calls
- **writer** (operational): documentation updates

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
