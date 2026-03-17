import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const ROOT = join(__dirname, "..");

describe("Package configuration", () => {
	const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf-8"));

	it("should be named @a-canary/pi-director", () => {
		expect(pkg.name).toBe("@a-canary/pi-director");
	});

	it("should have author a-canary", () => {
		expect(pkg.author?.name || pkg.author).toContain("a-canary");
	});

	it("should have pi-package keyword", () => {
		expect(pkg.keywords).toContain("pi-package");
	});

	it("should declare pi.skills pointing to real directory", () => {
		expect(pkg.pi?.skills).toBeTruthy();
		for (const dir of pkg.pi.skills) {
			expect(existsSync(join(ROOT, dir))).toBe(true);
		}
	});

	it("should declare pi.agents pointing to real directory", () => {
		expect(pkg.pi?.agents).toBeTruthy();
		for (const dir of pkg.pi.agents) {
			expect(existsSync(join(ROOT, dir))).toBe(true);
		}
	});

	it("should declare pi.extensions pointing to real directory", () => {
		expect(pkg.pi?.extensions).toBeTruthy();
		for (const dir of pkg.pi.extensions) {
			expect(existsSync(join(ROOT, dir))).toBe(true);
		}
	});

	it("should have pi-choose-wisely as peer dependency", () => {
		expect(pkg.peerDependencies["@a-canary/pi-choose-wisely"]).toBeTruthy();
	});

	it("should have pi-upskill as peer dependency", () => {
		expect(pkg.peerDependencies["@a-canary/pi-upskill"]).toBeTruthy();
	});

	describe("Required files", () => {
		const required = ["CHOICES.md", "PLAN.md", "README.md"];
		for (const file of required) {
			it(`should have ${file}`, () => {
				expect(existsSync(join(ROOT, file))).toBe(true);
			});
		}
	});
});
