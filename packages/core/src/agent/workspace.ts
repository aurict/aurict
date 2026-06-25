import { mkdirSync, existsSync } from "fs"
import { join } from "path"

/**
 * Multi-agent shared workspace.
 *
 * Her parent session için bir dizin açılır.
 * Aynı session'dan spawn edilen tüm subagentlar bu dizini okuyup yazabilir.
 *
 * Dizin: {workdir}/.aurict/sessions/{parentId}/workspace/
 */

export function getWorkspaceDir(workdir: string, parentSessionId: string): string {
  // İlk 8 karakter — kısa ama yeterince benzersiz
  return join(workdir, ".aurict", "sessions", parentSessionId.slice(0, 8), "workspace")
}

export function ensureWorkspace(workdir: string, parentSessionId: string): string {
  const dir = getWorkspaceDir(workdir, parentSessionId)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  return dir
}

/**
 * Workspace'deki tüm findings dosyalarını okur ve birleştirir.
 * Legacy — artık subagent tool results doğrudan XML olarak döner, dosya okumaya gerek yok.
 */
export async function readWorkspaceFindings(
  workdir:         string,
  parentSessionId: string,
): Promise<{ agentType: string; content: string }[]> {
  const dir = getWorkspaceDir(workdir, parentSessionId)
  try {
    const { readdir, readFile } = await import("node:fs/promises")
    const files = await readdir(dir).catch(() => [] as string[])
    const mdFiles = files.filter(f => f.endsWith(".md"))
    return Promise.all(
      mdFiles.map(async (f) => ({
        agentType: f.replace(/\.md$/, ""),
        content:   (await readFile(join(dir, f), "utf8")).trim(),
      }))
    )
  } catch {
    return []
  }
}

