import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const SKILL_PATH = join(__dirname, "..", "skills", "setup", "SKILL.md");
const content = existsSync(SKILL_PATH) ? readFileSync(SKILL_PATH, "utf-8") : "";

describe("Setup skill", () => {
	it("should have SKILL.md", () => {
		expect(existsSync(SKILL_PATH)).toBe(true);
	});

	it("should have non-trivial content", () => {
		expect(content.length).toBeGreaterThan(200);
	});

	it("should define the cost model formula", () => {
		expect(content).toMatch(/effectiveCost/i);
		expect(content).toMatch(/baseCost/i);
		expect(content).toMatch(/RATE_MUX/i);
	});

	it("should define cost multipliers for all labels", () => {
		expect(content).toMatch(/free-limited/i);
		expect(content).toMatch(/0\.3/); // subscription multiplier
		expect(content).toMatch(/0\.5/); // local multiplier
		expect(content).toMatch(/1\.0/); // pay-as-you-go multiplier
	});

	it("should order free-limited < subscription < local < pay-as-you-go", () => {
		expect(content).toMatch(/free-limited.*subscription.*local.*pay-as-you-go/i);
	});

	it("should explain rateLimitDays inflates subscription cost to rotate providers", () => {
		expect(content).toMatch(/rateLimitDays|rateLimitCount/i);
		expect(content).toMatch(/RATE_MUX/i);
	});

	it("should clarify free-limited uses backoff+failover, not cost inflation", () => {
		expect(content).toMatch(/backoff/i);
		expect(content).toMatch(/failover/i);
	});

	it("should explain per-model labeling for mixed providers like OpenRouter", () => {
		expect(content).toMatch(/openrouter/i);
		expect(content).toMatch(/free models/i);
		expect(content).toMatch(/paid models/i);
	});

	it("should cover Phase 1 — discovery", () => {
		expect(content).toMatch(/Phase 1/i);
		expect(content).toMatch(/auth\.json/i);
	});

	it("should probe all four local service types", () => {
		expect(content).toMatch(/ollama/i);
		expect(content).toMatch(/lm.?studio/i);
		expect(content).toMatch(/vllm/i);
		expect(content).toMatch(/litellm/i);
	});

	it("should cover Phase 2 — labeling with defaults pre-filled", () => {
		expect(content).toMatch(/Phase 2/i);
		expect(content).toMatch(/disallow/i);
	});

	it("should cover Phase 3 — models.json tier stubs", () => {
		expect(content).toMatch(/Phase 3/i);
		expect(content).toMatch(/models\.json/i);
		expect(content).toMatch(/router-group-strategic/i);
		expect(content).toMatch(/router-group-scout/i);
	});

	it("should cover Phase 4 — router.json with cost model", () => {
		expect(content).toMatch(/Phase 4/i);
		expect(content).toMatch(/router\.json/i);
	});

	it("should cover Phase 5 — confirmation and summary", () => {
		expect(content).toMatch(/Phase 5/i);
	});

	it("should NOT describe hard tier-to-label filters (costMux does the work)", () => {
		// The old wrong approach was "strategic never uses free-limited"
		// The correct approach is costMux=0 makes free always win on cost
		expect(content).not.toMatch(/strategic.*never.*free|never.*free.*strategic/i);
		expect(content).not.toMatch(/scout.*never.*subscription|never.*subscription.*scout/i);
	});
});
