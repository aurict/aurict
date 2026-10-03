import React from "react";
import { describe, expect, mock, test } from "bun:test";
import { render } from "ink-testing-library";
import { MultilineInput } from "../src/tui/MultilineInput.js";
import { RunStatusLine } from "../src/tui/RunStatusLine.js";
import { SessionFooter } from "../src/tui/SessionChrome.js";
import { cancelActiveTurn, openBacktrackPicker } from "../src/tui/app/app-keyboard-actions.js";
import type { AppKeyboardParams } from "../src/tui/app/app-keyboard-types.js";
import type { PickerRequest } from "../src/tui/app/app-state-types.js";
import type { DisplayMessage } from "../src/tui/conversation/types.js";
import { TURN_CANCELLED_NOTICE } from "../src/tui/app/cancellation-feedback.js";

const flush = () => new Promise((resolve) => setTimeout(resolve, 20));

describe("composer paste placeholders", () => {
  test("a large bracketed paste shows one token and submits the full text", async () => {
    const onSubmit = mock((_value: string) => {});
    const pasted = Array.from({ length: 30 }, (_, index) => `log line ${index}`).join("\n");
    const view = render(
      <MultilineInput value="" onChange={() => {}} onSubmit={onSubmit} disabled={false} history={[]} />,
    );
    await flush();
    view.stdin.write("explain ");
    await flush();
    view.stdin.write(`\x1b[200~${pasted}\x1b[201~`);
    await flush();
    expect(view.lastFrame()).toContain("[Pasted text #1 · 30 lines]");
    expect(view.lastFrame()).not.toContain("log line 29");
    view.stdin.write("\r");
    await flush();
    expect(onSubmit).toHaveBeenCalledWith(`explain ${pasted}`);
    view.unmount();
  });

  test("small pastes are inserted as typed", async () => {
    const onSubmit = mock((_value: string) => {});
    const view = render(
      <MultilineInput value="" onChange={() => {}} onSubmit={onSubmit} disabled={false} history={[]} />,
    );
    await flush();
    view.stdin.write("\x1b[200~two\nlines\x1b[201~");
    await flush();
    expect(view.lastFrame()).toContain("lines");
    expect(view.lastFrame()).not.toContain("Pasted text");
    view.unmount();
  });
});

describe("run status line", () => {
  test("reports work, elapsed time, the interrupt key, and the current action", async () => {
    const view = render(
      <RunStatusLine loading activity="thinking" reasoning="**Mapping the call graph**" queued={2} columns={120} />,
    );
    await flush();
    const frame = view.lastFrame()!;
    expect(frame).toContain("Working (0s · esc to interrupt)");
    expect(frame).toContain("thinking · Mapping the call graph · 2 queued");
    view.unmount();
  });

  test("renders nothing while idle", () => {
    const view = render(<RunStatusLine loading={false} columns={80} />);
    expect(view.lastFrame()).toBe("");
    view.unmount();
  });
});

describe("inline footer", () => {
  test("carries model, context, and a non-default approval mode", () => {
    const view = render(
      <SessionFooter
        cols={120}
        sandboxBackend="policy"
        approvalMode="full"
        session={{ provider: "anthropic", model: "claude-sonnet-5-5", contextTokens: 50_000, contextWindow: 200_000 }}
      />,
    );
    const frame = view.lastFrame()!;
    expect(frame).toContain("anthropic/sonnet-5-5");
    expect(frame).toContain("ctx 25%");
    expect(frame).toContain("full access");
    view.unmount();
  });

  test("transient hints replace the idle state", () => {
    const view = render(<SessionFooter cols={100} hint="Esc again to edit a previous message" />);
    expect(view.lastFrame()).toContain("Esc again to edit a previous message");
    view.unmount();
  });
});

function keyboardParams(messages: DisplayMessage[], overrides: Partial<AppKeyboardParams> = {}) {
  const calls = { picker: null as PickerRequest | null, editing: null as unknown, notices: [] as string[], rewound: [] as number[] };
  const params = {
    messages,
    checkpoints: [],
    requestRewind: (index: number) => calls.rewound.push(index),
    overlay: {
      closePrimaryOverlays: () => {},
      setEditingMsg: (value: unknown) => { calls.editing = value; },
      setPlanRequest: () => {},
    },
    setPicker: (value: PickerRequest | null) => { calls.picker = value; },
    addSystemMsg: (content: string) => calls.notices.push(content),
    ...overrides,
  } as unknown as AppKeyboardParams;
  return { params, calls };
}

describe("Esc Esc backtrack", () => {
  const messages: DisplayMessage[] = [
    { id: "u1", role: "user", content: "first prompt", timestamp: 1_721_234_000_000 },
    { id: "a1", role: "assistant", content: "answer" },
    { id: "u2", role: "user", content: "second prompt" },
    { id: "a2", role: "assistant", content: "answer two" },
  ];

  test("lists previous prompts newest first and opens the editor for the choice", () => {
    const { params, calls } = keyboardParams(messages);
    expect(openBacktrackPicker(params)).toBe(true);
    expect(calls.picker!.items.map((item) => item.label)).toEqual(["second prompt", "first prompt"]);
    calls.picker!.onSelect(calls.picker!.items[1]!);
    expect(calls.editing).toEqual({ id: "u1", content: "first prompt", msgIndex: 0 });
  });

  test("rewinds through the turn checkpoint when the prompt has one", () => {
    const checkpoint = { id: "c1", mark: 0, scope: "s", messages: messages.slice(0, 2), history: [], prompt: "second prompt", label: "second prompt", createdAt: 0 };
    const { params, calls } = keyboardParams(messages, { checkpoints: [checkpoint] } as Partial<AppKeyboardParams>);
    expect(openBacktrackPicker(params)).toBe(true);
    calls.picker!.onSelect(calls.picker!.items[0]!);
    expect(calls.rewound).toEqual([0]);
    expect(calls.editing).toBeNull();
  });

  test("does nothing without a previous prompt", () => {
    const { params, calls } = keyboardParams([{ id: "s1", role: "system", content: "ready" }]);
    expect(openBacktrackPicker(params)).toBe(false);
    expect(calls.picker).toBeNull();
  });
});

describe("cancelActiveTurn", () => {
  test("aborts the running turn once and records the cancellation", () => {
    const controller = new AbortController();
    const abortControllerRef = { current: controller as AbortController | null };
    const { params, calls } = keyboardParams([], {
      loadingRef: { current: true },
      abortControllerRef,
      setPermissionQueue: () => {},
      setMessages: () => {},
      setStreamingText: () => {},
      setStreamingReason: () => {},
      setScrollLocked: () => {},
      setConversationOffsetRows: () => {},
    } as unknown as Partial<AppKeyboardParams>);
    expect(cancelActiveTurn(params)).toBe(true);
    expect(controller.signal.aborted).toBe(true);
    expect(calls.notices).toEqual([TURN_CANCELLED_NOTICE]);
    expect(cancelActiveTurn(params)).toBe(false);
  });
});
