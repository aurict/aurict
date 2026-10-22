import { afterEach, describe, expect, it } from "bun:test";
import React from "react";
import { cleanup, render } from "ink-testing-library";
import { ProjectAutoPrompt } from "../src/tui/ProjectAutoPrompt.js";
import { TerminalSizeContext } from "../src/tui/TerminalSizeContext.js";
import { DEFAULT_THEME, THEMES, ThemeContext } from "../src/utils/theme.js";

afterEach(() => cleanup());
const tick = () => new Promise((resolve) => setTimeout(resolve, 30));

function renderPrompt(onDecide: (trusted: boolean) => void) {
  return render(
    <TerminalSizeContext.Provider value={{ columns: 100, rows: 30 }}>
      <ThemeContext.Provider value={THEMES[DEFAULT_THEME]!}>
        <ProjectAutoPrompt workdir="/work/acme" onDecide={onDecide} />
      </ThemeContext.Provider>
    </TerminalSizeContext.Provider>,
  );
}

describe("folder trust prompt", () => {
  it("shows the Codex folder access prompt", () => {
    const lines = (renderPrompt(() => {}).lastFrame() ?? "").split("\n");
    expect(lines).toContain("  Folder access");
    expect(lines).toContain("  /work/acme");
    expect(lines).toContain("› 1. Trust and continue");
    expect(lines).toContain("  2. Quit");
    expect(lines).toContain("  enter continue · esc quit");
    // Wrapped paragraph lines never start with a stray space.
    expect(lines.filter((line) => /^ {3}\S/.test(line))).toEqual([]);
  });

  it("picks by number", async () => {
    const decisions: boolean[] = [];
    const first = renderPrompt((trusted) => decisions.push(trusted));
    await tick(); first.stdin.write("2"); await tick();
    first.unmount();
    const second = renderPrompt((trusted) => decisions.push(trusted));
    await tick(); second.stdin.write("1"); await tick();
    expect(decisions).toEqual([false, true]);
  });

  it("moves to Quit with the arrows and confirms with Enter", async () => {
    const decisions: boolean[] = [];
    const view = renderPrompt((trusted) => decisions.push(trusted));
    await tick();
    view.stdin.write("\u001B[B"); await tick();
    expect(view.lastFrame()).toContain("› 2. Quit");
    view.stdin.write("\r"); await tick();
    expect(decisions).toEqual([false]);
  });
});
