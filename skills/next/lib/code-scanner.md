# Code Scanner

Instructions for a scout agent to find code quality issues.

## Process

1. Get project file list:
```bash
find . -type f \( -name "*.ts" -o -name "*.js" -o -name "*.py" -o -name "*.go" -o -name "*.rs" \) \
  -not -path '*/node_modules/*' -not -path '*/.git/*' -not -path '*/dist/*'
```

2. For each source file, check:

### Complexity Hotspots
- Files > 300 lines: `wc -l` on each file
- Functions > 50 lines: grep for function definitions, count lines to next function/end
- Deeply nested code: grep for 4+ levels of indentation

### Test Coverage Gaps
- Source files without corresponding test file (`*.test.*`, `*.spec.*`)
- Test files that exist but are empty or have no assertions
- Untested exports: public functions/classes not referenced in tests

### Dead Code
- Exported functions not imported anywhere else
- Files not imported by any other file
- Unused dependencies in package.json

### Dependency Health
- `package.json` deps vs what's actually imported
- Outdated major versions (if lockfile available)

## Output Format

```markdown
## Code Analysis

Files scanned: {count}
Total lines: {count}

### Complexity Hotspots
1. `{path}` — {lines} lines, {reason}
2. ...

### Missing Tests
1. `{path}` — no test file found
2. ...

### Dead Code Candidates
1. `{path}:{export}` — not imported anywhere
2. ...

### Dependency Issues
1. `{package}` — {issue}
2. ...
```
