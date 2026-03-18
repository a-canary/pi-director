# pi-director

Autonomous project director for [pi](https://github.com/mariozechner/pi). Three operations, three artifacts:

| Command | Operation | Artifact | Question |
|---------|-----------|----------|----------|
| `/next` | Analyze & Recommend | NEXT.md | What's outside scope? |
| `/choose` | Clarify Intent | CHOICES.md | Why and what? |
| `/build` | TDD Development | PLAN.md | How to implement? |

## Quick Start

```bash
npm install @a-canary/pi-director @a-canary/pi-choose-wisely @a-canary/pi-upskill
```

Then run `/setup` — it auto-detects your providers and configures model routing:

```
/setup
```

This discovers auth.json credentials, environment variables, `.env` files, and local services (Ollama, LM Studio, vLLM, LiteLLM). You label each provider, and the router handles the rest.

## Model Selection

The director uses specialized subagents, each assigned to a model tier. The router selects the best model for each tier using **GDPval quality ranking + effective cost minimization**.

### Tier Selection Algorithm

| Tier | Quality filter | Then |
|------|---------------|------|
| `strategic` | Top 100% GDPval (best available) | Min effective cost among ties |
| `tactical` | Top 70% GDPval | Min effective cost |
| `operational` | Top 40% GDPval | Min effective cost |
| `scout` | Top 20% GDPval | Min effective cost |
| `fallback` | All models | Min effective cost |

### Provider Labels & Cost

During `/setup`, you label each provider:

| Label | Effective cost | Rate limit behavior |
|-------|---------------|---------------------|
| `free-limited` | `0` (always) | Backoff + failover. Cost never inflated. |
| `subscription` | `baseCost × 0.3 × (1 + rateLimitDays × RATE_MUX)` | Days accumulate → cost rises → rotates to alternate provider |
| `local` | `baseCost × 0.5` | Backoff + failover |
| `pay-as-you-go` | `baseCost × 1.0` | Backoff + failover |
| `disallow` | Excluded | Never routed |

**Emergent behavior**: free-limited models (qwen-cli, gemini-cli, openrouter free tier) are always selected first when they meet the quality threshold. Subscription providers rotate automatically when rate-limited — `rateLimitDays` accumulates while in 429-backoff, stays elevated after recovery, and reaches equilibrium over weeks. New models auto-slot via GDPval ranking.

## Autonomy Model

- **CHOICES.md** — user-steered intent. Only the user modifies it (via interviews and feedback).
- **Within CHOICES.md scope** — director acts autonomously. Bugs, gaps, refactors aligned with existing choices need no approval.
- **Outside CHOICES.md scope** — surfaces in NEXT.md for user review. Scope changes, contradictions, and new concerns require user acceptance before action.

## Priority Ladder

All work follows: **UX Quality > Security > Scale > Efficiency**. Each level is a release gate. Higher priorities never regress when pursuing lower ones.

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
│  │  reviewer  writer  critic      │      │
│  └────────────────────────────────┘      │
│                                          │
│  ┌─────────────────────────────────┐     │
│  │  /setup — Provider Discovery    │     │
│  │  Model Router Onboarding        │     │
│  └─────────────────────────────────┘     │
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
│   ├── writer.md           # operational — documentation
│   └── critic.md           # strategic — thinking-only review
├── skills/
│   ├── setup/              # /setup — provider discovery & router config
│   │   └── SKILL.md
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
| `/setup` | **Run first** — discover providers, label them, configure model routing |
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
