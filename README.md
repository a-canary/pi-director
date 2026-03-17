# pi-director

Autonomous project director for [pi](https://github.com/mariozechner/pi). Three operations, three artifacts:

| Command | Operation | Artifact | Question |
|---------|-----------|----------|----------|
| `/next` | Analyze & Recommend | NEXT.md | What's outside scope? |
| `/choose` | Clarify Intent | CHOICES.md | Why and what? |
| `/build` | TDD Development | PLAN.md | How to implement? |

## Autonomy Model

- **CHOICES.md** — user-steered intent. Only the user modifies it (via interviews and feedback).
- **Within CHOICES.md scope** — director acts autonomously. Bugs, gaps, refactors aligned with existing choices need no approval.
- **Outside CHOICES.md scope** — surfaces in NEXT.md for user review. Scope changes, contradictions, and new concerns require user acceptance before action.

## Priority Ladder

All work follows: **UX Quality > Security > Scale > Efficiency**. Each level is a release gate. Higher priorities never regress when pursuing lower ones.

## Install

```bash
npm install @a-canary/pi-director @a-canary/pi-choose-wisely @a-canary/pi-upskill
```

## Architecture

```
┌──────────────────────────────────────────┐
│              pi-director                 │
│  ┌───────┐  ┌────────┐  ┌──────┐        │
│  │ /next │  │/choose │  │/build│        │
│  └───┬───┘  └───┬────┘  └──┬───┘        │
│      │          │          │             │
│  ┌───▼──────────▼──────────▼──────┐      │
│  │      Subagent Orchestration    │      │
│  │  scout  planner  builder       │      │
│  │  reviewer  writer              │      │
│  └────────────────────────────────┘      │
│                                          │
│  ┌─────────────────────────────────┐     │
│  │  Nightly Extension (cron)       │     │
│  │  /nightly-status /nightly-run   │     │
│  └─────────────────────────────────┘     │
├──────────────────────────────────────────┤
│  pi-choose-wisely   │   pi-upskill      │
│  CHOICES.md mgmt    │   corrections     │
└──────────────────────────────────────────┘
```

## Package Structure

```
pi-director/
├── agents/                 # Subagent definitions
│   ├── director.md         # strategic — orchestration
│   ├── planner.md          # strategic — architecture
│   ├── reviewer.md         # tactical — code review
│   ├── builder.md          # operational — implementation
│   ├── scout.md            # scout — fast recon
│   └── writer.md           # operational — documentation
├── skills/
│   ├── next/               # /next — analysis engine
│   │   ├── SKILL.md
│   │   └── lib/            # scanner modules + ranker
│   ├── build/              # /build — TDD phase loop
│   │   ├── SKILL.md
│   │   └── lib/            # phase-loop, hard-stops, regression-check
│   └── choose/             # /choose — wraps pi-choose-wisely
│       ├── SKILL.md
│       └── lib/            # pipeline documentation
├── extensions/
│   └── nightly-analysis.ts # scheduled /next execution
├── templates/
│   └── NEXT.md             # recommendation output format
├── CHOICES.md              # project intent
├── PLAN.md                 # implementation phases
└── package.json
```

## Commands

| Command | Description |
|---------|-------------|
| `/next` | Analyze project data, generate recommendations |
| `/choose` | Clarify project intent (wraps pi-choose-wisely) |
| `/build` | Execute PLAN.md phases via TDD loop |
| `/nightly-status` | Show analysis schedule and last run |
| `/nightly-run` | Trigger analysis immediately |
| `/nightly-set <hour>` | Set daily analysis hour (0-23) |

## Dependencies

- `@a-canary/pi-choose-wisely` — CHOICES.md management, replan
- `@a-canary/pi-upskill` — Correction analysis, session learning
- `@mariozechner/pi-coding-agent` — Pi runtime
