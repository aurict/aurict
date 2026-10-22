import { afterAll, describe, expect, test } from "bun:test";
import React from "react";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { render } from "ink-testing-library";
import { siCount, tildePath } from "../src/commands/command-helpers.js";
import { statusCard } from "../src/commands/session-commands.js";
import { getCommand } from "../src/commands/registry.js";
import type { CommandContext } from "../src/commands/types.js";
import { formatAllBindings } from "../src/keybindings/format.js";
import { shimmerRuns } from "../src/tui/RunStatusLine.js";
import { SessionFooter } from "../src/tui/SessionChrome.js";
import { Picker } from "../src/tui/Picker.js";
import { ProjectAutoPrompt } from "../src/tui/ProjectAutoPrompt.js";
import { trustTarget } from "../src/tui/project-trust.js";
import { TerminalSizeContext } from "../src/tui/TerminalSizeContext.js";

const temp = mkdtempSync(join(tmpdir(), "aurict-extras-"));
afterAll(() => rmSync(temp, { recursive: true, force: true }));
const tick = () => new Promise((resolve) => setTimeout(resolve, 30));

describe("codex formatting helpers", () => {
  test("counts use three significant digits", () => {
    expect([900, 1000, 1900, 2250, 272_000, 1_234_567].map(siCount)).toEqual(["900", "1K", "1.9K", "2.25K", "272K", "1.23M"]);
  });

  test("home paths print with a tilde", () => {
    const home = process.env["HOME"]!;
    expect(tildePath(`${home}/proj`)).toBe("~/proj");
    expect(tildePath(home)).toBe("~");
    expect(tildePath(`${home}x/proj`)).toBe(`${home}x/proj`);
  });
});

describe("/status card", () => {
  test("prints the Codex rows", () => {
    const card = statusCard({
      provider: "anthropic", model: "claude-sonnet-5-5", workdir: temp, approvalMode: "auto", contextWindow: 200_000,
      tokens: { input: 1000, output: 900 }, contextUsage: { effectiveTokens: 2250, contextWindow: 200_000 },
    } as unknown as CommandContext).split("\n");
    expect(card[0]).toMatch(/^aurict█ v/);
    expect(card).toContain("Model:           claude-sonnet-5-5 (anthropic)");
    expect(card).toContain("Permissions:     Ask for approval");
    expect(card).toContain("Agents.md:       <none>");
    expect(card).toContain("Token usage:     1.9K total  (1K input + 900 output)");
    expect(card).toContain("Context window:  99% left (2.25K used / 200K)");
  });
});

describe("folder trust", () => {
  test("trust applies to the enclosing git root", () => {
    const repo = join(temp, "repo");
    mkdirSync(join(repo, ".git"), { recursive: true });
    mkdirSync(join(repo, "pkg", "src"), { recursive: true });
    expect(trustTarget(join(repo, "pkg", "src"))).toBe(repo);
  });

  test("the prompt trusts on enter and quits on esc", async () => {
    const decisions: boolean[] = [];
    let view = render(<ProjectAutoPrompt workdir={temp} onDecide={(trusted) => decisions.push(trusted)} />);
    await tick();
    expect(view.lastFrame()).toContain("Folder access");
    expect(view.lastFrame()).toContain("› 1. Trust and continue");
    view.stdin.write("\r"); await tick();
    view.unmount();
    view = render(<ProjectAutoPrompt workdir={temp} onDecide={(trusted) => decisions.push(trusted)} />);
    await tick();
    view.stdin.write("\x1b"); await tick(); await tick();
    view.unmount();
    expect(decisions).toEqual([true, false]);
  });
});

describe("status shimmer", () => {
  test("a bright band sweeps across the title", () => {
    const runs = shimmerRuns("Getting schwifty", 500);
    expect(runs.map((run) => run.text).join("")).toBe("Getting schwifty");
    expect(runs.some((run) => run.level === "bold")).toBe(true);
    expect(shimmerRuns("Getting schwifty", 0).every((run) => run.level === "dim")).toBe(true);
  });
});

describe("footer agent hints", () => {
  test("offers agent navigation when subagents exist", () => {
    const frame = render(<SessionFooter cols={100} agents />).lastFrame()!;
    expect(frame).toMatch(/(alt \+ ←|⌥←) for agents · \? for shortcuts/);
  });

  test("names the agent being viewed", () => {
    const frame = render(<SessionFooter cols={100} agents activeAgent="Robie [explorer]" />).lastFrame()!;
    expect(frame).toMatch(/Robie \[explorer\] · (alt \+ ←|⌥←) for agents/);
  });
});

describe("/subagents", () => {
  test("lists child sessions and opens the chosen one", () => {
    const viewed: string[] = [];
    const ctx = {
      listSubagents: () => [{ id: "s-1", title: "Audit footer", status: "done" }, { id: "s-2", title: null, status: "running" }],
      viewSubagent: (id: string) => viewed.push(id),
    } as unknown as CommandContext;
    const result = getCommand("subagents")!.handler([], ctx);
    if (result instanceof Promise || result.type !== "picker") throw new Error("expected picker");
    expect(result.title).toBe("Subagents");
    expect(result.items.map((item) => item.label)).toEqual(["• Audit footer", "◦ Agent"]);
    result.onSelect(result.items[1]!);
    expect(viewed).toEqual(["s-2"]);
    const empty = getCommand("subagents")!.handler([], { listSubagents: () => [] } as unknown as CommandContext);
    expect(empty).toMatchObject({ type: "text" });
  });
});

describe("/keys", () => {
  test("lists the keys Aurict really binds and the customizable diff keys", () => {
    const text = formatAllBindings({ "diff.next-hunk": "j" });
    expect(text).toContain("Steer (while working)");
    expect(text).toContain("Open transcript");
    expect(text).toContain("★ J");
    expect(text).not.toContain("edit.clear");
  });
});

describe("picker header", () => {
  test("renders the body directly under the title", () => {
    const frame = render(
      <TerminalSizeContext.Provider value={{ columns: 80, rows: 30 }}>
        <Picker title="Enable full access?" header={[[{ text: "Body text. " }, { text: "Caution.", tone: "error" }]]} items={[{ id: "y", label: "Yes" }]} onSelect={() => {}} onCancel={() => {}} />
      </TerminalSizeContext.Provider>,
    ).lastFrame()!.split("\n");
    const title = frame.findIndex((line) => line.includes("Enable full access?"));
    expect(frame[title + 1]).toContain("Body text. Caution.");
  });
});

describe("styled word wrap", () => {
  test("wrapped lines never start with the break space and keep span props", async () => {
    const { wrapSpans } = await import("../src/tui/terminal-text/wrap-spans.js");
    const lines = wrapSpans([{ text: "one two three " }, { text: "four five", tone: "error" }], 9);
    expect(lines.map((line) => line.map((span) => span.text).join(""))).toEqual(["one two", "three", "four five"]);
    expect(lines[2]).toEqual([{ text: "four five", tone: "error" }]);
    expect(wrapSpans([{ text: "a".repeat(12) }], 5).map((line) => line[0]!.text)).toEqual(["aaaaa", "aaaaa", "aa"]);
  });
});
