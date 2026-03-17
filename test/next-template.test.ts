import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const TEMPLATE = join(__dirname, "..", "templates", "NEXT.md");

describe("NEXT.md template", () => {
	it("should exist", () => {
		expect(existsSync(TEMPLATE)).toBe(true);
	});

	it("should have title", () => {
		const content = readFileSync(TEMPLATE, "utf-8");
		expect(content).toContain("# NEXT.md");
	});

	it("should reference priority ladder", () => {
		const content = readFileSync(TEMPLATE, "utf-8");
		expect(content).toContain("UX Quality > Security > Scale > Efficiency");
	});

	it("should have priority items with required fields", () => {
		const content = readFileSync(TEMPLATE, "utf-8");
		expect(content).toContain("Category:");
		expect(content).toContain("Impact:");
		expect(content).toContain("Effort:");
		expect(content).toContain("Evidence:");
		expect(content).toContain("Action:");
	});

	it("should have Sources Analyzed section", () => {
		const content = readFileSync(TEMPLATE, "utf-8");
		expect(content).toContain("## Sources Analyzed");
	});

	it("should have Deferred and Dismissed sections", () => {
		const content = readFileSync(TEMPLATE, "utf-8");
		expect(content).toContain("## Deferred");
		expect(content).toContain("## Dismissed");
	});
});
