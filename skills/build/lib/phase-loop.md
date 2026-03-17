# Phase Loop

Core execution loop for a single PLAN.md phase. The director agent follows this for each phase.

## Input
- PLAN.md with phases, steps, and gates
- CHOICES.md for context and constraints
- Current phase number (first incomplete)

## Loop

```
┌──────────────────┐
│ 1. Read Gates    │ ← PLAN.md + CHOICES.md
└────────┬─────────┘
         ▼
┌──────────────────┐
│ 2. Recon         │ ← scout agents (operational, parallel, many tool calls)
└────────┬─────────┘
         ▼
┌──────────────────┐
│ 3. Plan          │ ← planner agent (tactical, few tool calls)
└────────┬─────────┘
         ▼
┌──────────────────┐
│ 4. Critique      │ ← critic agent (strategic, ZERO tools, decision tree)
└────────┬─────────┘
         ▼
┌──────────────────┐
│ 5. Finalize      │ ← planner resolves decision tree branches (tactical)
└────────┬─────────┘
         ▼
┌──────────────────┐
│ 6. Build & Test  │ ← builder + reviewer agents (operational/tactical)
└────────┬─────────┘
         ▼
┌──────────────────┐
│ 7. Gate Critique │ ← critic reviews results (strategic, ZERO tools)
└────────┬─────────┘
    pass │    │ fail
         ▼    ▼
      ✅ Next  → diagnose → retry or ❌ STOP
```

## Step Details

### 1. Read Gates
- Parse PLAN.md for current phase's steps and gates
- Parse CHOICES.md for relevant decisions
- Identify: exit criteria, assumptions, blockers

### 2. Recon
Spawn parallel read-only agents:
- **scout**: `find`, `grep`, `read` relevant codebase areas
- **scout** (web): context7/web-search if phase references external APIs/libraries
- Output: compressed context for builder handoff

### 3. Plan (tactical)
Delegate to **planner** agent with recon findings:
- Planner synthesizes concrete steps with file paths and function names
- Few tool calls — reads specific files to confirm assumptions
- Produces structured plan for critique

### 4. Critique (strategic — zero tools)
Delegate to **critic** agent with:
- Recon summary (from step 2)
- Proposed plan (from step 3)
- CHOICES.md context + priority ladder
- Critic produces: approval/improvements + **decision tree** (max 8 leaves) for unknowns
- Critic uses maximum thinking depth for elevated reasoning

### 5. Finalize (tactical)
Delegate back to **planner** to incorporate critique:
- Resolve decision tree branches using tool calls (check conditions)
- Apply critic's improvements
- Delegate to **writer** to update PLAN.md
- If critique rejected the plan → rework or STOP

### 6. Build & Test (operational)
- Delegate to **builder** agents (parallel when tasks touch independent files)
- After each builder: delegate to **reviewer** (tactical)
- Reviewer issues → delegate fixes to builder
- Run test suite after implementation

### 7. Gate Critique (strategic — zero tools)
Delegate to **critic** with:
- Phase gate results + exit criteria
- Regression check results (see [regression-check.md](regression-check.md))
- Implementation summary
- Critic approves, or produces decision tree for remediation
- If critic rejects → diagnose and fix via tactical/operational agents, or STOP if infeasible
- All gates pass → mark phase complete in PLAN.md

## Multi-Phase Mode

When user says "do all phases" or "implement the plan":
1. Execute steps 1-6 for current phase
2. On success, loop to step 1 for next phase
3. Continue until all phases complete or hard stop hit
