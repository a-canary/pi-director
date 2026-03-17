# Log Scanner

Instructions for a scout agent to parse application output logs.

## Process

1. Find log files:
```bash
find . -name "*.log" -not -path '*/node_modules/*' -not -path '*/.git/*' 2>/dev/null
ls logs/ 2>/dev/null
ls .pi/*.log 2>/dev/null
```

2. Also check for common log patterns:
- `npm test` output (captured in CI or local)
- Docker logs if containerized
- stderr output captured in session files

3. For each log source, extract:

### Error Patterns
- Repeated error messages (same error 3+ times)
- Stack traces with common root causes
- Warnings that escalated to errors over time

### Performance Signals
- Slow operations (timeout warnings, > 5s responses)
- Memory warnings
- Rate limit hits

### Runtime Issues
- Deprecated API usage warnings
- Unhandled promise rejections
- Missing environment variables

## Output Format

```markdown
## Log Analysis

Log sources found: {count}
Period: {date range}

### Recurring Errors
1. `{error message}` — {count} occurrences — source: {file/component}
2. ...

### Performance Issues
1. {description} — {frequency} — impact: {assessment}
2. ...

### Warnings
1. {description} — {count} occurrences
2. ...
```
