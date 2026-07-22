import { createHash } from "node:crypto"
import { readFile } from "node:fs/promises"
import { relative, resolve } from "node:path"

export interface WorkspaceRevision {
  hash: string
  paths: string[]
}

export async function fingerprintWorkspaceRevision(workdir: string, paths: string[]): Promise<WorkspaceRevision> {
  const normalized = [...new Set(paths.map(path => resolve(workdir, path)))].sort()
  const hash = createHash("sha256")
  const relativePaths: string[] = []
  for (const absolutePath of normalized) {
    const label = relative(workdir, absolutePath) || "."
    relativePaths.push(label)
    hash.update(label)
    hash.update("\0")
    try {
      hash.update(await readFile(absolutePath))
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code
      if (code !== "ENOENT" && code !== "EISDIR") throw error
      hash.update(code === "ENOENT" ? "<absent>" : "<directory>")
    }
    hash.update("\0")
  }
  return { hash: hash.digest("hex"), paths: relativePaths }
}
