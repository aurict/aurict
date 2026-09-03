import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test"
import { mkdtempSync, rmSync } from "node:fs"
import * as realFs from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

const trueRename = realFs.rename.bind(realFs)

let renamePauseAtCall: number | null = null
let renameCallCount = 0
let renameHitResolve: (() => void) | null = null
let renameResumePromise: Promise<void> | null = null

function armRenameGate(atCallIndex: number) {
  renamePauseAtCall = atCallIndex
  renameCallCount = 0
  const hit = new Promise<void>((resolve) => { renameHitResolve = resolve })
  let resumeResolve!: () => void
  renameResumePromise = new Promise<void>((resolve) => { resumeResolve = resolve })
  return { hit, resume: () => resumeResolve() }
}

mock.module("node:fs/promises", () => ({
  ...realFs,
  async rename(...args: Parameters<typeof realFs.rename>) {
    renameCallCount++
    if (renamePauseAtCall !== null && renameCallCount === renamePauseAtCall) {
      renamePauseAtCall = null
      renameHitResolve?.()
      await renameResumePromise
    }
    return trueRename(...args)
  },
}))

const { acquireFileLock, releaseFileLock, getFileLockInfo } = await import("../src/agent/file-lock.js")

let dir: string
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "aurict-file-lock-race-"))
  renamePauseAtCall = null
  renameCallCount = 0
})

afterEach(() => {
  try { rmSync(dir, { recursive: true, force: true }) } catch { /* ignore */ }
})

function target() {
  return join(dir, `f-${Date.now()}-${Math.random().toString(36).slice(2)}.ts`)
}

async function expireImmediately() {
  await new Promise((r) => setTimeout(r, 20))
}

describe("agent/file-lock.ts — race-safe stale reclamation", () => {
  it("iki reclaimer aynı süresi dolmuş lock için yarışır: tek etkili sahip, kaybeden kazananın lock'unu silemez", async () => {
    const f = target()
    await acquireFileLock(dir, f, "agent-0", "s0", 5)
    await expireImmediately()

    const [a, b] = await Promise.all([
      acquireFileLock(dir, f, "agent-A", "sA"),
      acquireFileLock(dir, f, "agent-B", "sB"),
    ])
    expect(a !== b).toBe(true)
    const winner = a ? "agent-A" : "agent-B"
    const loser = a ? "agent-B" : "agent-A"

    const info = await getFileLockInfo(dir, f)
    expect(info?.agentId).toBe(winner)

    const loserReleased = await releaseFileLock(dir, f, loser)
    expect(loserReleased).toBe(false)
    const infoAfter = await getFileLockInfo(dir, f)
    expect(infoAfter?.agentId).toBe(winner)
  })

  it("A stale-recovery ortasındayken B fresh sahiplik kazanırsa, A devam ettiğinde B'nin lock'unu silmez (kritik regresyon)", async () => {
    const f = target()
    await acquireFileLock(dir, f, "agent-0", "s0", 5)
    await expireImmediately()

    const gate = armRenameGate(1)
    const pA = acquireFileLock(dir, f, "agent-A", "sA")
    await gate.hit

    const okB = await acquireFileLock(dir, f, "agent-B", "sB")
    expect(okB).toBe(true)

    gate.resume()
    const okA = await pA
    expect(okA).toBe(false)

    const info = await getFileLockInfo(dir, f)
    expect(info?.agentId).toBe("agent-B")
    expect(info?.sessionId).toBe("sB")
  })

  it("birden fazla stale contender: tek final owner, canonical lock geçerli kalır", async () => {
    const f = target()
    await acquireFileLock(dir, f, "agent-0", "s0", 5)
    await expireImmediately()

    const results = await Promise.all([
      acquireFileLock(dir, f, "agent-A", "sA"),
      acquireFileLock(dir, f, "agent-B", "sB"),
      acquireFileLock(dir, f, "agent-C", "sC"),
    ])
    const winners = results.filter(Boolean)
    expect(winners.length).toBe(1)

    const info = await getFileLockInfo(dir, f)
    expect(info).not.toBeNull()
    expect(info!.expiresAt).toBeGreaterThan(Date.now())
  })

  it("stale recovery sırasında geç gelen bir release, yeni kurulan lock'u silemez", async () => {
    const f = target()
    await acquireFileLock(dir, f, "agent-0", "s0", 5)
    await expireImmediately()

    const okA = await acquireFileLock(dir, f, "agent-A", "sA")
    expect(okA).toBe(true)

    const released = await releaseFileLock(dir, f, "agent-0")
    expect(released).toBe(false)

    const info = await getFileLockInfo(dir, f)
    expect(info?.agentId).toBe("agent-A")

    const releasedByOwner = await releaseFileLock(dir, f, "agent-A")
    expect(releasedByOwner).toBe(true)
  })

  it("mevcut sıralı TTL testi: A kısa TTL ile alır, süresi dolar, B alır", async () => {
    const f = target()
    await acquireFileLock(dir, f, "agent-a", "session-a", 10)
    await new Promise((r) => setTimeout(r, 30))
    const ok = await acquireFileLock(dir, f, "agent-b", "session-b")
    expect(ok).toBe(true)
  })
})
