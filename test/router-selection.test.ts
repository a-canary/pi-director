/**
 * Sanity checks for model-router tier selection algorithm.
 *
 * Tier selection:
 *   strategic:   gdpvalPercentile(1.0) → min effectiveCost among top models
 *   tactical:    gdpvalPercentile(0.7) → min effectiveCost
 *   operational: gdpvalPercentile(0.4) → min effectiveCost
 *
 * effectiveCost by label:
 *   free-limited:  0  (always — rate limiting handled by backoff+failover, never inflates cost)
 *   subscription:  baseCost * 0.3 * (1 + rateLimitDays * RATE_MUX)
 *   local:         baseCost * 0.5
 *   pay-as-you-go: baseCost * 1.0
 *   disallow:      Infinity
 *
 * rateLimitDays: persistent day counter. Increments each day a provider stays in 429-backoff.
 * Remains elevated after recovery — provider re-enters pool but at higher cost until it decays.
 * Over weeks, this reaches equilibrium: usage balances naturally across providers.
 */

import { describe, it, expect } from "vitest";

const RATE_MUX = 1.0; // each day rate-limited multiplies subscription cost by (1 + days)

type Label = "free-limited" | "subscription" | "local" | "pay-as-you-go" | "disallow";

interface Model {
	id: string;
	gdpval: number;        // quality score, higher = better
	baseCost: number;      // published $/Mtok from provider (0 for free-limited)
	label: Label;
	rateLimitDays: number; // days continuously in 429-backoff (subscription only; 0 = healthy)
	available: boolean;    // false = currently in exponential backoff, excluded from pool
}

function effectiveCost(m: Model): number {
	if (!m.available)             return Infinity; // in backoff — not selectable
	if (m.label === "disallow")   return Infinity;
	if (m.label === "free-limited") return 0;
	if (m.label === "subscription") return m.baseCost * 0.3 * (1 + m.rateLimitDays * RATE_MUX);
	if (m.label === "local")        return m.baseCost * 0.5;
	return m.baseCost; // pay-as-you-go
}

function selectTier(models: Model[], percentile: number): Model | null {
	const eligible = models.filter(m => effectiveCost(m) < Infinity);
	if (eligible.length === 0) return null;

	const sorted = [...eligible].sort((a, b) => b.gdpval - a.gdpval);
	const cutoff = Math.ceil(sorted.length * percentile);
	const pool = sorted.slice(0, Math.max(1, cutoff));

	if (percentile >= 1.0) return pool[0]; // strategic: best quality first, cost as tiebreak
	return pool.reduce((best, m) => effectiveCost(m) < effectiveCost(best) ? m : best);
}

// --- Fixtures ---
// Modeled on: qwen-cli(free-limited), openrouter-free(free-limited),
//             chutes(subscription), claudeMax(subscription), openrouter-paid(disallow)

const MODELS: Model[] = [
	{ id: "claude-opus",     gdpval: 0.98, baseCost: 15.0, label: "subscription",  rateLimitDays: 0, available: true },
	{ id: "claude-sonnet",   gdpval: 0.88, baseCost: 3.0,  label: "subscription",  rateLimitDays: 0, available: true },
	{ id: "chutes-balanced", gdpval: 0.78, baseCost: 2.0,  label: "subscription",  rateLimitDays: 0, available: true },
	{ id: "qwen-free",       gdpval: 0.72, baseCost: 0,    label: "free-limited",  rateLimitDays: 0, available: true },
	{ id: "gemini-free",     gdpval: 0.68, baseCost: 0,    label: "free-limited",  rateLimitDays: 0, available: true },
	{ id: "openrouter-free", gdpval: 0.60, baseCost: 0,    label: "free-limited",  rateLimitDays: 0, available: true },
	{ id: "openrouter-paid", gdpval: 0.85, baseCost: 3.0,  label: "disallow",      rateLimitDays: 0, available: true },
	{ id: "llama-local",     gdpval: 0.55, baseCost: 0,    label: "local",         rateLimitDays: 0, available: true },
];

describe("Router tier selection — sanity checks", () => {

	it("1. strategic picks the highest GDPval available model, not the cheapest", () => {
		const result = selectTier(MODELS, 1.0);
		expect(result?.id).toBe("claude-opus"); // gdpval=0.98, regardless of cost
	});

	it("2. tactical picks the free-limited model if one exists in top-70% quality pool", () => {
		// top 70% of 7 eligible (openrouter-paid disallowed) = ceil(4.9) = 5
		// sorted by gdpval: opus, sonnet, chutes-balanced, qwen-free, gemini-free
		// qwen-free and gemini-free are free-limited (cost=0) → one of them wins
		const tactical = selectTier(MODELS, 0.7)!;
		expect(tactical.label).toBe("free-limited");
		expect(effectiveCost(tactical)).toBe(0);
	});

	it("3. operational picks the free-limited model if one exists in top-40% quality pool", () => {
		// top 40% of 7 eligible = ceil(2.8) = 3: opus, sonnet, chutes-balanced
		// no free-limited in this pool → cheapest subscription wins
		const operational = selectTier(MODELS, 0.4)!;
		// chutes-balanced: 2.0 * 0.3 = $0.6/Mtok — cheapest subscription in pool
		expect(operational.id).toBe("chutes-balanced");
	});

	it("4. disallowed models never appear in any tier", () => {
		for (const percentile of [1.0, 0.7, 0.4]) {
			expect(selectTier(MODELS, percentile)?.id).not.toBe("openrouter-paid");
		}
	});

	it("5. subscription rateLimitDays inflates cost day by day (Tuesday→Friday example)", () => {
		// claudeMax $15/Mtok subscription, rateLimitDays accumulates Tue(1)→Fri(5)
		const baseline: Model = { id: "claudeMax", gdpval: 0.98, baseCost: 15, label: "subscription", rateLimitDays: 0, available: true };
		const tuesday:  Model = { ...baseline, rateLimitDays: 1 };
		const friday:   Model = { ...baseline, rateLimitDays: 5 };

		// Day 0: 15 * 0.3 * (1 + 0) = $4.5/Mtok
		// Day 1: 15 * 0.3 * (1 + 1) = $9/Mtok
		// Day 5: 15 * 0.3 * (1 + 5) = $27/Mtok
		expect(effectiveCost(baseline)).toBeLessThan(effectiveCost(tuesday));
		expect(effectiveCost(tuesday)).toBeLessThan(effectiveCost(friday));
		expect(effectiveCost(friday)).toBeGreaterThan(effectiveCost(baseline) * 2);
	});

	it("6. rate-limited subscription rotates to alternate subscription provider", () => {
		const chutesLimited:  Model = { id: "chutes",    gdpval: 0.78, baseCost: 2.0,  label: "subscription", rateLimitDays: 3, available: true };
		const claudeHealthy:  Model = { id: "claudeMax", gdpval: 0.88, baseCost: 3.0,  label: "subscription", rateLimitDays: 0, available: true };

		// chutes:   2.0 * 0.3 * (1 + 3) = $2.4/Mtok
		// claudeMax: 3.0 * 0.3 * (1 + 0) = $0.9/Mtok  ← selected despite higher baseCost
		expect(effectiveCost(claudeHealthy)).toBeLessThan(effectiveCost(chutesLimited));
	});

	it("7. free-limited cost is always 0 regardless of rateLimitDays (backoff handles it, not cost)", () => {
		// rateLimitDays on free-limited is informational only — cost never inflates
		const freeHealthy: Model  = { id: "qwen", gdpval: 0.7, baseCost: 0, label: "free-limited", rateLimitDays: 0,  available: true };
		const freeLongLimited: Model = { id: "qwen", gdpval: 0.7, baseCost: 0, label: "free-limited", rateLimitDays: 30, available: true };
		expect(effectiveCost(freeHealthy)).toBe(0);
		expect(effectiveCost(freeLongLimited)).toBe(0);
	});

	it("8. model in 429-backoff (available=false) is excluded from selection", () => {
		const modelsWithBackoff = MODELS.map(m =>
			m.id === "claude-opus" ? { ...m, available: false } : m
		);
		const strategic = selectTier(modelsWithBackoff, 1.0)!;
		// opus is in backoff → next best available takes strategic slot
		expect(strategic.id).not.toBe("claude-opus");
		expect(strategic.gdpval).toBeLessThan(0.98);
	});

	it("9. after recovery, provider re-enters pool but elevated rateLimitDays keeps it less competitive", () => {
		const chutesRecovered: Model = { id: "chutes",    gdpval: 0.78, baseCost: 2.0, label: "subscription", rateLimitDays: 5, available: true };
		const claudeHealthy:   Model = { id: "claudeMax", gdpval: 0.88, baseCost: 3.0, label: "subscription", rateLimitDays: 0, available: true };

		// chutes back online but still expensive from accumulated days
		// chutes:    2.0 * 0.3 * (1+5) = $3.6/Mtok
		// claudeMax: 3.0 * 0.3 * (1+0) = $0.9/Mtok ← still wins
		expect(effectiveCost(claudeHealthy)).toBeLessThan(effectiveCost(chutesRecovered));
	});

	it("10. equilibrium: two subscription providers with equal accumulated rate-limit days have equal cost pressure", () => {
		const chutes:    Model = { id: "chutes",    gdpval: 0.78, baseCost: 2.0, label: "subscription", rateLimitDays: 4, available: true };
		const claudeMax: Model = { id: "claudeMax", gdpval: 0.88, baseCost: 2.0, label: "subscription", rateLimitDays: 4, available: true };

		// Same baseCost, same rateLimitDays → same effectiveCost → selection falls to gdpval
		expect(effectiveCost(chutes)).toBe(effectiveCost(claudeMax));
		// Router would tiebreak on gdpval: claudeMax (0.88) > chutes (0.78)
		const pool = [chutes, claudeMax];
		const winner = pool.reduce((best, m) =>
			effectiveCost(m) < effectiveCost(best) ? m :
			effectiveCost(m) === effectiveCost(best) && m.gdpval > best.gdpval ? m : best
		);
		expect(winner.id).toBe("claudeMax");
	});

});
