import * as fs from "node:fs/promises";
import * as path from "node:path";

export interface Snapshot {
  id: string;
  filePath: string;
  originalContent: string;
  timestamp: number;
}

class SnapshotManager {
  private history: Snapshot[] = [];

  /**
   * Dosyanın mevcut halini belleğe kopyalar (yedekler).
   * @param filePath Yedeklenecek dosya yolu
   */
  async takeSnapshot(filePath: string): Promise<void> {
    try {
      const absolutePath = path.resolve(filePath);
      const content = await fs.readFile(absolutePath, "utf-8");
      
      this.history.push({
        id: crypto.randomUUID(),
        filePath: absolutePath,
        originalContent: content,
        timestamp: Date.now(),
      });
    } catch (err) {
      // Dosya henüz yoksa (yeni oluşturuluyorsa) yedeklenecek bir şey yok
      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        this.history.push({
          id: crypto.randomUUID(),
          filePath: path.resolve(filePath),
          originalContent: "", // Boş içerik
          timestamp: Date.now(),
        });
      } else {
        console.error(`Snapshot failed (${filePath}):`, err);
      }
    }
  }

  /**
   * En son yedeği geri yükler.
   * @returns Geri yüklenen dosyanın yolu veya yapılamadıysa null
   */
  async undoLast(): Promise<string | null> {
    const last = this.history.pop();
    if (!last) {
      return null;
    }

    try {
      if (last.originalContent === "") {
        // Önceden dosya yoktu, geri alırken silebiliriz veya boşaltabiliriz.
        await fs.writeFile(last.filePath, "");
      } else {
        await fs.writeFile(last.filePath, last.originalContent, "utf-8");
      }
      return last.filePath;
    } catch (err) {
      console.error(`Restore failed (${last.filePath}):`, err);
      return null;
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
        if (snap.originalContent === "") {
          // Dosya daha önce yoktu — boşalt (silmiyoruz, riskli)
          await import("node:fs/promises").then(({ writeFile }) => writeFile(snap.filePath, ""))
        } else {
          await import("node:fs/promises").then(({ writeFile }) => writeFile(snap.filePath, snap.originalContent, "utf-8"))
        }
        restored.push(snap.filePath)
      } catch {
        /* ignore individual restore failures */
      }
    }
    return restored
  }

  /**
   * Geçmişi temizler.
   */
  clear(): void {
    this.history = [];
  }
}

export const snapshotManager = new SnapshotManager();
