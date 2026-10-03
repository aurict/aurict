import * as fs from "node:fs/promises"
import * as path from "node:path"
import { homedir } from "node:os"
import type { Snapshot } from "./types.js"
import { persistHistory, loadPersistedHistory, clearHistoryFile } from "./store.js"
import { restoreSnapshot } from "./rollback.js"

export type { Snapshot } from "./types.js"

const MAX_SNAPSHOT_BYTES = 1_000_000

class SnapshotManager {
  private histories = new Map<string, Snapshot[]>()
  private persistQueue: Promise<void> = Promise.resolve()
  private storageDir: string | null =
    process.env["AURICT_SNAPSHOT_DIR"] ?? path.join(homedir(), ".aurict", "snapshots")

  setStorageDir(dir: string | null): void {
    this.storageDir = dir
    this.histories.clear()
  }

  getStorageDir(): string | null {
    return this.storageDir
  }

  private history(scope = "default"): Snapshot[] {
    const existing = this.histories.get(scope)
    if (existing) return existing
    const created: Snapshot[] = []
    this.histories.set(scope, created)
    return created
  }

  private persist(): Promise<void> {
    this.persistQueue = this.persistQueue.then(async () => {
      const combined = [...this.histories.values()].flat()
      const result = await persistHistory(this.storageDir, combined)
      this.histories.clear()
      for (const snapshot of result.history) this.history(snapshot.scope ?? "default").push(snapshot)
      if (result.disableStorage) this.storageDir = null
    })
    return this.persistQueue
  }

  async loadPersisted(): Promise<number> {
    const loaded = await loadPersistedHistory(this.storageDir)
    this.histories.clear()
    for (const snapshot of loaded) this.history(snapshot.scope ?? "default").push(snapshot)
    return loaded.length
  }

  /**
   * Dosyanın mevcut halini belleğe kopyalar (yedekler).
   * @param filePath Yedeklenecek dosya yolu
   */
  async takeSnapshot(filePath: string, scope = "default"): Promise<void> {
    const absolutePath = path.resolve(filePath)
    try {
      const stat = await fs.stat(absolutePath)
      if (stat.size > MAX_SNAPSHOT_BYTES) {
        console.error(`Snapshot skipped (${filePath}): file is ${stat.size} bytes`)
        return
      }
      const content = await fs.readFile(absolutePath, "utf-8")

      this.history(scope).push({
        id: crypto.randomUUID(),
        filePath: absolutePath,
        originalContent: content,
        existed: true,
        timestamp: Date.now(),
        ...(scope === "default" ? {} : { scope }),
      })
      await this.persist()
    } catch (err) {
      // Dosya henüz yoksa (yeni oluşturuluyorsa) yedeklenecek bir şey yok
      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        this.history(scope).push({
          id: crypto.randomUUID(),
          filePath: absolutePath,
          originalContent: "",
          existed: false,
          timestamp: Date.now(),
          ...(scope === "default" ? {} : { scope }),
        })
        await this.persist()
      } else {
        console.error(`Snapshot failed (${filePath}):`, err)
      }
    }
  }

  /**
   * En son yedeği geri yükler.
   * @returns Geri yüklenen dosyanın yolu veya yapılamadıysa null
   */
  async undoLast(scope?: string): Promise<string | null> {
    let selectedScope = scope ?? "default"
    if (scope === undefined && this.history(selectedScope).length === 0) {
      let newest = -1
      for (const [candidateScope, snapshots] of this.histories) {
        const timestamp = snapshots.at(-1)?.timestamp ?? -1
        if (timestamp > newest) {
          newest = timestamp
          selectedScope = candidateScope
        }
      }
    }
    const last = this.history(selectedScope).pop()
    if (!last) {
      return null
    }

    try {
      await restoreSnapshot(last)
      await this.persist()
      return last.filePath
    } catch (err) {
      console.error(`Restore failed (${last.filePath}):`, err)
      return null
    }
  }

  /** Mevcut history uzunluğunu döner — checkpoint referansı olarak kullanılır */
  mark(scope = "default"): number {
    return this.history(scope).length
  }

  /** Distinct files with a pre-image recorded after `mark` (what a restore would touch). */
  changedFilesSince(mark: number, scope = "default"): string[] {
    return [...new Set(this.history(scope).slice(mark).map((snapshot) => snapshot.filePath))]
  }

  getHistoryLength(scope = "default"): number {
    return this.history(scope).length
  }

  /**
   * mark'tan sonra eklenen tüm snapshot'ları geri yükler.
   * @returns Geri yüklenen dosya yolları
   */
  async restoreToMark(mark: number, scope = "default"): Promise<string[]> {
    const toRestore = this.history(scope).splice(mark)
    const restored: string[] = []
    // Tersine çevir: en son alınan snapshot önce geri yüklenir
    for (const snap of toRestore.reverse()) {
      try {
        await restoreSnapshot(snap)
        restored.push(snap.filePath)
      } catch {
        /* ignore individual restore failures */
      }
    }
    await this.persist()
    return restored
  }

  /**
   * Geçmişi temizler.
   */
  clear(scope?: string): void {
    if (scope !== undefined) {
      this.histories.delete(scope)
      void this.persist()
      return
    }
    this.histories.clear()
    clearHistoryFile(this.storageDir)
  }
}

export const snapshotManager = new SnapshotManager()

/** Snapshot scope for a session's file tools; checkpoints must use the same key. */
export function sessionSnapshotScope(workdir: string, sessionId: string): string {
  return `${workdir}\0${sessionId}`
}
