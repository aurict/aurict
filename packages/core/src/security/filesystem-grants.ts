import { lstat, realpath } from "node:fs/promises"
import { dirname, isAbsolute, relative, resolve } from "node:path"
import { resolveWithinWorkspace } from "./path-boundary.js"
import { toPosix } from "../util/paths.js"

export type FilesystemGrantScope = "path" | "directory"

interface FilesystemGrant {
  root: string
  scope: FilesystemGrantScope
}

const grants = new Map<string, FilesystemGrant[]>()

export function isOutsideWorkspace(workdir: string, inputPath: string): boolean {
  return !isWithin(resolve(workdir), resolve(workdir, inputPath))
}

export function grantExternalFilesystemPath(
  workdir: string,
  sessionId: string,
  inputPath: string,
  scope: FilesystemGrantScope,
): void {
  const candidate = resolve(workdir, inputPath)
  if (!isOutsideWorkspace(workdir, inputPath)) return
  assertNotSensitive(candidate)
  const root = scope === "directory" ? dirname(candidate) : candidate
  const key = grantKey(workdir, sessionId)
  const current = grants.get(key) ?? []
  if (!current.some(grant => grant.root === root && grant.scope === scope)) {
    current.push({ root, scope })
    grants.set(key, current)
  }
}

export function hasExternalFilesystemGrant(workdir: string, sessionId: string, inputPath: string): boolean {
  const candidate = resolve(workdir, inputPath)
  return (grants.get(grantKey(workdir, sessionId)) ?? []).some(item =>
    item.scope === "path" ? item.root === candidate : isWithin(item.root, candidate),
  )
}

export async function resolveAuthorizedFilesystemPath(
  workdir: string,
  sessionId: string,
  inputPath: string,
  options: { allowMissing?: boolean } = {},
): Promise<string> {
  if (!isOutsideWorkspace(workdir, inputPath)) {
    return resolveWithinWorkspace(workdir, inputPath, options)
  }

  const candidate = resolve(workdir, inputPath)
  assertNotSensitive(candidate)
  const grant = (grants.get(grantKey(workdir, sessionId)) ?? []).find(item =>
    item.scope === "path" ? item.root === candidate : isWithin(item.root, candidate),
  )
  if (!grant) throw new Error(`Path is outside the working directory and has no user-approved filesystem grant: ${inputPath}`)

  const existing = options.allowMissing ? await nearestExisting(candidate) : candidate
  const existingReal = await realpath(existing)
  const grantRoot = grant.scope === "path" ? dirname(grant.root) : grant.root
  const rootReal = await realpath(await nearestExisting(grantRoot))
  if (!isWithin(rootReal, existingReal)) {
    throw new Error(`Path traverses a symlink outside the user-approved filesystem grant: ${inputPath}`)
  }
  return candidate
}

export function clearFilesystemGrants(workdir?: string, sessionId?: string): void {
  if (workdir !== undefined && sessionId !== undefined) grants.delete(grantKey(workdir, sessionId))
  else grants.clear()
}

function grantKey(workdir: string, sessionId: string): string {
  return `${resolve(workdir)}\0${sessionId}`
}

function isWithin(root: string, candidate: string): boolean {
  const value = relative(root, candidate)
  return value === "" || (!value.startsWith("..") && !isAbsolute(value))
}

async function nearestExisting(path: string): Promise<string> {
  let current = path
  while (true) {
    try {
      await lstat(current)
      return current
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error
      const parent = dirname(current)
      if (parent === current) throw error
      current = parent
    }
  }
}

function assertNotSensitive(path: string): void {
  if (/\/(?:\.ssh|\.gnupg|\.aws|\.kube|\.azure)(?:\/|$)|\/(?:etc\/(?:shadow|gshadow)|proc|dev|sys|boot)(?:\/|$)/.test(toPosix(path))) {
    throw new Error(`Sensitive filesystem path cannot be granted: ${path}`)
  }
}
