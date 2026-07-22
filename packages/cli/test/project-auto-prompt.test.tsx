import { afterEach, describe, expect, it } from "bun:test";
import React from "react";
import { cleanup, render } from "ink-testing-library";
import { ProjectAutoPrompt } from "../src/tui/ProjectAutoPrompt.js";
import { TerminalSizeContext } from "../src/tui/TerminalSizeContext.js";
import { DEFAULT_THEME, THEMES, ThemeContext } from "../src/utils/theme.js";

afterEach(() => cleanup());

function renderPrompt(onDecide: (enabled: boolean) => void) {
  return render(
    <TerminalSizeContext.Provider value={{ columns: 100, rows: 30 }}>
      <ThemeContext.Provider value={THEMES[DEFAULT_THEME]!}>
        <ProjectAutoPrompt workdir="/work/acme" onDecide={onDecide} />
      </ThemeContext.Provider>
    </TerminalSizeContext.Provider>,
  );
}

describe("Project Auto startup prompt", () => {
  it("shows the exact project and safety exclusions", () => {
    const view = renderPrompt(() => {});
    const frame = view.lastFrame() ?? "";

    expect(frame).toContain("Project Auto");
    expect(frame).toContain("/work/acme");
    expect(frame).toContain("Yes · enable Auto");
    expect(frame).toContain("No · ask each time");
    expect(frame).toContain("shell, secrets");
  });

  it("accepts direct no and yes choices", async () => {
    const decisions: boolean[] = [];
    const manual = renderPrompt((enabled) => decisions.push(enabled));
    await new Promise((resolve) => setTimeout(resolve, 30));
    manual.stdin.write("n");
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(decisions).toEqual([false]);
    manual.unmount();

    const auto = renderPrompt((enabled) => decisions.push(enabled));
    await new Promise((resolve) => setTimeout(resolve, 30));
    auto.stdin.write("y");
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(decisions).toEqual([false, true]);
  });
});
