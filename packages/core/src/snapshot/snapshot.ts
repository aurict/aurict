import * as fs from "node:fs/promises"
import * as path from "node:path"
import { homedir } from "node:os"
import { rmSync } from "node:fs"

export interface Snapshot {
  id: string
  filePath: string
  originalContent: string
  existed: boolean
  timestamp: number
}

class SnapshotManager {
  private history: Snapshot[] = []
  private storageDir: string | null =
    process.env["AURICT_SNAPSHOT_DIR"] ?? path.join(homedir(), ".aurict", "snapshots")

  setStorageDir(dir: string | null): void {
    this.storageDir = dir
    this.history = []
  }

  getStorageDir(): string | null {
    return this.storageDir
  }

  private getHistoryFile(): string | null {
    return this.storageDir ? path.join(this.storageDir, "history.json") : null
  }

  private async persistHistory(): Promise<void> {
    const historyFile = this.getHistoryFile()
    if (!historyFile) return

    try {
      await fs.mkdir(path.dirname(historyFile), { recursive: true })
      await fs.writeFile(historyFile, JSON.stringify(this.history, null, 2), "utf-8")
    } catch (err) {
      console.error("Snapshot history persistence failed:", err)
    }
  }

  async loadPersisted(): Promise<number> {
    const historyFile = this.getHistoryFile()
    if (!historyFile) return 0

    try {
      const raw = await fs.readFile(historyFile, "utf-8")
      const parsed = JSON.parse(raw) as Snapshot[]
      this.history = Array.isArray(parsed)
        ? parsed.map((snap) => ({
          ...snap,
          existed: snap.existed ?? snap.originalContent !== "",
        }))
        : []
      return this.history.length
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
        console.error("Snapshot history load failed:", err)
      }
      return 0
    }
  }

  /**
   * Dosyanın mevcut halini belleğe kopyalar (yedekler).
   * @param filePath Yedeklenecek dosya yolu
   */
  async takeSnapshot(filePath: string): Promise<void> {
    const absolutePath = path.resolve(filePath)
    try {
      const content = await fs.readFile(absolutePath, "utf-8")
      
      this.history.push({
        id: crypto.randomUUID(),
        filePath: absolutePath,
        originalContent: content,
        existed: true,
        timestamp: Date.now(),
      })
      await this.persistHistory()
    } catch (err) {
      // Dosya henüz yoksa (yeni oluşturuluyorsa) yedeklenecek bir şey yok
      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        this.history.push({
          id: crypto.randomUUID(),
          filePath: absolutePath,
          originalContent: "",
          existed: false,
          timestamp: Date.now(),
        })
        await this.persistHistory()
      } else {
        console.error(`Snapshot failed (${filePath}):`, err)
      }
    }
  }

  private async restoreSnapshot(snap: Snapshot): Promise<void> {
    if (!snap.existed) {
      try {
        await fs.unlink(snap.filePath)
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err
      }
      return
    }

    await fs.mkdir(path.dirname(snap.filePath), { recursive: true })
    await fs.writeFile(snap.filePath, snap.originalContent, "utf-8")
  }

  /**
   * En son yedeği geri yükler.
   * @returns Geri yüklenen dosyanın yolu veya yapılamadıysa null
   */
  async undoLast(): Promise<string | null> {
    const last = this.history.pop()
    if (!last) {
      return null
    }

    try {
      await this.restoreSnapshot(last)
      await this.persistHistory()
      return last.filePath
    } catch (err) {
      console.error(`Restore failed (${last.filePath}):`, err)
      return null
    }
  }

  /** Mevcut history uzunluğunu döner — checkpoint referansı olarak kullanılır */
  mark(): number {
    return this.history.length
  }

  getHistoryLength(): number {
    return this.history.length
  }

  /**
   * mark'tan sonra eklenen tüm snapshot'ları geri yükler.
   * @returns Geri yüklenen dosya yolları
   */
  async restoreToMark(mark: number): Promise<string[]> {
    const toRestore = this.history.splice(mark)
    const restored: string[] = []
    // Tersine çevir: en son alınan snapshot önce geri yüklenir
    for (const snap of toRestore.reverse()) {
      try {
        await this.restoreSnapshot(snap)
        restored.push(snap.filePath)
      } catch {
        /* ignore individual restore failures */
      }
    }
    await this.persistHistory()
    return restored
  }

  /**
   * Geçmişi temizler.
   */
  clear(): void {
    this.history = []
    const historyFile = this.getHistoryFile()
    if (historyFile) rmSync(historyFile, { force: true })
  }
}

export const snapshotManager = new SnapshotManager()
