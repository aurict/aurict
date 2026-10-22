import { describe, expect, it } from "bun:test";
import { approvalNotice } from "../src/tui/permission-feedback.js";

const text = (notice: ReturnType<typeof approvalNotice>) => notice?.parts.map((part) => part.text).join("") ?? null;
const run = (pattern: string, prefixRule?: string) => ({ tool: "bash", pattern, ...(prefixRule ? { prefixRule } : {}) });

describe("approval decision cells", () => {
  it("records shell decisions with Codex wording", () => {
    expect(text(approvalNotice("allow_once", run("echo hello world")))).toBe("You approved aurict to run echo hello world this time");
    expect(text(approvalNotice("allow", run("bun test")))).toBe("You approved aurict to run bun test every time this session");
    expect(text(approvalNotice("allow_prefix", run("git status --short", "git status --short")))).toBe("You approved aurict to always run commands that start with git status --short");
    expect(text(approvalNotice("deny", run("rm -rf dist")))).toBe("You did not approve aurict to run rm -rf dist");
    expect(text(approvalNotice("deny_abort", run("echo line1\necho line2")))).toBe("You canceled the request to run echo line1 ...");
  });

  it("marks approvals green and refusals red with a bold verb", () => {
    const approved = approvalNotice("allow_once", run("ls"))!;
    expect(approved.marker).toBe("check");
    expect(approved.parts[1]).toEqual({ text: "approved", bold: true });
    expect(approvalNotice("deny_abort", run("ls"))!.marker).toBe("error");
  });

  it("writes no cell for edits and plain lines for other tools", () => {
    expect(approvalNotice("allow_once", { tool: "apply_patch", pattern: "src/a.ts" })).toBeNull();
    expect(text(approvalNotice("allow_once", { tool: "webfetch", pattern: "https://example.com" }))).toBe("You granted additional permissions");
    expect(text(approvalNotice("deny", { tool: "webfetch", pattern: "https://example.com" }))).toBe("You did not grant additional permissions");
  });

  it("truncates long commands to 80 characters", () => {
    expect(text(approvalNotice("allow_once", run("x".repeat(200))))!.length).toBeLessThan(120);
  });
});
