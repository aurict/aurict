import { describe, it, expect } from "bun:test"
import type { CoreMessage } from "ai"
import { extractErrorChains, addProtectedErrors } from "../src/session/compaction.js"
import { importanceScore } from "../src/session/context-compactor.js"

describe("Error Chain Detection", () => {
  it("detects error→fix chain", () => {
    const messages: CoreMessage[] = [
      { role: "user", content: "Fix the bug" },
      { role: "assistant", content: "Let me check the file" },
      { role: "tool", content: "Error: Cannot find module './foo'" },
      { role: "assistant", content: "I see the error. Let me fix it by updating the import path." },
      { role: "assistant", content: "Fixed the import path. The module is now correctly imported." },
    ]

    const chains = extractErrorChains(messages)
    expect(chains.length).toBe(1)
    expect(chains[0]!.error).toContain("Cannot find module")
    expect(chains[0]!.fix).toContain("Fixed")
  })

  it("detects multiple error chains", () => {
    const messages: CoreMessage[] = [
      { role: "user", content: "Fix bugs" },
      { role: "tool", content: "Error: Cannot find module './foo'" },
      { role: "assistant", content: "Fixed the import." },
      { role: "tool", content: "Error: Type mismatch" },
      { role: "assistant", content: "Resolved the type issue." },
    ]

    const chains = extractErrorChains(messages)
    expect(chains.length).toBe(2)
  })

  it("returns empty array when no errors", () => {
    const messages: CoreMessage[] = [
      { role: "user", content: "Hello" },
      { role: "assistant", content: "Hi there!" },
    ]

    const chains = extractErrorChains(messages)
    expect(chains.length).toBe(0)
  })

  it("does not match error without fix", () => {
    const messages: CoreMessage[] = [
      { role: "user", content: "Check this" },
      { role: "tool", content: "Error: Something went wrong" },
      { role: "assistant", content: "I see the error but haven't fixed it yet." },
    ]

    const chains = extractErrorChains(messages)
    expect(chains.length).toBe(0)
  })

  it("extracts file paths from error", () => {
    const messages: CoreMessage[] = [
      { role: "tool", content: "Error in src/utils.ts: Cannot read property" },
      { role: "assistant", content: "Fixed the issue in src/utils.ts" },
    ]

    const chains = extractErrorChains(messages)
    expect(chains.length).toBe(1)
    expect(chains[0]!.files).toContain("src/utils.ts")
  })
})

describe("addProtectedErrors", () => {
  it("adds error chains to summary", () => {
    const summary = "Session summary here."
    const chains = [
      {
        error: "Cannot find module",
        fix: "Updated import path",
        files: ["src/foo.ts"],
        lesson: "Error 'Cannot find module' was fixed by updating import path",
      },
    ]

    const result = addProtectedErrors(summary, chains)
    expect(result).toContain("[PROTECTED ERROR CHAINS")
    expect(result).toContain("Cannot find module")
  })

  it("returns original summary when no chains", () => {
    const summary = "Session summary."
    const result = addProtectedErrors(summary, [])
    expect(result).toBe(summary)
  })

  it("limits to 5 chains", () => {
    const summary = "Summary."
    const chains = Array.from({ length: 10 }, (_, i) => ({
      error: `Error ${i}`,
      fix: `Fix ${i}`,
      files: [],
      lesson: `Lesson ${i}`,
    }))

    const result = addProtectedErrors(summary, chains)
    // Should only include first 5
    const matches = result.match(/\d+\./g)
    expect(matches!.length).toBeLessThanOrEqual(5)
  })
})

describe("Importance Scoring V2", () => {
  it("gives higher score to error messages", () => {
    const errorMsg: CoreMessage = { role: "tool", content: "Error: Cannot find module './foo'" }
    const normalMsg: CoreMessage = { role: "assistant", content: "Let me help you with that." }
    const allMessages = [normalMsg, errorMsg]

    const errorScore = importanceScore(errorMsg, allMessages, 1)
    const normalScore = importanceScore(normalMsg, allMessages, 0)

    expect(errorScore).toBeGreaterThan(normalScore)
  })

  it("gives higher score to fix messages after errors", () => {
    const errorMsg: CoreMessage = { role: "tool", content: "Error: Type mismatch" }
    const fixMsg: CoreMessage = { role: "assistant", content: "Fixed the type issue by updating the interface." }
    const allMessages = [errorMsg, fixMsg]

    const fixScore = importanceScore(fixMsg, allMessages, 1)
    expect(fixScore).toBeGreaterThan(50) // Base score is 50, fix should boost it
  })

  it("gives higher score to user corrections", () => {
    const correction: CoreMessage = { role: "user", content: "No, that's wrong. Use the other approach." }
    const normalUser: CoreMessage = { role: "user", content: "Thanks for helping." }
    const allMessages = [correction, normalUser]

    const correctionScore = importanceScore(correction, allMessages, 0)
    const normalScore = importanceScore(normalUser, allMessages, 1)

    expect(correctionScore).toBeGreaterThan(normalScore)
  })

  it("gives higher score to decision messages", () => {
    const decision: CoreMessage = { role: "assistant", content: "Let's use Zustand for state management." }
    const normal: CoreMessage = { role: "assistant", content: "I'll check the file." }
    // Her iki mesaj da aynı pozisyonda olsun (recency bonus eşit olsun)
    const allMessages = [normal, decision]

    const decisionScore = importanceScore(decision, allMessages, 1)
    const normalScore = importanceScore(normal, allMessages, 0)

    // Decision +20 bonus almalı
    expect(decisionScore).toBeGreaterThan(normalScore)
  })

  it("boosts score for messages with many file paths", () => {
    const manyPaths: CoreMessage = {
      role: "assistant",
      content: "Check src/foo.ts, src/bar.ts, src/baz.ts, src/qux.ts for the changes.",
    }
    const fewPaths: CoreMessage = {
      role: "assistant",
      content: "Check src/foo.ts for the changes.",
    }
    const allMessages = [manyPaths, fewPaths]

    const manyScore = importanceScore(manyPaths, allMessages, 0)
    const fewScore = importanceScore(fewPaths, allMessages, 1)

    expect(manyScore).toBeGreaterThan(fewScore)
  })

  it("respects recency bonus", () => {
    const oldMsg: CoreMessage = { role: "user", content: "Do something" }
    const recentMsg: CoreMessage = { role: "user", content: "Do something" }
    const allMessages = Array.from({ length: 10 }, () => oldMsg)
    allMessages.push(recentMsg)

    const oldScore = importanceScore(oldMsg, allMessages, 0)
    const recentScore = importanceScore(recentMsg, allMessages, 9)

    expect(recentScore).toBeGreaterThan(oldScore)
  })
})
