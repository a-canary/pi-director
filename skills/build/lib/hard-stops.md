# Hard Stops vs Soft Issues

Decision tree for when to stop and ask the user vs handle autonomously.

## Hard Stops (require user input)

These MUST stop execution and present options to the user:

1. **Mission infeasible** — A CHOICES.md Mission goal cannot be achieved
2. **Security regression** — Change would compromise security (priority ladder violation)
3. **UX regression** — Change would degrade UX quality (priority ladder violation)
4. **External dependency broken** — Required service/API/library unavailable
5. **Architectural conflict** — Implementation contradicts CHOICES.md Architecture section
6. **Budget exceeded** — Token/cost budget exhausted

### Hard Stop Format
```
## ❌ BLOCKED: {phase title}

### Infeasibility
{what failed and why it cannot be worked around}

### Priority Impact
{which priority level is affected: UX Quality / Security / Scale / Efficiency}

### CHOICES.md Impact
{which choice IDs are affected}

### Options
A) {alternative — tradeoffs}
B) {alternative — tradeoffs}
C) {abandon this goal}

### Operator Decision Required
{specific question}
```

## Soft Issues (handle autonomously)

These should be fixed without asking:

1. **Library API changed** — find alternative, update plan
2. **Test failure** — diagnose root cause, fix
3. **Code review issues** — iterate with builder
4. **Missing documentation** — delegate to writer
5. **Linting/formatting** — auto-fix
6. **Minor dependency update** — update and verify tests pass

### Soft Issue Logging
Log soft issues in phase output but don't stop:
```
### Issues Resolved
- {issue}: {how it was fixed}
```

## Priority Ladder Check

Before classifying an issue, check against M-0100:
- Does fixing this **regress UX quality**? → Hard stop
- Does fixing this **compromise security**? → Hard stop
- Does fixing this **break at scale**? → Hard stop (if past scale gate)
- Is this purely an **efficiency concern**? → Soft issue (optimize later)
