# Intent-to-Execution Pipeline

How project intent flows from CHOICES.md through to running code.

## Flow

```
User Intent
    │
    ▼
┌─────────────────┐
│    /choose       │  ← Clarify WHY and WHAT
│   CHOICES.md     │
└────────┬────────┘
         │ changes
         ▼
┌─────────────────┐
│    replan        │  ← Gap analysis: choices vs reality
│   PLAN.md        │
└────────┬────────┘
         │ phases
         ▼
┌─────────────────┐
│    /build        │  ← Execute phases: HOW
│   code + tests   │
└────────┬────────┘
         │ results
         ▼
┌─────────────────┐
│    /next         │  ← Analyze what happened
│   NEXT.md        │
└────────┬────────┘
         │ recommendations
         ▼
    Back to /choose or /build
```

## Artifact Lifecycle

### CHOICES.md
- **Created by**: `/choose` (bootstrap or interview)
- **Modified by**: `/choose` (change + cascade)
- **Read by**: `/build` (constraints), `/next` (gap analysis)
- **Owned by**: pi-choose-wisely

### PLAN.md
- **Created by**: replan (from CHOICES.md gap analysis)
- **Modified by**: `/build` (marks phases complete, refines steps)
- **Read by**: `/next` (incomplete phases), `/build` (current phase)
- **Owned by**: pi-choose-wisely:replan + pi-director:/build

### NEXT.md
- **Created by**: `/next` (analysis engine)
- **Modified by**: User approval (items deferred/dismissed)
- **Read by**: User (recommendations), `/choose` (scope changes), `/build` (approved items)
- **Owned by**: pi-director:/next

## Autonomy Boundary

CHOICES.md is the autonomy boundary:
- **Inside scope** → director acts freely (bugs, gaps, refactors aligned with choices)
- **Outside scope** → NEXT.md surfaces it, user decides via `/choose`

```
CHOICES.md (user-steered)
    │
    ├── In scope? ──→ Director acts autonomously
    │                  (build, fix, refactor, test)
    │
    └── Out of scope? → NEXT.md (agent-discovered)
                          │
                          └── User accepts? → Update CHOICES.md → Director can act
```

## Cycle

1. `/choose` → user steers intent (interview, feedback)
2. replan → generate phases from intent
3. `/build` → execute phases autonomously (within scope)
4. `/next` → surface out-of-scope issues for user review
5. User accepts items → back to `/choose`

Each cycle tightens alignment between intent and implementation.
