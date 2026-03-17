# Session Scanner

Instructions for a scout agent to analyze pi session history.

## Input
- Session files: `.pi/agent/sessions/*.jsonl` (current project)
- Global sessions: `~/.pi/agent/sessions/*.jsonl` (cross-project patterns)

## Process

1. List session files, sorted by date (newest first), limit to last 14 days
2. For each session file, parse JSONL — each line is a message object
3. Look for these patterns:

### Failure Patterns
- Messages with `tool_error` or failed bash commands (exit code != 0)
- Repeated attempts at the same operation (3+ tries = signal)
- User corrections ("no", "wrong", "actually", "I meant")

### Token Waste
- Sessions > 50 messages without a commit (spinning)
- Large file reads followed by small edits (could have used grep)
- Repeated context re-establishment (agent forgot prior work)

### Repeated Manual Work
- Same file edited across 3+ sessions (hotspot)
- Same bash command run across 3+ sessions (should be automated)
- Same question asked across sessions (missing documentation)

## Output Format

```markdown
## Session Analysis

Period: {date range}
Sessions analyzed: {count}

### Failure Patterns
1. {pattern} — seen {N} times — files: {list}
2. ...

### Token Waste Signals
1. {pattern} — est. {N} tokens wasted — sessions: {list}
2. ...

### Repeated Manual Work
1. {file/command} — {N} occurrences — suggestion: {what to automate}
2. ...

### Hotspot Files
1. `{path}` — touched in {N} sessions — last: {date}
2. ...
```
