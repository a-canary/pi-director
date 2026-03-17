# Regression Check

Verify that changes don't regress higher-priority concerns (M-0100, A-0100).

## When to Run
- After every build step (Step 5 of phase loop)
- As part of gate check (Step 6 of phase loop)
- Before marking any phase complete

## Check Order

Run checks top-down through the priority ladder. Stop at first regression.

### 1. UX Quality Regression
- Do all existing user-facing features still work?
- Has any error message become less clear?
- Has any workflow gained extra steps?
- Do interactive elements still respond correctly?

**How to verify:**
```bash
# Run existing tests
npm test 2>&1
# Check for removed/changed public APIs
git diff --stat HEAD~1 | grep -E '\.(ts|js|py)$'
# Manual: does the happy path still work?
```

### 2. Security Regression
- Are there new unvalidated inputs?
- Are secrets still protected (no hardcoded keys)?
- Are dependencies from trusted sources?
- Are permissions still properly scoped?

**How to verify:**
```bash
# Check for hardcoded secrets
grep -rn 'password\|secret\|api_key\|token' --include='*.ts' --include='*.js' | grep -v node_modules | grep -v '.md'
# Check new dependencies
git diff HEAD~1 -- package.json
```

### 3. Scale Regression (if past scale gate)
- Does the change add O(n²) or worse operations?
- Are there new unbounded loops or recursions?
- Are new resources properly cleaned up?

### 4. Efficiency Check (informational only)
- Note any efficiency impacts but don't block
- Log as suggestion for future optimization

## Output

```markdown
### Regression Check
- [x] UX Quality: {pass/fail — details}
- [x] Security: {pass/fail — details}
- [ ] Scale: {pass/fail — details}
- [ ] Efficiency: {noted — details}
```

If any check fails at a level higher than the current work's priority:
→ **Hard stop. Do not proceed.**
