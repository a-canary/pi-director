/**
 * Nightly Analysis — Scheduled /next execution
 *
 * Runs the /next analysis skill on a configurable schedule.
 * Spawns a pi subprocess with the next skill and writes NEXT.md.
 *
 * Commands:
 *   /nightly-status  — show schedule, last run, top recommendations
 *   /nightly-run     — trigger analysis immediately
 *   /nightly-set H   — set hour (0-23) for nightly run (default: 2)
 *
 * Usage: installed automatically via @a-canary/pi-director package
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import { Text, truncateToWidth, visibleWidth } from "@mariozechner/pi-tui";
import { spawn } from "child_process";
import { readFileSync, existsSync } from "fs";

interface AnalysisState {
	status: "idle" | "running" | "done" | "error";
	lastRun: Date | null;
	lastDuration: number;
	nextRun: Date | null;
	topItems: string[];
	timer: ReturnType<typeof setInterval> | null;
	scheduleTimer: ReturnType<typeof setTimeout> | null;
	hour: number;
}

function parseNextMd(cwd: string): string[] {
	const path = `${cwd}/NEXT.md`;
	if (!existsSync(path)) return [];
	try {
		const content = readFileSync(path, "utf-8");
		const items: string[] = [];
		for (const match of content.matchAll(/^## Priority \d+: (.+)$/gm)) {
			items.push(match[1]);
			if (items.length >= 3) break;
		}
		return items;
	} catch {
		return [];
	}
}

function msUntilHour(hour: number): number {
	const now = new Date();
	const target = new Date(now);
	target.setHours(hour, 0, 0, 0);
	if (target <= now) target.setDate(target.getDate() + 1);
	return target.getTime() - now.getTime();
}

export default function (pi: ExtensionAPI) {
	const state: AnalysisState = {
		status: "idle",
		lastRun: null,
		lastDuration: 0,
		nextRun: null,
		topItems: [],
		timer: null,
		scheduleTimer: null,
		hour: 2,
	};

	let widgetCtx: any;

	function scheduleNext() {
		if (state.scheduleTimer) clearTimeout(state.scheduleTimer);
		const ms = msUntilHour(state.hour);
		state.nextRun = new Date(Date.now() + ms);
		state.scheduleTimer = setTimeout(() => {
			runAnalysis();
			scheduleNext();
		}, ms);
	}

	function runAnalysis(): Promise<{ output: string; exitCode: number }> {
		state.status = "running";
		state.lastRun = new Date();
		updateWidget();

		const startTime = Date.now();

		return new Promise((resolve) => {
			const proc = spawn("pi", [
				"--mode", "json",
				"-p",
				"--no-session",
				"--no-extensions",
				"--model", "operational",
				"--thinking", "off",
				"Run the /next analysis skill. Analyze session history, code quality, CHOICES.md gaps, and logs. Write findings to NEXT.md.",
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
					state.topItems = parseNextMd(widgetCtx.cwd);
				}
				updateWidget();

				if (widgetCtx) {
					widgetCtx.ui.notify(
						`Nightly analysis ${state.status} in ${Math.round(state.lastDuration / 1000)}s`,
						state.status === "done" ? "success" : "error"
					);
				}

				resolve({ output: chunks.join(""), exitCode: code ?? 1 });
			});

			proc.on("error", (err) => {
				state.status = "error";
				state.lastDuration = Date.now() - startTime;
				updateWidget();
				resolve({ output: err.message, exitCode: 1 });
			});
		});
	}

	function updateWidget() {
		if (!widgetCtx) return;
		widgetCtx.ui.setWidget("nightly-analysis", (_tui: any, theme: any) => ({
			render(width: number): string[] {
				const icon = state.status === "idle" ? "○"
					: state.status === "running" ? "◉"
					: state.status === "done" ? "✓" : "✗";
				const color = state.status === "idle" ? "dim"
					: state.status === "running" ? "accent"
					: state.status === "done" ? "success" : "error";

				const lines: string[] = [];
				const header = theme.fg(color, `${icon} Nightly Analysis`) +
					theme.fg("dim", ` — ${state.status}`);
				lines.push(header);

				if (state.lastRun) {
					lines.push(theme.fg("muted",
						`  Last: ${state.lastRun.toLocaleString()} (${Math.round(state.lastDuration / 1000)}s)`));
				}
				if (state.nextRun) {
					lines.push(theme.fg("muted",
						`  Next: ${state.nextRun.toLocaleString()}`));
				}
				if (state.topItems.length > 0) {
					lines.push(theme.fg("dim", "  Top recommendations:"));
					state.topItems.forEach((item, i) => {
						lines.push(theme.fg("muted", `    ${i + 1}. ${truncateToWidth(item, width - 8)}`));
					});
				}
				return lines;
			},
			invalidate() {},
		}));
	}

	// ── Commands ─────────────────────────────────

	pi.registerCommand("nightly-status", {
		description: "Show nightly analysis schedule and last run",
		handler: async (_args, ctx) => {
			widgetCtx = ctx;
			const lines = [
				`Status: ${state.status}`,
				`Schedule: daily at ${state.hour}:00`,
				state.lastRun ? `Last run: ${state.lastRun.toLocaleString()} (${Math.round(state.lastDuration / 1000)}s)` : "Last run: never",
				state.nextRun ? `Next run: ${state.nextRun.toLocaleString()}` : "Next run: not scheduled",
			];
			if (state.topItems.length > 0) {
				lines.push("", "Top recommendations:");
				state.topItems.forEach((item, i) => lines.push(`  ${i + 1}. ${item}`));
			}
			ctx.ui.notify(lines.join("\n"), "info");
		},
	});

	pi.registerCommand("nightly-run", {
		description: "Trigger nightly analysis immediately",
		handler: async (_args, ctx) => {
			widgetCtx = ctx;
			if (state.status === "running") {
				ctx.ui.notify("Analysis already running", "warning");
				return;
			}
			ctx.ui.notify("Starting analysis...", "info");
			await runAnalysis();
		},
	});

	pi.registerCommand("nightly-set", {
		description: "Set nightly analysis hour: /nightly-set <0-23>",
		handler: async (args, ctx) => {
			widgetCtx = ctx;
			const h = parseInt(args?.trim() || "", 10);
			if (h >= 0 && h <= 23) {
				state.hour = h;
				scheduleNext();
				ctx.ui.notify(`Nightly analysis scheduled for ${h}:00 daily`, "info");
				updateWidget();
			} else {
				ctx.ui.notify("Usage: /nightly-set <0-23>", "error");
			}
		},
	});

	// ── Lifecycle ────────────────────────────────

	pi.on("session_start", async (_event, ctx) => {
		widgetCtx = ctx;
		state.topItems = parseNextMd(ctx.cwd);
		scheduleNext();
		updateWidget();
		ctx.ui.setStatus("nightly", `Nightly: ${state.hour}:00`);
	});
}
