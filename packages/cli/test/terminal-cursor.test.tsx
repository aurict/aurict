import { describe, expect, mock, test } from "bun:test";
import React, { memo, useState } from "react";
import * as ink from "ink";

// Record what the composer hands Ink as the terminal cursor on each render.
const positions: Array<{ x: number; y: number } | undefined> = [];
mock.module("../src/tui/design-system/renderer.js", () => ({
  ...ink,
  useCursor: () => ({ setCursorPosition: (position: { x: number; y: number } | undefined) => { positions.push(position); } }),
}));

const { render } = await import("ink-testing-library");
const { MultilineInput } = await import("../src/tui/MultilineInput.js");
const tick = (ms = 60) => new Promise((resolve) => setTimeout(resolve, ms));

// Memoized like the real composer: it does not re-render when rows above it change.
const Composer = memo(() => <MultilineInput value="hello" onChange={() => {}} onSubmit={() => {}} disabled={false} history={[]} />);
let grow = () => {};
function Shell() {
  const [rows, setRows] = useState(1);
  grow = () => setRows((count) => count + 2);
  return (
    <ink.Box flexDirection="column">
      {Array.from({ length: rows }, (_, index) => <ink.Text key={index}>status {index}</ink.Text>)}
      <Composer />
    </ink.Box>
  );
}

describe("terminal cursor", () => {
  test("follows the composer when rows above it change without re-rendering it", async () => {
    const view = render(<Shell />);
    await tick();
    expect(positions.at(-1)).toEqual({ x: 0, y: 1 });
    grow();
    await tick();
    expect(positions.at(-1)).toEqual({ x: 0, y: 3 });
    view.unmount();
  });
});
