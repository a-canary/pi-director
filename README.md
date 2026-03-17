# pi-director

Autonomous project director for [pi](https://github.com/mariozechner/pi). Three operations, three artifacts:

| Command | Operation | Artifact | Question |
|---------|-----------|----------|----------|
| `/next` | Analyze & Recommend | NEXT.md | What should I do? |
| `/choose` | Clarify Intent | CHOICES.md | Why and what? |
| `/build` | TDD Development | PLAN.md | How to implement? |

## Install

```bash
npm install @a-canary/pi-director @a-canary/pi-choose-wisely @a-canary/pi-upskill
```

## Architecture

```
┌─────────────────────────────────────┐
│           pi-director               │
│  ┌───────┐ ┌────────┐ ┌──────┐     │
│  │ /next │ │/choose │ │/build│     │
│  └───┬───┘ └───┬────┘ └──┬───┘     │
│      │         │         │          │
│  ┌───▼─────────▼─────────▼───┐      │
│  │     Subagent Orchestration │      │
│  │  scout planner builder     │      │
│  │  reviewer writer           │      │
│  └────────────────────────────┘      │
├─────────────────────────────────────┤
│  pi-choose-wisely  │  pi-upskill   │
│  CHOICES.md mgmt   │  corrections  │
└─────────────────────────────────────┘
```

## Agents

All agents are bundled and available as subagents:

- **director** — Orchestrates phases, delegates to specialists
- **builder** — Writes code, runs tests, commits
- **planner** — Architecture and implementation planning (read-only)
- **reviewer** — Code review for quality and security (read-only)
- **scout** — Fast codebase recon (read-only)
- **writer** — Documentation and technical writing

## Dependencies

- `@a-canary/pi-choose-wisely` — CHOICES.md management, replan
- `@a-canary/pi-upskill` — Correction analysis, session learning
- `@mariozechner/pi-coding-agent` — Pi runtime
