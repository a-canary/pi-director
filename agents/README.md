# Agents

Specialized subagent definitions for pi-director.

## Model Tiers

| Agent | Tier | Tools | Rationale |
|-------|------|-------|-----------|
| critic | strategic | **none** | Pure reasoning — reviews, improves, produces decision trees |
| director | tactical | read, bash, grep, find, ls | Orchestrates pipeline, delegates to specialists |
| planner | tactical | read, grep, find, ls | Synthesizes plans from recon context |
| reviewer | tactical | read, grep, find, ls, bash | Code review for quality and security |
| builder | operational | read, write, edit, bash, grep, find, ls | High-throughput implementation |
| scout | scout | read, grep, find, ls, bash | Cheapest tier for fast read-only recon |
| writer | operational | read, write, edit, grep, find, ls | Documentation updates |

## Strategic Model Philosophy

Strategic models are the most expensive. We maximize their value by:
1. **Zero tools** — no tool-call loops burning tokens
2. **Curated input** — cheaper agents gather and summarize context first
3. **Structured output** — decision trees (max 8 leaves) that cheaper agents can evaluate and execute
4. **Maximum thinking depth** — ultrathink/extended thinking for elevated reasoning

### Standard Pipeline
```
operational (recon) → tactical (plan) → strategic (critique) → tactical (finalize) → operational (build)
```

Strategic activation happens exactly twice per phase: plan critique and gate critique.

## Discovery Order

1. **Package agents** — `@a-canary/pi-director/agents/` (always available)
2. **Project agents** — `.pi/agents/` (project-specific overrides)
3. **Global agents** — `~/.pi/agent/agents/` (user-level fallback)

## Priority Ladder

All agents operate under M-0100: **UX Quality > Security > Scale > Efficiency**

No agent action may regress a higher-priority concern.
