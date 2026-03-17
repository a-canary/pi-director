# Choice Scanner

Instructions for a scout agent to diff CHOICES.md against codebase reality.

## Process

1. Read CHOICES.md, extract all choices with IDs and titles
2. For each choice, assess implementation status:

### Status Assessment

| Status | Evidence |
|--------|----------|
| **Fulfilled** | Code exists, tests pass, feature works |
| **Partial** | Some code exists, incomplete or untested |
| **Not started** | No implementation evidence |
| **Stale** | Code exists but contradicts current choice wording |
| **Orphaned** | Implementation exists for a choice that was removed |

3. Check for gaps:
- Choices in Technology section without matching `package.json` deps
- Choices in Architecture section without matching directory structure
- Choices in Features section without matching code paths

4. Check PLAN.md alignment:
- Plan phases that reference removed/changed choices
- Completed plan phases whose choices have since changed

## Output Format

```markdown
## Choice-Reality Gap Analysis

CHOICES.md: {N} choices
Codebase: {M} source files

### Status
- ✓ Fulfilled: {count} — {IDs}
- ◐ Partial: {count} — {IDs}
- ✗ Not started: {count} — {IDs}
- ⚠ Stale: {count} — {IDs}
- 👻 Orphaned: {count} — {descriptions}

### Gaps
1. {choice ID}: {what's missing}
2. ...

### PLAN.md Drift
1. Phase {N}: {misalignment description}
2. ...
```
