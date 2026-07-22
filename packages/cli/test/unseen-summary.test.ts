import { describe, expect, it } from "bun:test";
import { summarizeUnseenMessages } from "../src/tui/conversation/unseen-summary.js";
import { TURN_CANCELLED_NOTICE } from "../src/tui/app/cancellation-feedback.js";

describe("unseen conversation summaries", () => {
  it("prioritizes a structured verification failure over generic message counts", () => {
    expect(summarizeUnseenMessages([{
      id: "verify",
      role: "assistant",
      content: "",
      blocks: [{
        type: "tool",
        id: "tool",
        tool: "verify",
        args: "{}",
        pending: false,
        artifact: {
          kind: "error",
          output: "検証に失敗しました",
          outputLines: 1,
          presentation: {
            status: "error",
            changedFiles: [],
            filePaths: [],
            errors: ["検証に失敗しました"],
            importantLines: [],
            verification: [{ check: "test", status: "failed" }],
          },
        },
      }],
    }])).toEqual({ count: 1, label: "verify failed" });
  });

  it("distinguishes responses, tool results, and notices", () => {
    expect(summarizeUnseenMessages([{ role: "assistant", content: "Ready" }]).label).toBe("response");
    expect(summarizeUnseenMessages([{ role: "tool_result", content: "Ready" }]).label).toBe("tool result");
    expect(summarizeUnseenMessages([{ role: "system", content: "Ready" }]).label).toBe("notice");
  });
});

describe("turn cancellation feedback", () => {
  it("states both the cancellation and session preservation guarantee", () => {
    expect(TURN_CANCELLED_NOTICE).toContain("cancelled");
    expect(TURN_CANCELLED_NOTICE).toContain("state preserved");
  });
});
