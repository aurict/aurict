import { describe, expect, it } from "bun:test";
import {
  terminalNotificationSequence,
  terminalTitleSequence,
} from "../src/tui/event-system/terminal-attention.js";

describe("terminal attention controls", () => {
  it("sets a stateful OSC 0 title", () => {
    expect(terminalTitleSequence("Refactor API", "running")).toBe("\x1b]0;● Aurict — Refactor API\x07");
    expect(terminalTitleSequence("Approval", "permission")).toContain("! Aurict");
  });

  it("combines BEL with an OSC 9 desktop notification", () => {
    expect(terminalNotificationSequence("Turn finished")).toBe("\x07\x1b]9;Turn finished\x07");
  });

  it("removes terminal control injection from titles and notifications", () => {
    expect(terminalTitleSequence("unsafe\x1b]0;owned", "ready")).not.toContain("\x1b]0;owned");
    expect(terminalNotificationSequence("done\nnow")).toContain("done now");
  });
});
