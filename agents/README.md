# Agents

Specialized subagent definitions for pi-director.

## Model Tiers

| Agent | Tier | Rationale |
|-------|------|-----------|
| director | strategic | Orchestration requires highest reasoning |
| planner | strategic | Architecture decisions need deep analysis |
| reviewer | tactical | Quality/cost balance for code review |
| builder | operational | High throughput for implementation |
| scout | scout | Cheapest tier for fast read-only recon |
| writer | operational | High throughput for documentation |

## Discovery Order

Agents are discovered in priority order:
1. **Package agents** — `@a-canary/pi-director/agents/` (always available)
2. **Project agents** — `.pi/agents/` (project-specific overrides)
3. **Global agents** — `~/.pi/agent/agents/` (user-level fallback)

Project agents with the same name override package agents.

## Priority Ladder

All agents operate under the priority ladder (M-0100):
**UX Quality > Security > Scale > Efficiency**

No agent action may regress a higher-priority concern.
