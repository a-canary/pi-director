---
name: setup
description: Provider discovery and model router onboarding. Detects auth.json, env vars, .env files, and local services. Asks user to label each provider/model-group, then writes models.json tier stubs and router.json with cost model for emergent tier selection.
command: /setup
---

# /setup — Provider Discovery & Model Router Onboarding

Run this once after installing `@a-canary/pi-director`. It wires your available AI providers to the model tier groups (strategic/tactical/operational/scout/fallback) using a cost model that produces emergent, adaptive model selection.

---

## Cost Model

The router selects models by **effective cost**. Within the GDPval quality pool for each tier, the model with the lowest effective cost is selected.

### Labels and effectiveCost

| Label | effectiveCost formula | When rate-limited |
|---|---|---|
| `free-limited` | `0` (always) | Exponential backoff → failover to next model in pool. Cost stays 0. |
| `subscription` | `baseCost × 0.3 × (1 + rateLimitCount × RATE_MUX)` | `rateLimitCount++` inflates cost → router pivots to alternate subscription provider |
| `local` | `baseCost × 0.5` | Exponential backoff → failover. Cost unchanged. |
| `pay-as-you-go` | `baseCost × 1.0` | Exponential backoff → failover. Cost unchanged. |
| `disallow` | `Infinity` | Never in pool. |

Where:
- **`baseCost`** — model's published cost per million tokens ($/Mtok). Source: provider pricing page, or matched from OpenRouter's model list if missing. Free-limited models have `baseCost=0`.
- **`rateLimitCount`** — counts rate-limit hits for **subscription models only**. Artificially raises effective cost to rotate between subscription providers (e.g. chutes → claudeMax). Resets when the provider stops being rate-limited.
- **`RATE_MUX`** — scaling factor (e.g. `0.5`). After 2 hits, effective cost doubles; after 4 hits, triples. This is enough to overcome the subscription discount and trigger a provider switch.

### Ordering Invariant (same model, no rate limiting)

```
free-limited (0)  <  subscription (base×0.3)  <  local (base×0.5)  <  pay-as-you-go (base×1.0)
```

Free-limited models always win on cost. When they are rate-limited, backoff + failover handles it — their cost is never inflated. The router moves to the next available free-limited model, then falls back to subscription.

### Subscription Provider Rotation

```
chutes  (rateLimitCount=2): base × 0.3 × (1 + 2×0.5) = base × 0.3 × 2.0 = base × 0.6
claudeMax (rateLimitCount=0): base × 0.3 × 1.0 = base × 0.3   ← selected
```

Once chutes stops rate-limiting and `rateLimitCount` resets, it becomes cheap again and competes.

### Per-Model-Group Labeling

Providers like OpenRouter mix free and paid models in the same account. Label at the **model-group level**:
- `openrouter (free models)` — models with `:free` suffix → `free-limited`
- `openrouter (paid models)` — all other OpenRouter models → label as appropriate

Similarly, qwen-cli, gemini-cli, opencode, kilo-code, and other CLI tools typically offer a free-limited tier alongside paid options.

---

## Phase 1 — Discover Existing Configuration

### 1.1 Read `~/.pi/agent/auth.json`

Check for credential entries (non-empty `key` or `access` field):

| auth.json key    | Provider              | Default label guess       |
|------------------|-----------------------|---------------------------|
| `anthropic`      | Anthropic API         | pay-as-you-go             |
| `openai`         | OpenAI API            | pay-as-you-go             |
| `google`         | Google Gemini API     | pay-as-you-go             |
| `openrouter`     | OpenRouter            | split: free-limited + ask |
| `groq`           | Groq                  | pay-as-you-go             |
| `mistral`        | Mistral               | pay-as-you-go             |
| `xai`            | xAI (Grok)            | pay-as-you-go             |
| `cerebras`       | Cerebras              | pay-as-you-go             |
| `zai`            | ZAI                   | pay-as-you-go             |
| `kimi-coding`    | Kimi For Coding       | pay-as-you-go             |
| `minimax`        | MiniMax               | pay-as-you-go             |
| `huggingface`    | Hugging Face          | pay-as-you-go             |
| `qwen-cli`       | Qwen CLI              | free-limited              |
| `github-copilot` | GitHub Copilot        | subscription              |
| `gemini-cli`     | Gemini CLI            | free-limited              |
| `antigravity`    | Google Antigravity    | free-limited              |
| `claude-pro`     | Claude Pro/Max        | subscription              |

### 1.2 Check Environment Variables

Scan environment and `.env` in the current project directory:

```
ANTHROPIC_API_KEY   → anthropic
OPENAI_API_KEY      → openai
GEMINI_API_KEY      → google
GROQ_API_KEY        → groq
MISTRAL_API_KEY     → mistral
OPENROUTER_API_KEY  → openrouter
XAI_API_KEY         → xai
CEREBRAS_API_KEY    → cerebras
HF_TOKEN            → huggingface
ZAI_API_KEY         → zai
KIMI_API_KEY        → kimi-coding
MINIMAX_API_KEY     → minimax
```

### 1.3 Probe Local Services

Run each with a 2-second timeout. Do not fail if unavailable.

```bash
curl -s --max-time 2 http://localhost:11434/api/tags    # Ollama → .models[].name
curl -s --max-time 2 http://localhost:1234/v1/models    # LM Studio → .data[].id
curl -s --max-time 2 http://localhost:8000/v1/models    # vLLM → .data[].id
curl -s --max-time 2 http://localhost:4000/v1/models    # LiteLLM → .data[].id
```

Local services default label: `local`.

### 1.4 Check Existing `~/.pi/agent/models.json`

If it already contains `strategic`, `tactical`, `operational`, `scout`, `fallback` stubs with `api: "router-group-*"`, ask:

> "Router groups already configured. Re-run setup to update labels? (y/N)"

If yes, pre-populate existing labels as defaults.

### 1.5 Build Discovery List

Combine all sources into a flat list. Deduplicate (auth.json + env both present → one entry). For OpenRouter, emit two rows: "openrouter (free models)" and "openrouter (paid models)". Same split for any provider known to mix free and paid tiers.

---

## Phase 2 — Present Findings & Ask for Labels

Display with default guesses pre-filled:

```
Discovered providers — confirm or change each label:
─────────────────────────────────────────────────────────────────────────
  #  Provider                    Source         Guess          Notes
─────────────────────────────────────────────────────────────────────────
  1  qwen-cli                    auth.json      free-limited   Qwen free tier
  2  openrouter (free models)    env            free-limited   llama-3.3-70b:free, qwen3-coder:free
  3  openrouter (paid models)    env            disallow       claude-3.5-sonnet, gpt-4o, ...
  4  chutes                      auth.json      subscription   Balanced cost/quality
  5  claude-max                  auth.json      subscription   Claude Pro/Max
  6  ollama (localhost:11434)    local service  local          llama3.1:8b
─────────────────────────────────────────────────────────────────────────
```

Label options:

```
  f = free-limited   cost=0        (rate-limited by provider; backoff+failover when hit)
  s = subscription   cost=base×0.3 (flat monthly; rateLimitCount rotates between providers)
  l = local          cost=base×0.5 (hardware/electricity; backoff+failover when down)
  p = pay-as-you-go  cost=base×1.0 (per-token billing)
  x = disallow       excluded      (never route to this provider)

Enter label for each (e.g. "f f x s s l"), or press Enter to accept guess:
```

---

## Phase 3 — Write to `~/.pi/agent/models.json`

**3.1** Add the five virtual tier-group stubs (if not already present):

```json
"strategic":   { "baseUrl": "https://router.local", "api": "router-group-strategic",   "apiKey": "router-virtual", "models": [{ "id": "strategic",   "name": "strategic → (router)",   "reasoning": true, "input": ["text","image"], "contextWindow": 200000, "maxTokens": 64000 }] },
"tactical":    { "baseUrl": "https://router.local", "api": "router-group-tactical",    "apiKey": "router-virtual", "models": [{ "id": "tactical",    "name": "tactical → (router)",    "reasoning": true, "input": ["text","image"], "contextWindow": 200000, "maxTokens": 64000 }] },
"operational": { "baseUrl": "https://router.local", "api": "router-group-operational", "apiKey": "router-virtual", "models": [{ "id": "operational", "name": "operational → (router)", "input": ["text","image"], "contextWindow": 200000, "maxTokens": 32000 }] },
"scout":       { "baseUrl": "https://router.local", "api": "router-group-scout",       "apiKey": "router-virtual", "models": [{ "id": "scout",       "name": "scout → (router)",       "input": ["text"],         "contextWindow": 131072,  "maxTokens": 16000 }] },
"fallback":    { "baseUrl": "https://router.local", "api": "router-group-fallback",    "apiKey": "router-virtual", "models": [{ "id": "fallback",   "name": "fallback → (router)",   "input": ["text"],         "contextWindow": 131072,  "maxTokens": 16000 }] }
```

**3.2** Record labels in `pi-director-setup`:

```json
"pi-director-setup": {
  "configuredAt": "<ISO timestamp>",
  "costModel": {
    "RATE_MUX": 0.5
  },
  "providerLabels": {
    "qwen-cli":              { "label": "free-limited" },
    "openrouter/free":       { "label": "free-limited" },
    "openrouter/paid":       { "label": "disallow" },
    "chutes":                { "label": "subscription" },
    "claude-max":            { "label": "subscription" },
    "ollama":                { "label": "local" }
  }
}
```

---

## Phase 4 — Write `~/.pi/agent/router.json`

```json
{
  "costModel": {
    "freeLimited":   "0",
    "subscription":  "baseCost * 0.3 * (1 + rateLimitCount * RATE_MUX)",
    "local":         "baseCost * 0.5",
    "payAsYouGo":    "baseCost * 1.0",
    "disallow":      "Infinity",
    "RATE_MUX":      0.5
  },
  "tiers": {
    "strategic":   { "gdpvalPercentile": 1.0 },
    "tactical":    { "gdpvalPercentile": 0.7 },
    "operational": { "gdpvalPercentile": 0.4 },
    "scout":       { "gdpvalPercentile": 0.2 },
    "fallback":    { "gdpvalPercentile": 0.0 }
  },
  "providerLabels": { }
}
```

All tiers use all non-disallowed providers. GDPval percentile sets the quality floor; effectiveCost picks the winner within that pool.

---

## Phase 5 — Confirm and Summarize

Show:

1. Label table with cost formula preview per provider
2. Which providers are in each tier's eligible pool (all non-disallowed)
3. Expected emergent selection at current GDPval rankings:

```
Expected selection (no rate limiting):
  strategic   → best GDPval model overall, min cost among ties
  tactical    → best free-limited in top-70% GDPval (cost=0 wins), else cheapest subscription
  operational → best free-limited in top-40% GDPval (cost=0 wins), else cheapest subscription

When free-limited providers are rate-limited:
  → exponential backoff, failover to next free-limited model
  → if all free-limited exhausted, cheapest subscription takes over

When a subscription provider is repeatedly rate-limited:
  → rateLimitCount rises → effectiveCost rises → alternate subscription provider takes over
```

4. Remind the user:
> "Re-run `/setup` to change labels or re-discover services."
> "baseCost/Mtok for each model is sourced from provider pricing or OpenRouter's model list — update models.json if pricing changes."
