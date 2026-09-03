import { afterEach, describe, expect, test } from "bun:test";
import React, { useEffect } from "react";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { Text } from "ink";
import { cleanup, render } from "ink-testing-library";
import { overlayGeometry } from "../src/tui/app-shell/OverlayStack.js";
import { AppHeader } from "../src/tui/app/AppHeader.js";
import { AppOverlayContents } from "../src/tui/app/AppOverlayContents.js";
import {
  isBlockingOverlayLayer,
  keybindingContextForFocusLayer,
  resolveFocusLayer,
} from "../src/tui/app/app-view-model.js";
import type { FocusState } from "../src/tui/app/app-types.js";
import { useOverlayState } from "../src/tui/hooks/useOverlayState.js";
import { DEFAULT_THEME, THEMES } from "../src/utils/theme.js";

afterEach(() => cleanup());

const EMPTY_FOCUS: FocusState = {
  permission: false,
  projectAuto: false,
  question: false,
  picker: false,
  prompt: false,
  keyboardShortcuts: false,
  subagent: false,
  transcriptSearch: false,
  historySearch: false,
  quickSearch: false,
  commandPalette: false,
  settings: false,
  designWizard: false,
  editing: false,
  plan: false,
  expanded: false,
  btw: false,
  taskPanel: false,
  attach: false,
  streaming: false,
};

function OverlayProbe({ action }: { action: "open-settings" | "open-quick" | "open-expanded" | "close-primary" }) {
  const overlay = useOverlayState();

  useEffect(() => {
    if (action === "open-settings") overlay.setSettingsOpen(true);
    if (action === "open-quick") overlay.setQuickSearchOpen(true);
    if (action === "open-expanded") {
      overlay.setExpandedContent({ content: "details", toolName: "bash" });
    }
    if (action === "close-primary") overlay.closePrimaryOverlays();
  }, [action]);

  return (
    <Text>
      {overlay.computeOverlayOpen() ? "open" : "closed"}:
      {overlay.settingsOpen ? "settings" : "no-settings"}:
      {overlay.quickSearchOpen ? "quick" : "no-quick"}:
      {overlay.expandedContent ? "expanded" : "no-expanded"}
    </Text>
  );
}

async function settle(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("App focus characterization", () => {
  test("defaults to the ready input layer", () => {
    expect(resolveFocusLayer(EMPTY_FOCUS)).toBe("ready");
    expect(keybindingContextForFocusLayer("ready")).toBe("ready");
  });

  test("keeps permission ahead of every other visible layer", () => {
    const allOpen = Object.fromEntries(
      Object.keys(EMPTY_FOCUS).map((key) => [key, true]),
    ) as unknown as FocusState;
    expect(resolveFocusLayer(allOpen)).toBe("permission");
  });

  test("blocks composer input while the startup Project Auto choice is open", () => {
    expect(resolveFocusLayer({ ...EMPTY_FOCUS, projectAuto: true })).toBe("projectAuto");
    expect(keybindingContextForFocusLayer("projectAuto")).toBe("modal");
    expect(isBlockingOverlayLayer("projectAuto")).toBe(false);
  });

  test("keeps modal, task, and streaming keybinding contexts distinct", () => {
    expect(keybindingContextForFocusLayer("commandPalette")).toBe("modal");
    expect(keybindingContextForFocusLayer("taskPanel")).toBe("task-panel");
    expect(keybindingContextForFocusLayer("streaming")).toBe("streaming");
    expect(keybindingContextForFocusLayer("question")).toBe("question");
    expect(keybindingContextForFocusLayer("prompt")).toBe("picker");
    expect(isBlockingOverlayLayer("settings")).toBe(true);
    expect(isBlockingOverlayLayer("permission")).toBe(false);
    expect(isBlockingOverlayLayer("taskPanel")).toBe(false);
  });

  test("uses the existing question, picker, and prompt precedence", () => {
    expect(resolveFocusLayer({
      ...EMPTY_FOCUS,
      question: true,
      picker: true,
      prompt: true,
    })).toBe("question");
    expect(resolveFocusLayer({
      ...EMPTY_FOCUS,
      picker: true,
      prompt: true,
    })).toBe("picker");
  });
});

describe("overlay state characterization", () => {
  test("primary close leaves detail overlays intact", async () => {
    const view = render(<OverlayProbe action="open-expanded" />);
    await settle();
    expect(view.lastFrame()).toContain("open:no-settings:no-quick:expanded");

    view.rerender(<OverlayProbe action="open-settings" />);
    await settle();
    expect(view.lastFrame()).toContain("open:settings:no-quick:expanded");

    view.rerender(<OverlayProbe action="open-quick" />);
    await settle();
    expect(view.lastFrame()).toContain("open:no-settings:quick:expanded");

    view.rerender(<OverlayProbe action="close-primary" />);
    await settle();
    expect(view.lastFrame()).toContain("open:no-settings:no-quick:expanded");
  });

  test("OverlayStack geometry stays inside narrow and wide terminals", () => {
    expect(overlayGeometry(40, 12)).toEqual({
      width: 40,
      height: 12,
      marginX: 0,
      marginY: 0,
      compact: true,
    });
    expect(overlayGeometry(120, 40)).toEqual({
      width: 116,
      height: 38,
      marginX: 2,
      marginY: 1,
      compact: false,
    });
  });

  test("extracted header keeps update and session notices", () => {
    const theme = THEMES[DEFAULT_THEME]!;
    const view = render(
      <AppHeader
        theme={theme}
        subagent={null}
        cockpit={null}
        startup={null}
        updateInfo={{ current: "1.0.0", latest: "1.1.0" }}
        updateDismissed={false}
        sessionTitle="Refactor terminal shell"
        showSessionTitle={true}
      />,
    );
    expect(view.lastFrame()).toContain("Update available: v1.0.0 → v1.1.0");
    expect(view.lastFrame()).toContain("Refactor terminal shell");
  });

  test("only the focused overlay content is rendered", () => {
    const theme = THEMES[DEFAULT_THEME]!;
    const base = {
      theme,
      activeLayer: "attach" as const,
      keyboardShortcuts: { onClose: () => {} },
      historySearch: null,
      transcriptSearch: null,
      quickSearch: null,
      commandPalette: null,
      settings: null,
      designWizard: null,
      planApproval: null,
      messageEdit: null,
      picker: null,
      prompt: null,
      question: null,
      permission: null,
      expandedOutput: null,
      btw: null,
    };
    const view = render(
      <AppOverlayContents
        {...base}
        attachmentInput={{ path: "docs/" }}
      />,
    );
    expect(view.lastFrame()).toContain("File path: docs/");
    expect(view.lastFrame()).not.toContain("Keyboard shortcuts");
  });
});

describe("renderer boundary", () => {
  test("presentation components import Ink through the design system", () => {
    const root = join(import.meta.dir, "../src/tui");
    const allowed = new Set([
      "FullscreenLayout.tsx",
      "MultilineInput.tsx",
      "TranscriptRows.tsx",
      "DiffRenderer/DiffRenderer.tsx",
      "app-shell/ComposerPane.tsx",
      "app-shell/TerminalAppShell.tsx",
      "event-system/measure-position.ts",
    ]);
    const violations: string[] = [];
    const visit = (directory: string) => {
      for (const entry of readdirSync(directory, { withFileTypes: true })) {
        const path = join(directory, entry.name);
        if (entry.isDirectory()) {
          visit(path);
          continue;
        }
        if (!entry.name.endsWith(".ts") && !entry.name.endsWith(".tsx")) continue;
        const sourcePath = relative(root, path).split("\\").join("/");
        if (sourcePath.startsWith("design-system/") || allowed.has(sourcePath)) continue;
        if (/from ["']ink["']/.test(readFileSync(path, "utf8"))) violations.push(sourcePath);
      }
    };
    visit(root);
    expect(violations).toEqual([]);
  });
});

describe("controller modularity boundary", () => {
  test("keeps every TUI code file within the repository line ceiling", () => {
    const root = join(import.meta.dir, "../src/tui");
    const violations: Array<{ path: string; lines: number }> = [];
    const visit = (directory: string) => {
      for (const entry of readdirSync(directory, { withFileTypes: true })) {
        const path = join(directory, entry.name);
        if (entry.isDirectory()) {
          visit(path);
          continue;
        }
        if (!entry.name.endsWith(".ts") && !entry.name.endsWith(".tsx")) continue;
        const source = readFileSync(path, "utf8");
        const lines = source.endsWith("\n")
          ? source.slice(0, -1).split(/\r?\n/).length
          : source.split(/\r?\n/).length;
        if (lines > 500) violations.push({ path: relative(root, path), lines });
      }
    };
    visit(root);
    expect(violations).toEqual([]);
  });
});
