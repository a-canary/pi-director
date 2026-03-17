# Choose — Project Intent Clarification

Wrapper around pi-choose-wisely for managing CHOICES.md within the director workflow.

## When to Use
- User asks to clarify project intent, scope, goals
- User runs `/choose`
- New project without CHOICES.md

## Process
This skill delegates to pi-choose-wisely's choose-wisely skill. It adds director-specific context:

1. If CHOICES.md missing → run pi-choose-wisely bootstrap (scan existing docs)
2. If user describes a change → apply via pi-choose-wisely with cascade audit
3. If user says "audit" → run pi-choose-wisely audit
4. After any CHOICES.md change → offer to run replan to update PLAN.md

## Integration Points
- After CHOICES.md changes, suggest `/build` if PLAN.md exists
- After CHOICES.md changes, suggest `/next` for impact analysis
- Feed CHOICES.md gaps into `/next` recommendations

## Delegates To
- pi-choose-wisely:choose-wisely skill (all CHOICES.md operations)
- pi-choose-wisely:replan skill (gap analysis → PLAN.md generation)
