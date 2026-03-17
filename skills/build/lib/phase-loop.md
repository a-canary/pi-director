# Phase Loop

Core execution loop for a single PLAN.md phase. The director agent follows this for each phase.

## Input
- PLAN.md with phases, steps, and gates
- CHOICES.md for context and constraints
- Current phase number (first incomplete)

## Loop

```
┌─────────────────┐
│ 1. Read Gates   │ ← PLAN.md + CHOICES.md
└────────┬────────┘
         ▼
┌─────────────────┐
│ 2. Recon        │ ← scout agents (parallel)
└────────┬────────┘
         ▼
┌─────────────────┐
│ 3. Refine Plan  │ ← planner + writer agents
└────────┬────────┘
         ▼
┌─────────────────┐
│ 4. Experiments  │ ← builder agent (throwaway PoC)
└────────┬────────┘
         ▼
┌─────────────────┐
│ 5. Build & Test │ ← builder + reviewer agents (parallel when safe)
└────────┬────────┘
         ▼
┌─────────────────┐
│ 6. Gate Check   │ ← verify exit criteria + priority regression
└────────┬────────┘
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

### 3. Refine Plan
If phase steps are vague:
- Delegate to **planner** with recon findings
- Planner produces concrete steps with file paths and function names
- Delegate to **writer** to update PLAN.md

### 4. Experiments
Only if phase involves unknowns:
- Delegate throwaway PoC to **builder**
- Success → proceed
- Failure + impacts CHOICES.md → STOP (see [hard-stops.md](hard-stops.md))
- Failure + alternative exists → update plan, continue

### 5. Build & Test
- Delegate to **builder** agents
- Parallel when tasks touch independent files
- After each builder: delegate to **reviewer**
- Reviewer issues → delegate fixes to builder
- Run test suite after implementation

### 6. Gate Check
Verify every exit criterion from the phase:
- Run commands listed in gates
- Check for priority ladder regression (see [regression-check.md](regression-check.md))
- All gates pass → mark phase complete in PLAN.md
- Any gate fails → diagnose and fix, or STOP if infeasible

## Multi-Phase Mode

When user says "do all phases" or "implement the plan":
1. Execute steps 1-6 for current phase
2. On success, loop to step 1 for next phase
3. Continue until all phases complete or hard stop hit
