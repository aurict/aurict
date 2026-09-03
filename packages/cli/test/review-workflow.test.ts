import { afterEach, describe, expect, it } from "bun:test"
import { execFileSync } from "node:child_process"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { buildReviewManifest, buildReviewPatch, buildReviewPatchChunks } from "../src/review/manifest.js"
import { parseReviewReport } from "../src/review/report.js"
import { cancelReview, runReview } from "../src/review/runner.js"
import { listReviewSessions, readReviewSession, recoverInterruptedReviewSessions, writeReviewSession } from "../src/review/store.js"
import type { ReviewSession } from "../src/review/types.js"

const roots: string[] = []

function repository(): string {
  const root = mkdtempSync(join(tmpdir(), "aurict-review-"))
  roots.push(root)
  execFileSync("git", ["init", "-q", root])
  execFileSync("git", ["-C", root, "config", "user.email", "review@example.test"])
  execFileSync("git", ["-C", root, "config", "user.name", "Review Test"])
  writeFileSync(join(root, "app.ts"), "export const value = 1\n", "utf8")
  execFileSync("git", ["-C", root, "add", "app.ts"])
  execFileSync("git", ["-C", root, "commit", "-qm", "initial"])
  return root
}

afterEach(() => {
  while (roots.length > 0) rmSync(roots.pop()!, { recursive: true, force: true })
})

describe("deterministic review workflow", () => {
  it("manifests tracked and untracked workspace changes with exact hunks", () => {
    const root = repository()
    writeFileSync(join(root, "app.ts"), "export const value = 2\n", "utf8")
    writeFileSync(join(root, "new.ts"), "export const fresh = true\n", "utf8")
    const manifest = buildReviewManifest(root, { kind: "workspace" })
    expect(manifest.files.map((file) => file.path)).toEqual(["app.ts", "new.ts"])
    expect(manifest.files[0]?.hunks[0]).toMatchObject({ newStart: 1, newLines: 1 })
    expect(manifest.files[1]?.untracked).toBe(true)
    expect(buildReviewPatch(manifest)).toContain("+++ b/new.ts")
  })

  it("supports a single-commit scope without treating option text as a path", () => {
    const root = repository()
    writeFileSync(join(root, "app.ts"), "export const value = 3\n", "utf8")
    execFileSync("git", ["-C", root, "add", "app.ts"])
    execFileSync("git", ["-C", root, "commit", "-qm", "change value"])
    const manifest = buildReviewManifest(root, { kind: "commit", ref: "HEAD" })
    expect(manifest.files.map((file) => file.path)).toEqual(["app.ts"])
    expect(buildReviewPatch(manifest)).toContain("export const value = 3")
  })

  it("keeps unusual git paths intact and detects stale workspace scopes", () => {
    if (process.platform === "win32") return
    const root = repository()
    const unusual = "space\tname.ts"
    writeFileSync(join(root, unusual), "export const unusual = true\n", "utf8")
    const manifest = buildReviewManifest(root, { kind: "workspace" })
    expect(manifest.files.some((file) => file.path === unusual)).toBe(true)
    expect(buildReviewPatch(manifest)).toContain("unusual")
    writeFileSync(join(root, unusual), "export const unusual = false\n", "utf8")
    expect(() => buildReviewPatch(manifest)).toThrow("stale")
  })

  it("represents deletions and binary files without inventing changed lines", () => {
    const root = repository()
    rmSync(join(root, "app.ts"))
    writeFileSync(join(root, "asset.bin"), Buffer.from([0, 1, 2, 3]))
    const manifest = buildReviewManifest(root, { kind: "workspace" })
    expect(manifest.files.find((file) => file.path === "app.ts")?.hunks.every((hunk) => hunk.newLines === 0)).toBe(true)
    expect(manifest.files.find((file) => file.path === "asset.bin")?.binary).toBe(true)
    expect(buildReviewPatch(manifest)).toContain("Binary files")
  })

  it("splits multi-file reviews deterministically without truncating a file", () => {
    const root = repository()
    writeFileSync(join(root, "one.ts"), `export const one = "${"a".repeat(120)}"\n`, "utf8")
    writeFileSync(join(root, "two.ts"), `export const two = "${"b".repeat(120)}"\n`, "utf8")
    const manifest = buildReviewManifest(root, { kind: "workspace" })
    const chunks = buildReviewPatchChunks(manifest, 300)
    expect(chunks).toHaveLength(2)
    expect(chunks.join("\n")).toContain("one.ts")
    expect(chunks.join("\n")).toContain("two.ts")
  })

  it("accepts only structured findings anchored to manifest changes", () => {
    const root = repository()
    writeFileSync(join(root, "app.ts"), "export const value = 2\n", "utf8")
    const manifest = buildReviewManifest(root, { kind: "workspace" })
    const report = parseReviewReport(JSON.stringify({ summary: "one issue", findings: [{
      severity: "high", file: "app.ts", line: 1, title: "Changed contract",
      detail: "The exported value changed without its consumer.", suggestion: "Update the consumer.", confidence: "high",
    }] }), manifest)
    expect(report.findings).toHaveLength(1)
    expect(report.findings[0]?.id).toHaveLength(12)
    expect(() => parseReviewReport(JSON.stringify({ summary: "bad", findings: [{
      severity: "high", file: "app.ts", line: 99, title: "Drifted line",
      detail: "Not on a changed line.", suggestion: "Do not report it.", confidence: "high",
    }] }), manifest)).toThrow("changed hunk")
  })

  it("persists review sessions atomically and lists them newest first", () => {
    const root = repository()
    writeFileSync(join(root, "app.ts"), "export const value = 2\n", "utf8")
    const manifest = buildReviewManifest(root, { kind: "workspace" })
    const session: ReviewSession = {
      version: 1, id: "review-test-123", status: "completed", manifest,
      provider: "test", model: "test", startedAt: "2026-08-07T00:00:00.000Z",
      completedAt: "2026-08-07T00:00:01.000Z", report: { summary: "clean", findings: [] },
    }
    writeReviewSession(session)
    expect(readReviewSession(root, session.id)).toEqual(session)
    expect(listReviewSessions(root).map((entry) => entry.id)).toEqual([session.id])
  })

  it("recovers interrupted sessions and rejects shallow-but-invalid session data", () => {
    const root = repository()
    writeFileSync(join(root, "app.ts"), "export const value = 2\n", "utf8")
    const manifest = buildReviewManifest(root, { kind: "workspace" })
    const session: ReviewSession = {
      version: 1, id: "review-running-123", status: "running", manifest,
      provider: "test", model: "test", startedAt: "2026-08-07T00:00:00.000Z",
    }
    writeReviewSession(session)
    expect(recoverInterruptedReviewSessions(root)).toBe(1)
    expect(readReviewSession(root, session.id).status).toBe("interrupted")

    const directory = join(root, ".aurict", "reviews")
    mkdirSync(directory, { recursive: true })
    writeFileSync(join(directory, "review-invalid-123.json"), JSON.stringify({ version: 1, id: "review-invalid-123", status: "completed", manifest }))
    expect(() => readReviewSession(root, "review-invalid-123")).toThrow("Invalid review session")
  })

  it("runs the read-only review path and persists validated model output", async () => {
    const root = repository()
    writeFileSync(join(root, "app.ts"), "export const value = 2\n", "utf8")
    let capturedTools: string[] | undefined
    const session = await runReview({
      workdir: root, mode: { kind: "workspace" }, provider: "test", model: "test",
      executeAgent: async (options) => {
        capturedTools = options.toolsOverride
        return { text: JSON.stringify({ summary: "clean", findings: [] }) }
      },
    })
    expect(capturedTools).toEqual(["read", "glob", "grep", "lsp"])
    expect(session.status).toBe("completed")
    expect(readReviewSession(root, session.id).report?.summary).toBe("clean")
  })

  it("cancels an active review and persists its terminal status", async () => {
    const root = repository()
    writeFileSync(join(root, "app.ts"), "export const value = 2\n", "utf8")
    let id = ""
    const review = runReview({
      workdir: root, mode: { kind: "workspace" }, provider: "test", model: "test",
      onStarted: (session) => {
        id = session.id
        expect(cancelReview(session.id)).toBe(true)
      },
      executeAgent: async (options) => {
        if (options.signal?.aborted) throw options.signal.reason
        return await new Promise<{ text: string }>((_resolve, reject) => {
          options.signal?.addEventListener("abort", () => reject(options.signal?.reason), { once: true })
        })
      },
    })
    await expect(review).rejects.toThrow("cancelled")
    expect(readReviewSession(root, id).status).toBe("cancelled")
  })

  it("times out stalled review workers and persists the failure", async () => {
    const root = repository()
    writeFileSync(join(root, "app.ts"), "export const value = 2\n", "utf8")
    let id = ""
    const review = runReview({
      workdir: root, mode: { kind: "workspace" }, provider: "test", model: "test", timeoutMs: 5,
      onStarted: (session) => { id = session.id },
      executeAgent: async (options) => await new Promise<{ text: string }>((_resolve, reject) => {
        options.signal?.addEventListener("abort", () => reject(options.signal?.reason), { once: true })
      }),
    })
    await expect(review).rejects.toThrow("timed out")
    const stored = readReviewSession(root, id)
    expect(stored.status).toBe("failed")
    expect(stored.error).toContain("timed out")
  })
})
