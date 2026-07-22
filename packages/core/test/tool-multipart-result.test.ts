import { describe, expect, it } from "bun:test"
import {
  adaptedToolResultPresentation,
  formatAdaptedToolResult,
  toolResultPresentation,
} from "../src/agent/tool-adapter.js"

describe("multipart tool results", () => {
  it("keeps transcript consumers on the human-readable text", () => {
    expect(formatAdaptedToolResult({
      text: "Image loaded: screenshot.png",
      content: [{ type: "image", data: "AA==", mimeType: "image/png" }],
    })).toBe("Image loaded: screenshot.png")
  })

  it("preserves ordinary string results", () => {
    expect(formatAdaptedToolResult("plain output")).toBe("plain output")
  })

  it("builds a language-independent presentation from execution metadata", () => {
    const presentation = toolResultPresentation({
      output: "すべての検証が完了しました",
      metadata: {
        changedFiles: ["src/a.ts"],
        distilled: {
          tool: "verify",
          status: "success",
          changedFiles: ["src/a.ts"],
          filePaths: ["src/a.ts"],
          errors: [],
          importantLines: [],
          verification: [],
          outputPreview: "すべての検証が完了しました",
        },
        verification: { test: { status: "passed" }, lint: { status: "skipped" } },
      },
    })

    expect(presentation).toEqual({
      status: "success",
      changedFiles: ["src/a.ts"],
      filePaths: ["src/a.ts"],
      errors: [],
      importantLines: [],
      verification: [
        { check: "test", status: "passed" },
        { check: "lint", status: "skipped" },
      ],
    })
    expect(adaptedToolResultPresentation({ text: "ok", content: [], presentation })).toEqual(presentation)
  })
})
