import { afterEach, beforeEach, describe, expect, it } from "bun:test"
import { mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { PermissionStore } from "../src/permission/store.js"
import { CheckpointStore } from "../src/task/checkpoint-store.js"

let stateDir: string

beforeEach(() => {
  stateDir = mkdtempSync(join(tmpdir(), "aurict-persistence-stores-"))
  PermissionStore.clear()
})

afterEach(() => {
  PermissionStore.clear()
  rmSync(stateDir, { recursive: true, force: true })
})

describe("critical persistence stores", () => {
  it("persists permission grants atomically with private permissions", () => {
    const path = join(stateDir, "permissions.json")
    PermissionStore.loadPersisted(path)
    PermissionStore.approve("write", "src/index.ts")
    PermissionStore.savePersisted(path)

    expect(JSON.parse(readFileSync(path, "utf8"))).toEqual({
      version: 1,
      approved: ["write:src/index.ts"],
      approvedDirs: [],
      approvedPrefixes: [],
    })
    if (process.platform !== "win32") expect(statSync(path).mode & 0o777).toBe(0o600)
  })

  it("does not treat malformed permission data as an empty store", () => {
    const path = join(stateDir, "permissions.json")
    writeFileSync(path, "{broken")
    expect(() => PermissionStore.loadPersisted(path)).toThrow("Malformed permission store")
  })

  it("retries checkpoint loading after corruption is repaired", () => {
    const path = join(stateDir, "checkpoints.json")
    const checkpointStore = new CheckpointStore(() => path)
    writeFileSync(path, "{broken")
    expect(() => checkpointStore.readAll("session-a")).toThrow("Malformed checkpoint store")

    writeFileSync(path, "[]\n")
    expect(checkpointStore.readAll("session-a")).toEqual([])
    checkpointStore.create("delivery", "Delivery", ["verify"], "session-a")
    expect(checkpointStore.read("delivery", "session-a")?.steps[0]?.status).toBe("pending")
  })

  it("rejects structurally invalid checkpoint steps", () => {
    const path = join(stateDir, "checkpoints.json")
    const checkpointStore = new CheckpointStore(() => path)
    writeFileSync(path, JSON.stringify([{
      id: "delivery",
      title: "Delivery",
      sessionId: "session-a",
      createdAt: 1,
      updatedAt: 1,
      steps: [{ id: "step-1", label: "verify", status: "unknown" }],
    }]))
    expect(() => checkpointStore.readAll("session-a")).toThrow("Invalid checkpoint store")
  })
})
