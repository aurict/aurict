/**
 * TUI Component Tests — ink-testing-library
 *
 * Components under test:
 *  - Spinner     (frame + verb rendering)
 *  - Markdown    (h1/h2/h3, bold/italic, code, list, table, hr, quote)
 *  - StatusBar   (provider/model/workdir info)
 *  - StartupBanner (version/provider/model display)
 */

import { describe, it, expect, afterEach } from "bun:test";
import React from "react";
import { render, cleanup } from "ink-testing-library";
import { Spinner } from "../src/tui/Spinner.js";
import { Markdown } from "../src/tui/Markdown.js";
import { StatusBar } from "../src/tui/StatusBar.js";
import { CockpitHeader } from "../src/tui/CockpitHeader.js";
import { StartupBanner } from "../src/tui/StartupBanner.js";
import { PermissionPrompt } from "../src/tui/PermissionPrompt.js";
import { wrapPermissionText } from "../src/tui/PermissionCommandPreview.js";
import { Message } from "../src/tui/Message.js";
import { ExpandableOutput } from "../src/tui/ExpandableOutput.js";
import { TaskFloatingPanel } from "../src/tui/TaskFloatingPanel.js";
import { CommandPalette } from "../src/tui/CommandPalette.js";
import {
  CommandSuggest,
  getCommandMatches,
} from "../src/tui/CommandSuggest.js";
import { DesignWizard } from "../src/tui/DesignWizard.js";
import { inputWasTruncated, limitInputInsertion, MAX_DRAFT_CHARS, MAX_DRAFT_LINES, sanitizeInput, sanitizePaste } from "../src/tui/input-limits.js";
import { TerminalSizeContext } from "../src/tui/TerminalSizeContext.js";
import {
  mergeModelLists,
  parseSlashCommand,
} from "../src/commands/registry.js";
import type { CommandDef } from "../src/commands/types.js";

afterEach(() => {
  cleanup();
});

// Two-tone coloring (e.g. "Th" + dim "inking…") inserts an ANSI color code in
// the middle of a word; the content is correct but a naive toContain fails.
// Before asserting, we strip ANSI escape sequences and check the plain text.
// eslint-disable-next-line no-control-regex
const stripAnsi = (s: string | undefined): string =>
  (s ?? "").replace(/\x1b\[[0-9;]*m/g, "");

// ── Spinner ───────────────────────────────────────────────────────────────────

describe("Spinner", () => {
  it("renders Thinking verb when no tool", () => {
    const { lastFrame } = render(<Spinner />);
    const frame = lastFrame() ?? "";
    expect(stripAnsi(frame)).toContain("Thinking");
  });

  it("renders Running for bash tool", () => {
    const { lastFrame } = render(<Spinner activeTool="bash" />);
    const frame = lastFrame() ?? "";
    expect(stripAnsi(frame)).toContain("Running");
  });

  it("renders Reading for read tool", () => {
    const { lastFrame } = render(<Spinner activeTool="read" />);
    expect(stripAnsi(lastFrame())).toContain("Reading");
  });

  it("renders Searching for glob tool", () => {
    const { lastFrame } = render(<Spinner activeTool="glob" />);
    expect(stripAnsi(lastFrame())).toContain("Searching");
  });

  it("renders Fetching for webfetch tool", () => {
    const { lastFrame } = render(<Spinner activeTool="webfetch" />);
    expect(stripAnsi(lastFrame())).toContain("Fetching");
  });

  it("renders Working for unknown tool", () => {
    const { lastFrame } = render(<Spinner activeTool="unknown_tool_xyz" />);
    expect(stripAnsi(lastFrame())).toContain("Working");
  });

  it("renders a spinner character", () => {
    const { lastFrame } = render(<Spinner />);
    // One of the 10 braille spinner frames must be present
    const FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
    const frame = lastFrame() ?? "";
    const hasFrame = FRAMES.some((f) => frame.includes(f));
    expect(hasFrame).toBe(true);
  });
});

// ── Markdown ──────────────────────────────────────────────────────────────────

describe("Markdown", () => {
  it("renders plain text", () => {
    const { lastFrame } = render(<Markdown content="Hello world" />);
    expect(lastFrame()).toContain("Hello world");
  });

  it("renders h1 with underline dash row", () => {
    const { lastFrame } = render(<Markdown content="# Başlık" />);
    const frame = lastFrame() ?? "";
    expect(frame).toContain("Başlık");
    expect(frame).toContain("─");
  });

  it("renders h2 with ◆ symbol instead of ##", () => {
    const { lastFrame } = render(<Markdown content="## İkinci Başlık" />);
    const frame = lastFrame() ?? "";
    expect(frame).toContain("◆");
    expect(frame).toContain("İkinci Başlık");
    expect(frame).not.toContain("## ");
  });

  it("renders h3 with ▸ symbol instead of ###", () => {
    const { lastFrame } = render(<Markdown content="### Üçüncü" />);
    const frame = lastFrame() ?? "";
    expect(frame).toContain("▸");
    expect(frame).toContain("Üçüncü");
    expect(frame).not.toContain("### ");
  });

  it("does not show raw ** for bold text", () => {
    const { lastFrame } = render(<Markdown content="**bold text**" />);
    const frame = lastFrame() ?? "";
    expect(frame).toContain("bold text");
    expect(frame).not.toContain("**bold text**");
  });

  it("does not show raw * for italic text", () => {
    const { lastFrame } = render(<Markdown content="*italic text*" />);
    const frame = lastFrame() ?? "";
    expect(frame).toContain("italic text");
    expect(frame).not.toContain("*italic text*");
  });

  it("renders horizontal rule as dashes", () => {
    const { lastFrame } = render(<Markdown content={"before\n---\nafter"} />);
    const frame = lastFrame() ?? "";
    expect(frame).toContain("─");
  });

  it("renders unordered list with bullet", () => {
    const { lastFrame } = render(
      <Markdown content={"- item one\n- item two"} />,
    );
    const frame = lastFrame() ?? "";
    expect(frame).toContain("item one");
    expect(frame).toContain("item two");
    expect(frame).toContain("•");
  });

  it("renders ordered list with numbers", () => {
    const { lastFrame } = render(<Markdown content={"1. first\n2. second"} />);
    const frame = lastFrame() ?? "";
    expect(frame).toContain("first");
    expect(frame).toContain("second");
  });

  it("renders code block with border", () => {
    const { lastFrame } = render(
      <Markdown content={"```ts\nconst x = 1\n```"} />,
    );
    const frame = lastFrame() ?? "";
    expect(stripAnsi(frame)).toContain("x = 1");
    expect(frame).toContain("ts");
  });

  it("renders block quote", () => {
    const { lastFrame } = render(<Markdown content={"> quoted line"} />);
    const frame = lastFrame() ?? "";
    expect(frame).toContain("quoted line");
  });

  it("renders task list with checkboxes", () => {
    const { lastFrame } = render(
      <Markdown content={"- [x] done\n- [ ] todo"} />,
    );
    const frame = lastFrame() ?? "";
    expect(frame).toContain("done");
    expect(frame).toContain("todo");
    // Completed items get ● marker
    expect(frame).toContain("●");
    // Unchecked items get ○ marker
    expect(frame).toContain("○");
  });

  it("renders table with borders", () => {
    const content = "| Col1 | Col2 |\n|------|------|\n| A    | B    |";
    const { lastFrame } = render(<Markdown content={content} />);
    const frame = lastFrame() ?? "";
    expect(frame).toContain("Col1");
    expect(frame).toContain("Col2");
    expect(frame).toContain("A");
    expect(frame).toContain("B");
    expect(frame).toContain("┌");
  });

  it("renders inline code without backticks", () => {
    const { lastFrame } = render(
      <Markdown content={"use `console.log()` here"} />,
    );
    const frame = lastFrame() ?? "";
    expect(frame).toContain("console.log()");
    expect(frame).not.toContain("`console.log()`");
  });

  it("renders empty content without crash", () => {
    const { lastFrame } = render(<Markdown content="" />);
    expect(lastFrame()).toBeDefined();
  });

  it("renders multiline text", () => {
    const content = "line one\nline two\nline three";
    const { lastFrame } = render(<Markdown content={content} />);
    const frame = lastFrame() ?? "";
    expect(frame).toContain("line one");
    expect(frame).toContain("line two");
    expect(frame).toContain("line three");
  });
});

// ── StatusBar ─────────────────────────────────────────────────────────────────

const DEFAULT_STATUS_PROPS = {
  provider: "anthropic",
  model: "claude-opus-4",
  tokens: { input: 1000, output: 500 },
  workdir: "/home/user/project",
};

describe("Session chrome", () => {
  it("keeps model and context in the header", () => {
    const { lastFrame } = render(<CockpitHeader {...DEFAULT_STATUS_PROPS} contextTokens={10_000} />);
    expect(lastFrame()).toContain("opus-4");
    expect(lastFrame()).toContain("ctx");
  });

  it("renders workdir (~/project shorthand)", () => {
    const props = {
      ...DEFAULT_STATUS_PROPS,
      workdir: `${process.env["HOME"] ?? "/home/user"}/project`,
    };
    const { lastFrame } = render(<CockpitHeader {...props} contextTokens={0} cols={120} />);
    expect(lastFrame()).toContain("~/proj");
  });

  it("renders branch when provided", () => {
    const { lastFrame } = render(
      <CockpitHeader {...DEFAULT_STATUS_PROPS} branch="main" contextTokens={0} cols={120} />,
    );
    expect(lastFrame()).toContain("main");
  });

  it("shows exceptional footer state without duplicating model metadata", () => {
    const { lastFrame } = render(
      <StatusBar
        {...DEFAULT_STATUS_PROPS}
        scrollLocked
        sandboxBackend="none"
      />,
    );
    expect(lastFrame()).toContain("paused");
    expect(lastFrame()).toContain("no sandbox");
    expect(lastFrame()).not.toContain("opus-4");
  });

  it("renders without optional props", () => {
    const { lastFrame } = render(<StatusBar {...DEFAULT_STATUS_PROPS} />);
    expect(lastFrame()).toBeDefined();
    const frame = lastFrame() ?? "";
    expect(frame.length).toBeGreaterThan(0);
  });
});

// ── StartupBanner ─────────────────────────────────────────────────────────────

describe("StartupBanner", () => {
  it("renders version string", () => {
    const { lastFrame } = render(
      <StartupBanner
        version="0.0.1"
        provider="anthropic"
        model="claude-opus-4"
        workdir="/home/user/proj"
      />,
    );
    expect(lastFrame()).toContain("0.0.1");
  });

  it("renders AURICT letters", () => {
    const { lastFrame } = render(
      <StartupBanner
        version="1.0.0"
        provider="anthropic"
        model="claude-opus-4"
        workdir="/tmp"
      />,
    );
    const frame = lastFrame() ?? "";
    expect(frame).toContain("AURICT");
  });

  it("renders provider name", () => {
    const { lastFrame } = render(
      <StartupBanner
        version="0.0.1"
        provider="openai"
        model="gpt-4o"
        workdir="/tmp"
      />,
    );
    expect(lastFrame()).toContain("openai");
  });

  it("renders model name", () => {
    const { lastFrame } = render(
      <StartupBanner
        version="0.0.1"
        provider="anthropic"
        model="claude-sonnet-4-6"
        workdir="/tmp"
      />,
    );
    expect(lastFrame()).toContain("claude-sonnet-4-6");
  });

  it("shows ~/shorthand for home dir", () => {
    const home = process.env["HOME"] ?? "/root";
    const { lastFrame } = render(
      <StartupBanner
        version="0.0.1"
        provider="anthropic"
        model="claude-opus-4"
        workdir={`${home}/myproject`}
      />,
    );
    expect(lastFrame()).toContain("~/myproject");
  });

  it("renders slash command hints", () => {
    const { lastFrame } = render(
      <StartupBanner
        version="0.0.1"
        provider="anthropic"
        model="claude-opus-4"
        workdir="/tmp"
      />,
    );
    const frame = lastFrame() ?? "";
    expect(frame).toContain("/help");
  });
});

// ── PermissionPrompt ─────────────────────────────────────────────────────────

describe("PermissionPrompt", () => {
  it("bounds an unbroken command into inspectable terminal-width lines", () => {
    const lines = wrapPermissionText(`curl ${"x".repeat(240)}`, 32);
    expect(lines.length).toBeGreaterThan(3);
    expect(lines.every((line) => line.length <= 32)).toBe(true);
  });

  it("renders sandbox metadata for bash permission requests", () => {
    const { lastFrame } = render(
      <PermissionPrompt
        request={{
          id: "req-1",
          tool: "bash",
          pattern: "rm -rf dist",
          level: "danger",
          reason: "Destructive recursive remove (rm -rf) detected!",
          summary: "Execute a shell command",
          sandbox: {
            backend: "policy",
            reason: "Destructive recursive remove (rm -rf) detected!",
            envScrubbed: true,
          },
          command: {
            executables: ["rm"],
            readOnly: false,
          },
        }}
        onDecide={() => {}}
      />,
    );

    const frame = lastFrame() ?? "";
    expect(frame).toContain("Bash command");
    expect(frame).toContain("destructive operation");
    expect(frame).toContain("$ rm -rf dist");
    expect(frame).toContain("Edit command");
    expect(stripAnsi(frame).split("\n").length).toBeLessThanOrEqual(9);
  });

  it("offers directory approval for write requests", () => {
    const { lastFrame } = render(
      <PermissionPrompt
        request={{
          id: "req-write",
          tool: "write",
          pattern: "src/components/Button.tsx",
          level: "warning",
          reason: "Write a file",
        }}
        onDecide={() => {}}
      />,
    );

    const frame = lastFrame() ?? "";
    expect(frame).toContain("Allow directory");
    expect(frame).toContain("just this time");
    expect(stripAnsi(frame).split("\n").length).toBeLessThanOrEqual(9);
  });
});

describe("MultilineInput", () => {
  it("strips bracketed paste markers without dropping pasted content", () => {
    expect(sanitizePaste("\x1b[200~first line\nsecond line\x1b[201~")).toBe(
      "first line\nsecond line",
    );
  });

  it("caps a long one-line paste before Ink renders it", () => {
    expect(sanitizePaste("x".repeat(MAX_DRAFT_CHARS + 1))).toHaveLength(MAX_DRAFT_CHARS);
  });

  it("caps a long multi-line paste before Ink creates a node for each row", () => {
    expect(sanitizePaste("\n".repeat(MAX_DRAFT_LINES + 10)).split("\n")).toHaveLength(MAX_DRAFT_LINES);
  });

  it("rejects a plain input event once the current draft reaches its cap", () => {
    const cleaned = sanitizeInput("y");
    const inserted = limitInputInsertion(sanitizePaste("y"), MAX_DRAFT_CHARS, 1);
    expect(inserted).toBe("");
    expect(inputWasTruncated("y", cleaned, inserted)).toBe(true);
  });
});

// ── Tool Output Rendering ────────────────────────────────────────────────────

describe("Tool output rendering", () => {
  it("reduces long tool output to one semantic result row", () => {
    const output = Array.from({ length: 12 }, (_, i) => `line-${i + 1}`).join(
      "\n",
    );
    const { lastFrame } = render(
      <Message
        message={{
          role: "tool_call",
          tool: "bash",
          content: JSON.stringify({ command: "bun test" }),
          resultContent: output,
        }}
        onExpand={() => {}}
      />,
    );

    const frame = lastFrame() ?? "";
    expect(frame).toMatch(/12 lines\s+details \^O/);
    expect(frame).not.toContain("line-1");
    expect(frame).not.toContain("line-12");
    expect(frame).toContain("details ^O");
  });

  it("renders empty expanded output explicitly", () => {
    const { lastFrame } = render(
      <ExpandableOutput content="" toolName="bash" onClose={() => {}} />,
    );

    const frame = lastFrame() ?? "";
    expect(frame).toContain("0 lines");
    expect(frame).toContain("(empty output)");
  });
});

// ── Task Panel ───────────────────────────────────────────────────────────────

describe("TaskFloatingPanel", () => {
  it("renders task status summary and progress", () => {
    const { lastFrame } = render(
      <TaskFloatingPanel
        tasks={[
          {
            id: "1",
            subject: "Implement UI state",
            status: "done",
            blockedBy: [],
          },
          {
            id: "2",
            subject: "Polish task panel",
            status: "in_progress",
            blockedBy: [],
            owner: "ui",
          },
          {
            id: "3",
            subject: "Write tests",
            status: "pending",
            blockedBy: ["2"],
          },
          {
            id: "4",
            subject: "Fix render bug",
            status: "error",
            blockedBy: [],
            error: "Snapshot mismatch",
          },
        ]}
        onClose={() => {}}
      />,
    );

    const frame = lastFrame() ?? "";
    expect(frame).toContain("Tasks (4)");
    expect(frame).toContain("50%");
    expect(frame).toContain("run 1");
    expect(frame).toContain("wait 1");
    expect(frame).toContain("done 1");
    expect(frame).toContain("err 1");
    expect(frame).toContain("@ui");
    expect(frame).toContain("Snapshot mismatch");
  });
});

// ── Command UX ───────────────────────────────────────────────────────────────

const TEST_COMMANDS: CommandDef[] = [
  {
    name: "model",
    aliases: ["m"],
    description: "List and select models",
    usage: "/model [provider]",
    handler: () => ({ type: "text", content: "" }),
  },
  {
    name: "memory",
    aliases: ["mem"],
    description: "Manage persistent memory",
    usage: "/memory add <text>",
    handler: () => ({ type: "text", content: "" }),
  },
  {
    name: "theme",
    aliases: ["t"],
    description: "Change the color theme",
    usage: "/theme <name>",
    handler: () => ({ type: "text", content: "" }),
  },
];

describe("Command UX", () => {
  it("renders command palette categories and aliases", () => {
    const { lastFrame } = render(
      <TerminalSizeContext.Provider value={{ columns: 100, rows: 32 }}>
        <CommandPalette
          commands={TEST_COMMANDS}
          recentCommands={[]}
          onSelect={() => {}}
          onClose={() => {}}
        />
      </TerminalSizeContext.Provider>,
    );

    const frame = lastFrame() ?? "";
    expect(frame).toContain("Model");
    expect(frame).toContain("Memory");
    expect(frame).toContain("Settings");
    expect(frame).toContain("/m");
    expect(frame).toContain("/mem");
    expect(frame).toContain("Ctrl+Enter run");
  });

  it("renders slash command suggestions with category and usage", () => {
    const { lastFrame } = render(
      <CommandSuggest
        filter="mem"
        commands={TEST_COMMANDS}
        isActive
        onExecute={() => {}}
        onFill={() => {}}
      />,
    );

    const frame = lastFrame() ?? "";
    expect(frame).toContain("/memory");
    expect(frame).toContain("Memory");
    expect(frame).toContain("/mem");
    expect(frame).toContain("Manage persistent memory");
  });

  it("prioritizes exact aliases and command names in slash suggestions", () => {
    expect(getCommandMatches("m", TEST_COMMANDS)[0]?.name).toBe("model");
    expect(getCommandMatches("mem", TEST_COMMANDS)[0]?.name).toBe("memory");
    expect(getCommandMatches("memory", TEST_COMMANDS)[0]?.name).toBe("memory");
    expect(getCommandMatches("memory extra", TEST_COMMANDS)).toHaveLength(0);
  });

  it("does not parse an empty slash command", () => {
    expect(parseSlashCommand("/")).toBeNull();
    expect(parseSlashCommand("/   ")).toBeNull();
  });

  it("keeps curated and remote models in the model picker list", () => {
    const models = mergeModelLists(
      [
        {
          id: "claude-opus-4-8",
          name: "Claude Opus 4.8",
          contextWindow: 200_000,
          maxOutput: 32_000,
          supportsTools: true,
          supportsVision: true,
          supportsThinking: true,
        },
        {
          id: "claude-sonnet-4-6",
          name: "Claude Sonnet 4.6",
          contextWindow: 200_000,
          maxOutput: 64_000,
          supportsTools: true,
          supportsVision: true,
          supportsThinking: true,
        },
      ],
      [
        {
          id: "claude-opus-4-8",
          name: "claude-opus-4-8",
          contextWindow: 200_000,
          maxOutput: 32_000,
          supportsTools: true,
          supportsVision: true,
        },
        {
          id: "deepseek-v4-flash",
          name: "deepseek-v4-flash",
          contextWindow: 200_000,
          maxOutput: 32_000,
          supportsTools: true,
          supportsVision: false,
        },
      ],
    );

    expect(models.map((m) => m.id)).toEqual([
      "claude-opus-4-8",
      "claude-sonnet-4-6",
      "deepseek-v4-flash",
    ]);
    expect(models[0]?.name).toBe("Claude Opus 4.8");
  });
});

// ── Design Wizard ────────────────────────────────────────────────────────────

describe("DesignWizard", () => {
  it("starts at workflow selection when initial brief is provided", () => {
    const { lastFrame } = render(
      <DesignWizard
        workdir="/tmp"
        initialBrief="dark analytics dashboard for a SaaS product"
        onLaunch={() => {}}
        onClose={() => {}}
      />,
    );

    const frame = lastFrame() ?? "";
    expect(frame).toContain("Design Wizard");
    expect(frame).toContain("2/4");
    expect(frame).toContain("Choose the design workflow");
    expect(frame).toContain("Tab suggestion");
  });
});
