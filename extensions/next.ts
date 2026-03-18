/**
 * Next — Automated work & design discovery
 *
 * Displays top recommendations from NEXT.md and triggers analysis updates.
 * Auto-runs analysis if no recommendations exist when /next is invoked.
 *
 * Part of the pi-director triad:
 *   /next          — automated discovery (what should we do?)
 *   /choose        — human-in-loop steering (what do we commit to?)
 *   /build         — automated build & verification (do it)
 *
 * Commands:
 *   /next          — view recommendations (auto-runs analysis if empty)
 *   /next update   — force re-run analysis
 *
 * Spawns a pi subprocess with --skill next and --model operational.
 * Requires model router extension for --model operational to resolve.
 * Scheduling is handled externally (pi-scheduler, pi-orchestrator cron, etc).
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { spawn } from "child_process";
import { readFileSync, existsSync, statSync } from "fs";

interface AnalysisState {
	status: "idle" | "running" | "done" | "error";
	lastRun: Date | null;
	lastDuration: number;
	topItems: string[];
}

function parseNextMd(cwd: string): { items: string[]; mtime: Date | null } {
	const path = `${cwd}/NEXT.md`;
	if (!existsSync(path)) return { items: [], mtime: null };
	try {
		const content = readFileSync(path, "utf-8");
		const mtime = statSync(path).mtime;
		const items: string[] = [];
		for (const match of content.matchAll(/^## Priority \d+: (.+)$/gm)) {
			items.push(match[1]);
			if (items.length >= 3) break;
		}
		return { items, mtime };
	} catch {
		return { items: [], mtime: null };
	}
}

export default function (pi: ExtensionAPI) {
	const state: AnalysisState = {
		status: "idle",
		lastRun: null,
		lastDuration: 0,
		topItems: [],
	};

	let widgetCtx: any;

	function runAnalysis(): Promise<{ output: string; exitCode: number }> {
		state.status = "running";
		state.lastRun = new Date();

		const startTime = Date.now();

		return new Promise((resolve) => {
			const proc = spawn("pi", [
				"--mode", "json",
				"-p",
				"--no-session",
				"--skill", "next",
				"--model", "operational",
				"--thinking", "off",
				"Run the next analysis skill. Analyze session history, code quality, CHOICES.md gaps, and logs. Write findings to NEXT.md.",
			], {
				stdio: ["ignore", "pipe", "pipe"],
				env: { ...process.env },
			});

			const chunks: string[] = [];

			proc.stdout!.setEncoding("utf-8");
			proc.stdout!.on("data", (chunk: string) => chunks.push(chunk));
			proc.stderr!.setEncoding("utf-8");
			proc.stderr!.on("data", () => {});

			proc.on("close", (code) => {
				state.lastDuration = Date.now() - startTime;
				state.status = code === 0 ? "done" : "error";
				if (widgetCtx) {
					state.topItems = parseNextMd(widgetCtx.cwd).items;
				}

				if (widgetCtx) {
					widgetCtx.ui.notify(
						`Analysis ${state.status} in ${Math.round(state.lastDuration / 1000)}s`,
						state.status === "done" ? "success" : "error"
					);
				}

				resolve({ output: chunks.join(""), exitCode: code ?? 1 });
			});

			proc.on("error", (err) => {
				state.status = "error";
				state.lastDuration = Date.now() - startTime;
				resolve({ output: err.message, exitCode: 1 });
			});
		});
	}

	// ── Commands ─────────────────────────────────

	pi.registerCommand("next", {
		description: "View recommendations (/next) or re-run analysis (/next update)",
		handler: async (args, ctx) => {
			widgetCtx = ctx;
			const sub = args?.trim().toLowerCase();

			if (sub === "update") {
				if (state.status === "running") {
					ctx.ui.notify("Analysis already running", "warning");
					return;
				}
				ctx.ui.notify("Starting analysis...", "info");
				await runAnalysis();
				return;
			}

			// Default: view current recommendations
			const { items, mtime } = parseNextMd(ctx.cwd);
			state.topItems = items;

			const lines = [
				`Status: ${state.status}`,
				state.lastRun
					? `Last run: ${state.lastRun.toLocaleString()} (${Math.round(state.lastDuration / 1000)}s)`
					: mtime
						? `NEXT.md last modified: ${mtime.toLocaleString()}`
						: "No analysis yet — run /next update",
			];
			if (state.topItems.length > 0) {
				lines.push("", "Top recommendations:");
				state.topItems.forEach((item, i) => lines.push(`  ${i + 1}. ${item}`));
				ctx.ui.notify(lines.join("\n"), "info");
			} else {
				ctx.ui.notify("No recommendations found. Running analysis...", "info");
				await runAnalysis();
				// Show results after auto-run
				const updated = parseNextMd(ctx.cwd);
				if (updated.items.length > 0) {
					const result = ["Top recommendations:"];
					updated.items.forEach((item, i) => result.push(`  ${i + 1}. ${item}`));
					ctx.ui.notify(result.join("\n"), "info");
				}
			}
		},
	});

	// ── Lifecycle ────────────────────────────────

	pi.on("session_start", async (_event, ctx) => {
		widgetCtx = ctx;
		const { items, mtime } = parseNextMd(ctx.cwd);
		state.topItems = items;
		if (mtime) state.lastRun = mtime;
	});
}
