import { afterEach, describe, expect, it } from "bun:test"
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { WorkspaceTransaction } from "../src/transaction/workspace-transaction.js"
import { fingerprintWorkspaceRevision } from "../src/transaction/workspace-revision.js"

const dirs: string[] = []

afterEach(async () => {
  await Promise.all(dirs.splice(0).map(dir => rm(dir, { recursive: true, force: true })))
})

describe("workspace transactions", () => {
  it("commits a revision and safely restores its own result", async () => {
    const dir = await mkdtemp(join(tmpdir(), "aurict-tx-"))
    dirs.push(dir)
    await writeFile(join(dir, "a.txt"), "before")
    const transaction = await WorkspaceTransaction.begin(dir, ["a.txt"])
    expect(transaction).not.toBeNull()
    await writeFile(join(dir, "a.txt"), "after")
    const committed = await transaction!.commit()
    expect(committed.baseRevision).not.toBe(committed.resultRevision)
    const rolledBack = await transaction!.rollback()
    expect(rolledBack.status).toBe("rolled_back")
    expect(await readFile(join(dir, "a.txt"), "utf8")).toBe("before")
  })

  it("refuses rollback after a concurrent change", async () => {
    const dir = await mkdtemp(join(tmpdir(), "aurict-tx-"))
    dirs.push(dir)
    await writeFile(join(dir, "a.txt"), "before")
    const transaction = await WorkspaceTransaction.begin(dir, ["a.txt"])
    await writeFile(join(dir, "a.txt"), "tool result")
    await transaction!.commit()
    await writeFile(join(dir, "a.txt"), "user result")
    const rollback = await transaction!.rollback()
    expect(rollback.status).toBe("rollback_conflict")
    expect(await readFile(join(dir, "a.txt"), "utf8")).toBe("user result")
  })

  it("changes the revision when selected file content changes", async () => {
    const dir = await mkdtemp(join(tmpdir(), "aurict-rev-"))
    dirs.push(dir)
    await writeFile(join(dir, "a.txt"), "one")
    const before = await fingerprintWorkspaceRevision(dir, ["a.txt"])
    await writeFile(join(dir, "a.txt"), "two")
    const after = await fingerprintWorkspaceRevision(dir, ["a.txt"])
    expect(after.hash).not.toBe(before.hash)
  })
})
