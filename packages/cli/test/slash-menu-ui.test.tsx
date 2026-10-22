import { describe, expect, test } from "bun:test";
import React from "react";
import { render } from "ink-testing-library";
import { allCommands } from "../src/commands/registry.js";
import { CommandSuggest } from "../src/tui/CommandSuggest.js";
import { Picker } from "../src/tui/Picker.js";
import { TerminalSizeContext } from "../src/tui/TerminalSizeContext.js";

const tick = () => new Promise((resolve) => setTimeout(resolve, 30));
const sized = (node: React.ReactElement) => <TerminalSizeContext.Provider value={{ columns: 80, rows: 30 }}>{node}</TerminalSizeContext.Provider>;

async function drive(filter: string, keys: string[]) {
  const run: string[] = [], fill: string[] = [];
  const view = render(sized(<CommandSuggest filter={filter} commands={allCommands()} isActive onExecute={(name) => run.push(name)} onFill={(name) => fill.push(name)} />));
  await tick();
  const frame = view.lastFrame() ?? "";
  for (const key of keys) { view.stdin.write(key); await tick(); }
  view.unmount();
  return { frame, run, fill };
}

describe("slash menu", () => {
  test("a bare slash lists commands in Codex's order", async () => {
    const { frame } = await drive("", []);
    const names = [...frame.matchAll(/\/([\w-]+)/g)].map((match) => match[1]);
    expect(names.slice(0, 3)).toEqual(["models", "permissions", "keys"]);
  });

  test("enter runs the highlighted command and tab fills it", async () => {
    expect((await drive("perm", ["\r"])).run).toEqual(["permissions"]);
    expect((await drive("st", ["\x1b[B", "\t"])).fill).toEqual(["stash"]);
  });

  test("an unknown filter shows nothing and runs nothing", async () => {
    const { frame, run } = await drive("zzz", ["\r"]);
    expect(frame.trim()).toBe("");
    expect(run).toEqual([]);
  });
});

describe("picker keys", () => {
  const items = [{ id: "a", label: "Alpha" }, { id: "b", label: "Beta" }, { id: "c", label: "Gamma" }];

  test("digits pick directly, arrows clamp at the last row, typing filters", async () => {
    const picked: string[] = [];
    let view = render(sized(<Picker title="T" items={items} onSelect={(item) => picked.push(item.id)} onCancel={() => {}} />));
    await tick();
    view.stdin.write("2"); await tick();
    for (const key of ["\x1b[B", "\x1b[B", "\x1b[B", "\r"]) { view.stdin.write(key); await tick(); }
    view.unmount();
    view = render(sized(<Picker title="T" items={items} onSelect={(item) => picked.push(item.id)} onCancel={() => {}} />));
    await tick();
    view.stdin.write("gam"); await tick();
    view.stdin.write("\r"); await tick();
    view.unmount();
    expect(picked).toEqual(["b", "c", "c"]);
  });

  test("esc cancels", async () => {
    let cancelled = 0;
    const view = render(sized(<Picker title="T" items={items} onSelect={() => {}} onCancel={() => cancelled++} />));
    await tick();
    view.stdin.write("\x1b"); await tick(); await tick();
    view.unmount();
    expect(cancelled).toBe(1);
  });
});
