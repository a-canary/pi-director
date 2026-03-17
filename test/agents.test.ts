import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

const AGENTS_DIR = join(__dirname, "..", "agents");
const VALID_TIERS = ["strategic", "tactical", "operational", "scout"];

function parseAgent(filename: string) {
	const raw = readFileSync(join(AGENTS_DIR, filename), "utf-8");
	const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
	if (!match) return null;

	const frontmatter: Record<string, string> = {};
	for (const line of match[1].split("\n")) {
		const idx = line.indexOf(":");
		if (idx > 0) {
			frontmatter[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
		}
	}
	return { frontmatter, body: match[2].trim() };
}

describe("Agent definitions", () => {
	const files = readdirSync(AGENTS_DIR).filter(f => f.endsWith(".md") && f !== "README.md");

	it("should have at least 6 agent files", () => {
		expect(files.length).toBeGreaterThanOrEqual(6);
	});

	for (const file of files) {
		describe(file, () => {
			const agent = parseAgent(file);

			it("should parse frontmatter", () => {
				expect(agent).not.toBeNull();
			});

			it("should have a name", () => {
				expect(agent!.frontmatter.name).toBeTruthy();
			});

			it("should have a description", () => {
				expect(agent!.frontmatter.description).toBeTruthy();
			});

			it("should use a model tier group, not a hardcoded model", () => {
				const model = agent!.frontmatter.model;
				expect(VALID_TIERS).toContain(model);
			});

			it("should have tools defined", () => {
				expect(agent!.frontmatter.tools).toBeTruthy();
			});

			it("should have a body with instructions", () => {
				expect(agent!.body.length).toBeGreaterThan(50);
			});
		});
	}
});
