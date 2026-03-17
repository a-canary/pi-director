# Recommendation Ranker

How to score and rank recommendations from scanner outputs.

## Input
Combined findings from all scanners: session, code, choice, log.

## Scoring

Each recommendation gets three scores (1-3):

### Impact (how much does fixing this improve the project?)
- **3 (high)**: Affects core UX, blocks features, or causes user-visible issues
- **2 (medium)**: Improves maintainability, reduces debt, prevents future problems
- **1 (low)**: Nice-to-have cleanup, minor optimization

### Effort (how much work to fix?)
- **3 (small)**: < 1 hour, single file, clear fix
- **2 (medium)**: 1-4 hours, multiple files, some design needed
- **1 (large)**: > 4 hours, architectural change, needs planning

### Evidence (how strong is the supporting data?)
- **3 (strong)**: 5+ signals from multiple sources
- **2 (moderate)**: 2-4 signals or single strong signal
- **1 (weak)**: 1 signal, inference-based

### Priority Score
`priority = impact × effort × evidence` (max 27, min 1)

## Categories

Assign each recommendation exactly one category:
- **refactor** — restructure code without changing behavior
- **simplify** — remove complexity, dead code, over-abstraction
- **scope-change** — add/remove/modify a CHOICES.md decision
- **ux-improvement** — improve user experience based on evidence
- **upskill** — create/modify agent skill or rule to prevent recurring failures
- **debt** — address accumulated technical debt

## Priority Ladder Filter

After ranking, verify each recommendation respects M-0100:
- UX Quality recommendations always rank above Security-only items
- Security items rank above Scale-only items
- Scale items rank above Efficiency-only items
- Any recommendation that would regress a higher priority is flagged with ⚠️

## Output

Top 10 recommendations, sorted by priority score descending:

```markdown
## Priority 1: {title}
Category: {category} | Impact: {high/med/low} | Effort: {small/med/large} | Score: {N}
Evidence: {what data supports this — scanner, count, files}
Action: {specific steps to take}
Supports: {CHOICES.md IDs affected, if any}
```
