import { mkdir, readFile, unlink, writeFile } from "node:fs/promises"
import { dirname, relative, resolve } from "node:path"
import { fingerprintWorkspaceRevision } from "./workspace-revision.js"

export type WorkspaceTransactionStatus = "open" | "committed" | "rolled_back" | "rollback_conflict"

export interface WorkspaceTransactionRecord {
  id: string
  status: WorkspaceTransactionStatus
  paths: string[]
  baseRevision: string
  resultRevision?: string
  rollbackRevision?: string
}

interface CapturedFile {
  absolutePath: string
  existed: boolean
  content: Uint8Array
}

export class WorkspaceTransaction {
  private resultRevision?: string

  private constructor(
    readonly id: string,
    private readonly workdir: string,
    private readonly files: CapturedFile[],
    readonly baseRevision: string,
  ) {}

  static async begin(workdir: string, paths: string[]): Promise<WorkspaceTransaction | null> {
    const absolutePaths = [...new Set(paths.map(path => resolve(workdir, path)))]
    if (absolutePaths.length === 0) return null
    const files: CapturedFile[] = []
    for (const absolutePath of absolutePaths) {
      try {
        files.push({ absolutePath, existed: true, content: await readFile(absolutePath) })
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error
        files.push({ absolutePath, existed: false, content: new Uint8Array() })
      }
    }
    const revision = await fingerprintWorkspaceRevision(workdir, absolutePaths)
    return new WorkspaceTransaction(crypto.randomUUID(), workdir, files, revision.hash)
  }

  async commit(): Promise<WorkspaceTransactionRecord> {
    const revision = await fingerprintWorkspaceRevision(this.workdir, this.files.map(file => file.absolutePath))
    this.resultRevision = revision.hash
    return this.record("committed")
  }

  async rollback(): Promise<WorkspaceTransactionRecord> {
    if (!this.resultRevision) await this.commit()
    const current = await fingerprintWorkspaceRevision(this.workdir, this.files.map(file => file.absolutePath))
    if (current.hash !== this.resultRevision) return this.record("rollback_conflict")
    for (const file of this.files) {
      if (file.existed) {
        await mkdir(dirname(file.absolutePath), { recursive: true })
        await writeFile(file.absolutePath, file.content)
      } else {
        try {
          await unlink(file.absolutePath)
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error
        }
      }
    }
    const restored = await fingerprintWorkspaceRevision(this.workdir, this.files.map(file => file.absolutePath))
    return { ...this.record("rolled_back"), rollbackRevision: restored.hash }
  }

  private record(status: WorkspaceTransactionStatus): WorkspaceTransactionRecord {
    return {
      id: this.id,
      status,
      paths: this.files.map(file => relative(this.workdir, file.absolutePath)),
      baseRevision: this.baseRevision,
      ...(this.resultRevision ? { resultRevision: this.resultRevision } : {}),
    }
  }
}

export function mutationPathsForTool(toolId: string, args: Record<string, unknown>): string[] {
  if (["write", "edit", "notebook_edit"].includes(toolId)) {
    const path = String(args["path"] ?? "")
    return path ? [path] : []
  }
  if (toolId !== "apply_patch") return []
  const patch = String(args["patchText"] ?? args["patch"] ?? "")
  const paths: string[] = []
  for (const match of patch.matchAll(/^\*\*\* (?:Add|Update|Delete) File: (.+)$/gm)) paths.push(match[1]!.trim())
  for (const match of patch.matchAll(/^\*\*\* Move to: (.+)$/gm)) paths.push(match[1]!.trim())
  return [...new Set(paths)]
}
