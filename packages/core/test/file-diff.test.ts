import { describe, expect, it } from "bun:test"
import { createUnifiedDiff, createUnifiedFileDiff } from "../src/tool/file-diff.js"

describe("complete unified file diffs", () => {
  it("renders every line of a newly created file as an addition", () => {
    const diff = createUnifiedFileDiff({
      afterPath: "src/new.ts",
      beforeContent: "",
      afterContent: "one\ntwo\nthree\n",
    })
    expect(diff).toContain("--- /dev/null\n+++ b/src/new.ts")
    expect(diff).toContain("@@ -0,0 +1,3 @@")
    expect(diff).toContain("+one\n+two\n+three")
  })

  it("renders deletions against /dev/null", () => {
    const diff = createUnifiedFileDiff({
      beforePath: "src/old.ts",
      beforeContent: "one\ntwo\n",
      afterContent: "",
    })
    expect(diff).toContain("--- a/src/old.ts\n+++ /dev/null")
    expect(diff).toContain("-one\n-two")
  })

  it("preserves every file and hunk in a multi-file change", () => {
    const diff = createUnifiedDiff([
      { beforePath: "a.ts", afterPath: "a.ts", beforeContent: "old\n", afterContent: "new\n" },
      { beforePath: "b.ts", afterPath: "b.ts", beforeContent: "before\n", afterContent: "after\n" },
    ])
    expect(diff).toContain("--- a/a.ts")
    expect(diff).toContain("--- a/b.ts")
    expect(diff).toContain("-old\n+new")
    expect(diff).toContain("-before\n+after")
  })

  it("falls back to a complete linear replacement for very large changes", () => {
    const before = Array.from({ length: 1_500 }, (_, index) => `old-${index}`).join("\n")
    const after = Array.from({ length: 1_500 }, (_, index) => `new-${index}`).join("\n")
    const diff = createUnifiedFileDiff({ beforePath: "large.txt", afterPath: "large.txt", beforeContent: before, afterContent: after })
    expect(diff).toContain("-old-1499")
    expect(diff).toContain("+new-1499")
  })
})
