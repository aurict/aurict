import { describe, expect, test } from "bun:test";
import { PassThrough } from "node:stream";
import { DEFAULT_TUI_MODE, resolveTuiMode } from "../src/tui/render-mode.js";
import { createSynchronizedOutput, synchronizedOutputEnabled } from "../src/util/synchronized-output.js";

describe("resolveTuiMode", () => {
  test("defaults to inline scrollback", () => {
    expect(DEFAULT_TUI_MODE).toBe("inline");
    expect(resolveTuiMode({})).toBe("inline");
  });

  test("flag beats environment, environment beats config", () => {
    expect(resolveTuiMode({ flag: "fullscreen", env: "inline", config: "inline" })).toBe("fullscreen");
    expect(resolveTuiMode({ env: "FULLSCREEN", config: "inline" })).toBe("fullscreen");
    expect(resolveTuiMode({ config: "fullscreen" })).toBe("fullscreen");
  });

  test("invalid values fail loudly instead of silently falling back", () => {
    expect(() => resolveTuiMode({ env: "split" })).toThrow("AURICT_TUI_MODE");
    expect(() => resolveTuiMode({ config: "tabs" })).toThrow("defaults.tuiMode");
  });
});

function capture() {
  const stream = new PassThrough() as unknown as NodeJS.WriteStream;
  const writes: string[] = [];
  const original = stream.write.bind(stream);
  stream.write = ((chunk: string | Uint8Array, ...rest: unknown[]) => {
    writes.push(String(chunk));
    return (original as (...args: unknown[]) => boolean)(chunk, ...rest);
  }) as typeof stream.write;
  return { stream, writes };
}

describe("synchronized output", () => {
  test("coalesces one tick of frame writes into a single synchronized update", async () => {
    const out = capture();
    const err = capture();
    const { stdout } = createSynchronizedOutput(out.stream, err.stream);
    stdout.write("erase");
    stdout.write("static");
    stdout.write("frame");
    expect(out.writes).toEqual([]);
    await Promise.resolve();
    expect(out.writes).toEqual(["\x1b[?2026herasestaticframe\x1b[?2026l"]);
  });

  test("stderr output lands between the erase and redraw that surround it", async () => {
    const out = capture();
    const err = capture();
    const order: string[] = [];
    out.stream.on("data", (chunk) => order.push(`out:${String(chunk)}`));
    err.stream.on("data", (chunk) => order.push(`err:${String(chunk)}`));
    const { stdout, stderr } = createSynchronizedOutput(out.stream, err.stream);
    stdout.write("erase");
    stderr.write("warning\n");
    stdout.write("redraw");
    await Promise.resolve();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(order).toEqual([
      "out:\x1b[?2026herase\x1b[?2026l",
      "err:warning\n",
      "out:\x1b[?2026hredraw\x1b[?2026l",
    ]);
  });

  test("forwards terminal properties of the wrapped stream", () => {
    const out = capture();
    (out.stream as unknown as { columns: number }).columns = 91;
    const { stdout } = createSynchronizedOutput(out.stream, capture().stream);
    expect(stdout.columns).toBe(91);
  });

  test("can be disabled for dumb terminals and by opt-out", () => {
    expect(synchronizedOutputEnabled({ TERM: "xterm-256color" })).toBe(true);
    expect(synchronizedOutputEnabled({ TERM: "dumb" })).toBe(false);
    expect(synchronizedOutputEnabled({ AURICT_SYNC_OUTPUT: "0" })).toBe(false);
  });
});
