import React from "react";
import { afterEach, describe, expect, it } from "bun:test";
import { cleanup, render } from "ink-testing-library";
import { MultilineInput } from "../src/tui/MultilineInput.js";

afterEach(() => cleanup());
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("MultilineInput undo history", () => {
  it("undoes and redoes a complete terminal input event", async () => {
    let value = "";
    const view = render(<MultilineInput value="" onChange={(next) => { value = next; }} onSubmit={() => {}} disabled={false} history={[]} />);
    await flush();
    view.stdin.write("hello 🙂");
    await flush();
    expect(value).toBe("hello 🙂");
    view.stdin.write("\x1a");
    await flush();
    expect(value).toBe("");
    view.stdin.write("\x1bz");
    await flush();
    expect(value).toBe("hello 🙂");
  });
});
