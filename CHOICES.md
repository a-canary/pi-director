# CHOICES.md — Source of Plan

All project choices in priority order. Higher choices constrain lower ones.
Use `/choose-wisely:choose` to add, change, remove, or reorder choices.
Use `/choose-wisely:choose-audit` to check for contradictions and structural issues.

## Rules

- **Position = Priority**: higher constrains lower, no exceptions
- **Gravity rule**: changing a choice triggers cascading review
- **Section order is fixed**: Mission > User Experiences > Features > Operations > Data > Architecture > Technology > Implementation
- **Supports line required**: every choice (except top) lists IDs it directly supports
- **Architecture is tool-agnostic**: Architecture describes patterns; Technology names tools
- **No status values**: git diff is the change record

### Choice Entry Format

```
### X-0001: Title of choice
Supports: X-0000, Y-0000

One to two lines of rationale. Not a spec. Just why this choice was made.
```

- ID format: `PREFIX-NNNN` (globally unique 4-digit number)
- Prefixes: `M-` (Mission), `UX-` (User Experiences), `F-` (Features), `O-` (Operations), `D-` (Data), `A-` (Architecture), `T-` (Technology), `I-` (Implementation)

---

## Mission

### M-0100: Priority ladder — UX Quality → Security → Scale → Efficiency

All components follow a strict priority ladder. Higher priorities must never regress when pursuing lower ones. Each level is a release gate:
1. **UX Quality** — prove it works well for users → UX testing gate
2. **Security** — prove it's safe → beta release gate
3. **Scale** — prove it handles growth → full release gate
4. **Efficiency** — optimize cost/speed → ongoing

### M-0001: Autonomous project development agent
Supports: M-0100

pi-director is the brain of pi-based development. It understands project intent, recommends what to do next, and executes development autonomously through specialized subagents. It replaces ad-hoc manual orchestration with a structured decision→plan→build loop.

### M-0002: Installable npm package for any pi project
Supports: M-0001

Every pi project (pi-default, pi-admin, etc.) installs pi-director via npm. It brings the full director stack: agents, skills, and extensions. No manual ~/.pi/ setup needed.

### M-0003: Data-driven decision making
Supports: M-0001

Recommendations come from evidence — session history, correction logs, code analysis, app output logs — not guesswork. The agent observes patterns and surfaces what matters.

---

## User Experiences

### UX-0001: Three clear operations with distinct outputs
Supports: M-0001

The user has exactly three high-level commands: `/next` (what should I do?), `/choose` (clarify intent), `/build` (execute the plan). Each produces a distinct artifact: NEXT.md, CHOICES.md, PLAN.md.

### UX-0002: CHOICES.md is user-steered intent
Supports: UX-0001

CHOICES.md represents what the user has decided through interviews and feedback. It is the user's voice. Agents never modify CHOICES.md autonomously — only the user steers it.

### UX-0003: NEXT.md surfaces agent-discovered issues outside CHOICES.md scope
Supports: UX-0001, M-0003

NEXT.md contains problems agents found that conflict with or expand beyond CHOICES.md. These require user approval before action — they represent scope changes, new concerns, or contradictions the user hasn't addressed yet.

### UX-0004: Director acts autonomously within CHOICES.md scope
Supports: UX-0002, UX-0003

Any issue that falls within the scope of CHOICES.md — bugs, test failures, implementation gaps, refactors aligned with existing choices — the director fixes autonomously. No approval needed. Only issues outside CHOICES.md scope go to NEXT.md for user review.

---

## Features

### F-0001: Next — Analysis and recommendation engine
Supports: UX-0001, UX-0002

Analyzes session history, correction logs (pi-upskill), code quality, test coverage, and app output logs. Produces NEXT.md with ranked, categorized recommendations: refactors, simplifications, scope changes, UX improvements, upskilling opportunities.

### F-0002: Choose — Project intent clarification
Supports: UX-0001

Wraps pi-choose-wisely. Manages CHOICES.md through structured interview, bootstrap from existing docs, cascading audit on changes. Defines the WHY and WHAT.

### F-0003: Build — TDD iterative development loop
Supports: UX-0001, UX-0003

Executes PLAN.md phases using the director pattern: establish gates → recon → refine plan → feasibility experiments → build/test/gate check. Marks phases complete, loops until done or blocked.

### F-0004: Nightly analysis cron
Supports: F-0001, M-0003

Runs the analysis engine on a schedule (nightly or configurable). Produces fresh NEXT.md so the developer starts each day with prioritized recommendations.

### F-0005: Parallel subagent delegation
Supports: F-0003, M-0001

Uses pi's subagent system to run independent tasks in parallel — scout + web-search simultaneously, multiple builders on independent files, reviewer while next phase plans.

### F-0006: Replan — Gap analysis between CHOICES.md and current state
Supports: F-0002, F-0003

Wraps pi-choose-wisely's replan skill. Compares CHOICES.md against codebase reality, generates PLAN.md for next implementation phase. Bridge between intent and execution.

---

## Operations

### O-0100: Four release gates matching priority ladder
Supports: M-0100

Each component progresses through gates in order. No gate may regress a prior one:
1. **UX Testing** — prove UX quality with real usage → internal/alpha
2. **Security Audit** — prove safety with review + hardening → beta publish
3. **Scale Testing** — prove it handles load/growth → full publish
4. **Efficiency Optimization** — reduce cost/latency → ongoing post-release

### O-0001: Subagent model tiering
Supports: F-0005

Strategic model (opus) for director/planning. Tactical for review. Operational/scout for builders and recon. Minimizes cost while preserving quality where it matters.

### O-0002: Hard stop vs soft issue classification
Supports: F-0003

Hard stops (mission infeasible, security breach, external dep broken) require user input. Soft issues (API changed, test failure, review nits) are handled autonomously. Clear escalation policy.

---

## Data

### D-0001: NEXT.md — Recommendation artifact
Supports: F-0001

Structured markdown with ranked recommendations. Categories: refactor, simplify, scope-change, ux-improvement, upskill, debt. Each item has rationale, effort estimate, and supporting evidence (source file, session, log line).

### D-0002: Session and correction log analysis
Supports: F-0001, M-0003

Reads pi session history (.pi/agent/sessions/*.jsonl) and correction logs (.pi/corrections.jsonl) to identify patterns: repeated failures, wasted tokens, recurring manual fixes.

### D-0003: CHOICES.md and PLAN.md as source of truth
Supports: F-0002, F-0003

CHOICES.md defines intent (managed by pi-choose-wisely). PLAN.md defines execution phases (managed by replan + director). Both are markdown, version-controlled, human-readable.

---

## Architecture

### A-0100: Non-regression constraint across priority levels
Supports: M-0100, O-0100

Every change must pass a regression check: does this degrade UX quality? If pursuing security, does it make the UX worse? If pursuing scale, does it compromise security or UX? Gate checks in /build enforce this — no phase completes if a higher-priority concern regresses.

### A-0001: Three-layer architecture
Supports: M-0001

Layer 1: Skills (next, choose, build) — user-facing operations invoked by commands.
Layer 2: Agent definitions (director, builder, planner, reviewer, scout, writer) — specialized roles spawned as subagents.
Layer 3: Analysis modules — data readers for sessions, logs, code metrics.

### A-0002: Skills as orchestrators, agents as executors
Supports: A-0001, F-0005

Skills contain the workflow logic (what to do in what order). Agent .md files define persona and constraints. Skills spawn agents via pi's subagent system. Skills never implement code directly.

### A-0003: Extension for nightly/scheduled analysis
Supports: F-0004, A-0001

A pi extension handles the cron/scheduling aspect. It invokes the `next` skill on a timer and writes NEXT.md. Follows the pi-pi.ts pattern for spawning analysis agents.

### A-0004: Dependency on pi-choose-wisely for CHOICES.md operations
Supports: F-0002, F-0006

pi-director does not duplicate CHOICES.md logic. It depends on pi-choose-wisely as an npm peer dependency. The `choose` and `replan` skills are re-exported/wrapped.

### A-0005: Dependency on pi-upskill for correction analysis
Supports: F-0001, D-0002

pi-director consumes pi-upskill's correction logs and analyze skill as input to the recommendation engine. pi-upskill remains a separate package.

---

## Technology

### T-0001: Pi package format with npm distribution
Supports: M-0002, A-0001

Structured as a pi package (package.json with `pi.skills`, `pi.agents`, `pi.extensions`). Published to npm as `@a-canary/pi-director`. Installed per-project.

### T-0002: TypeScript extension following pi-pi.ts patterns
Supports: A-0003

The scheduling extension is TypeScript using pi's ExtensionAPI. Spawns agents via `spawn("pi", ...)` like pi-pi.ts does. Uses TUI widgets for status display.

### T-0003: Peer dependencies on pi-choose-wisely and pi-upskill
Supports: A-0004, A-0005

`peerDependencies`: `@a-canary/pi-choose-wisely`, `pi-upskill`, `@mariozechner/pi-coding-agent`. User installs all three; pi-director orchestrates them.

---

## Implementation

### I-0001: Migrate agent definitions from ~/.pi/agent/agents/
Supports: A-0001, M-0002

Move director.md, builder.md, planner.md, reviewer.md, scout.md, writer.md from global ~/.pi/agent/agents/ into this package's agents/ directory. Update model references to use model groups.

### I-0002: Skill files reference agent definitions relatively
Supports: A-0002, I-0001

Skills discover agents from the package's agents/ directory. No hardcoded paths. Agent discovery uses `ls` on known locations (package agents/, project .pi/agents/, global ~/.pi/agent/agents/).

### I-0003: Test with vitest
Supports: M-0002

Unit tests for analysis modules (session parsing, recommendation ranking). Integration tests for skill workflows using mock sessions. Follows pi-model-router's test pattern.
