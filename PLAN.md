# PLAN.md — Implementation Plan

## Objective
Implement pi-director as a functional pi package with three working operations (/next, /choose, /build) that orchestrate subagents autonomously.

## Scope
**In**: Agent discovery, model tiering, /next analysis engine, /build phase execution, /choose integration, nightly extension, tests.
**Out**: Publishing to npm (separate step), UI/TUI beyond status widgets, multi-project orchestration.

---

## Phase 1: Agent Foundation — Model Tiering & Discovery
Make agents use model groups instead of hardcoded models. Add relative discovery.

### Steps
- [x] 1.1 Update all agent .md frontmatter to use model groups (strategic/tactical/operational/scout) instead of hardcoded provider/model strings
- [x] 1.2 Update director.md agent discovery to check package-relative agents/ dir, then project .pi/agents/, then ~/.pi/agent/agents/
- [x] 1.3 Add director.md reference to the three skills (/next, /choose, /build) so it knows its operational modes
- [x] 1.4 Create agents/README.md documenting model tier assignments and discovery order

### Gates
- [x] All agent .md files use model group names, not provider/model strings
- [x] Director agent discovery section references package-relative path first

---

## Phase 2: /next — Session & Code Analysis Engine
Build the data gathering and recommendation pipeline.

### Steps
- [x] 2.1 Create skills/next/lib/session-scanner.md — instructions for scout agent to parse .pi/agent/sessions/*.jsonl, extract failure patterns, token waste, repeated operations
- [x] 2.2 Create skills/next/lib/code-scanner.md — instructions for scout agent to find complexity hotspots (files >300 lines, functions >50 lines, untested code, dead exports)
- [x] 2.3 Create skills/next/lib/choice-scanner.md — instructions for scout agent to diff CHOICES.md against codebase, find unimplemented/stale choices
- [x] 2.4 Create skills/next/lib/log-scanner.md — instructions for scout agent to parse app logs for recurring errors
- [x] 2.5 Create skills/next/lib/ranker.md — ranking algorithm: impact × inverse-effort × evidence-strength
- [x] 2.6 Update skills/next/SKILL.md to reference lib modules and define the parallel gather → analyze → rank → write workflow
- [x] 2.7 Create templates/NEXT.md — template for generated recommendations file

### Gates
- [x] Each scanner module is a self-contained instruction set a scout agent can execute
- [x] SKILL.md references all lib modules and describes parallel dispatch
- [x] templates/NEXT.md exists with placeholder structure

---

## Phase 3: /build — Director Phase Execution
Refine the build skill to be the canonical phase execution loop.

### Steps
- [x] 3.1 Extract the core loop from agents/director.md into skills/build/lib/phase-loop.md as reusable reference
- [x] 3.2 Create skills/build/lib/regression-check.md — priority ladder regression verification
- [x] 3.3 Create skills/build/lib/hard-stops.md — enumeration of hard vs soft issues with decision tree
- [x] 3.4 Update skills/build/SKILL.md to reference lib modules
- [x] 3.5 Slim down agents/director.md to reference build skill instead of duplicating the loop

### Gates
- [x] Director agent references build skill for phase execution
- [x] Hard stop vs soft issue classification is documented in lib/hard-stops.md
- [x] No duplication between director.md and build/SKILL.md

---

## Phase 4: /choose — pi-choose-wisely Integration
Wire choose skill to delegate to pi-choose-wisely and bridge to replan.

### Steps
- [x] 4.1 Update skills/choose/SKILL.md with concrete delegation instructions: which pi-choose-wisely skill to invoke for each operation (bootstrap, audit, change, interview)
- [x] 4.2 Add replan bridge: after CHOICES.md changes, auto-suggest regenerating PLAN.md
- [x] 4.3 Add /next bridge: after CHOICES.md changes, note that /next should re-analyze
- [x] 4.4 Document the CHOICES.md → replan → PLAN.md → /build pipeline in skills/choose/lib/pipeline.md
- [x] 4.5 Define autonomy boundary: CHOICES.md (user-steered) vs NEXT.md (agent-discovered, out-of-scope)

### Gates
- [x] Choose skill has explicit delegation paths for all pi-choose-wisely operations
- [x] Pipeline documentation shows complete flow from intent to execution

---

## Phase 5: Nightly Extension
TypeScript extension for scheduled analysis.

### Steps
- [x] 5.1 Create extensions/nightly-analysis.ts following pi-pi.ts pattern — spawns pi with /next skill on configurable schedule
- [x] 5.2 Add TUI widget showing last analysis time and top 3 recommendations from NEXT.md
- [x] 5.3 Add /nightly-status command to show schedule and last run
- [x] 5.4 Add configuration for schedule (default: daily at 2am, configurable via /nightly-set)

### Gates
- [ ] Extension loads without errors when pi starts
- [x] /nightly-status command responds with schedule info
- [x] Widget renders placeholder when no NEXT.md exists

---

## Phase 6: Tests & Validation
Verify the package works end-to-end.

### Steps
- [x] 6.1 Create test/agents.test.ts — validate all agent .md files parse correctly (frontmatter, model groups, required fields)
- [x] 6.2 Create test/skills.test.ts — validate all SKILL.md files exist and have required sections
- [x] 6.3 Create test/package.test.ts — validate package.json pi config points to real directories
- [x] 6.4 Create test/next-template.test.ts — validate NEXT.md template structure
- [x] 6.5 Run full test suite, fix any failures — 72/72 pass
- [x] 6.6 Update README.md with final structure and usage

### Gates
- [x] `npm test` passes with all tests green
- [x] README.md reflects actual package contents
