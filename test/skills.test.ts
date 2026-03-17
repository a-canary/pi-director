import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const SKILLS_DIR = join(__dirname, "..", "skills");
const REQUIRED_SKILLS = ["next", "build", "choose"];

describe("Skill definitions", () => {
	for (const skill of REQUIRED_SKILLS) {
		describe(`/${skill}`, () => {
			const skillPath = join(SKILLS_DIR, skill, "SKILL.md");

			it("should have SKILL.md", () => {
				expect(existsSync(skillPath)).toBe(true);
			});

			it("should have When to Use section", () => {
				const content = readFileSync(skillPath, "utf-8");
				expect(content).toContain("## When to Use");
			});

			it("should have Process section", () => {
				const content = readFileSync(skillPath, "utf-8");
				expect(content).toContain("## Process");
			});
		});
	}

	describe("/next lib modules", () => {
		const modules = ["session-scanner", "code-scanner", "choice-scanner", "log-scanner", "ranker"];
		for (const mod of modules) {
			it(`should have ${mod}.md`, () => {
				expect(existsSync(join(SKILLS_DIR, "next", "lib", `${mod}.md`))).toBe(true);
			});
		}
	});

	describe("/build lib modules", () => {
		const modules = ["phase-loop", "hard-stops", "regression-check"];
		for (const mod of modules) {
			it(`should have ${mod}.md`, () => {
				expect(existsSync(join(SKILLS_DIR, "build", "lib", `${mod}.md`))).toBe(true);
			});
		}
	});

	describe("/choose lib modules", () => {
		it("should have pipeline.md", () => {
			expect(existsSync(join(SKILLS_DIR, "choose", "lib", "pipeline.md"))).toBe(true);
		});
	});
});
