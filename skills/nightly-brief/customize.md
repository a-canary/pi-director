# Nightly Brief — Director Customization Guide

Create `skills/nightly-brief/project.md` in your project root to override or extend the default brief behavior. The director loads this file during Step 2 if it exists.

## Override API

### Add Project-Specific Scanners

```markdown
## extra-scanners

Run these additional scanners in parallel with the default five:

- **API health check**: curl the project's health endpoint, report latency and status codes
- **Queue depth**: check Redis/DB for job queue depth, flag if > threshold
- **External dependency freshness**: check if third-party API schemas/tokens are still valid
```

### Suppress Default Sections

```markdown
## suppress

- progress    # omit progress bullets (e.g., repo has no recent commits to analyze)
- blockers    # omit blocker section (team handles blockers separately)
```

### Override Category Weights

```markdown
## category-weights

# Boost certain categories so they rank higher in item selection
evolution: 2x     # this project prioritizes feature growth
simplify: 1.5x    # accumulated complexity is a known problem
upskill: 0x       # suppress upskill recommendations in brief (handle separately)
```

### Override Item Count

```markdown
## item-count
max: 5            # default is 3-4; increase for fast-moving projects
min: 2            # don't pad below this; post nothing if < 2 strong items
```

### Override Discord Format

```markdown
## discord-format

Replace the default Status/Progress/Blockers header with a custom opening:

> 🚀 **{Project} Daily — {Date}**
> Trades processed: {metric from log-scanner} | P&L today: {custom metric}

(Use {metric-name} to reference values from extra-scanners output)
```

### Restrict Autonomous Scope

```markdown
## autonomous-restrictions

# Only auto-act on these categories (others always require approval)
auto-act: fix, simplify

# Require approval for all evolutions regardless of CHOICES.md coverage
require-approval: evolution
```

### Add Project-Specific Evidence Sources

```markdown
## evidence-sources

- file: logs/trading.log         # parsed by log-scanner
- file: reports/daily-pnl.csv    # custom metric, include last 7 rows in status
- url: http://localhost:3000/metrics  # scraped during status scan
```

## Example: Trading Project

```markdown
## extra-scanners
- **P&L drift**: compare last 7 days rolling returns vs benchmark in reports/daily-pnl.csv
- **Model staleness**: check last model retrain date in state/model-meta.json, flag if > 7 days

## discord-format
Opening line: "📈 **Starlight Daily — {Date}** | Trades: {trade_count} | Win rate: {win_rate}%"

## autonomous-restrictions
require-approval: evolution     # don't auto-expand trading strategy scope
auto-act: fix, refactor, simplify

## item-count
max: 4
```

## Example: Dashboard/UI Project

```markdown
## extra-scanners
- **Bundle size**: run `du -sh dist/` and compare to last brief's size
- **Lighthouse score**: check if lighthouse report exists in reports/, flag regressions

## category-weights
ux-improvement: 2x    # UX is the whole product

## suppress
- progress    # git history tells the story already
```
