import { basename, normalize } from "node:path"
import { resolveWithinWorkspace } from "../security/path-boundary.js"
import type { PermissionRequest } from "./types.js"

const AUTO_FILE_TOOLS = new Set(["write", "edit", "apply_patch"])
const SENSITIVE_NAMES = new Set([
  ".netrc",
  ".npmrc",
  ".pypirc",
  "credentials",
  "id_dsa",
  "id_ecdsa",
  "id_ed25519",
  "id_rsa",
])
const SENSITIVE_EXTENSIONS = new Set([
  ".jks",
  ".key",
  ".keystore",
  ".p12",
  ".pem",
  ".pfx",
])
const MAX_AUTO_FILES = 100
const MAX_AUTO_DELETES = 10

export interface ProjectAutoVerdict {
  allow: boolean
  reason: string
}

function requestPaths(request: PermissionRequest): string[] {
  if (request.files?.length) {
    return [...new Set(request.files.flatMap(file =>
      file.action === "move" && file.targetPath
        ? [file.path, file.targetPath]
        : [file.path],
    ))]
  }
  return request.pattern.trim() ? [request.pattern] : []
}

function pathSegments(path: string): string[] {
  return normalize(path).replace(/\\/g, "/").split("/").filter(Boolean).map(segment => segment.toLowerCase())
}

function sensitivePathReason(path: string): string | null {
  const segments = pathSegments(path)
  if (segments.includes(".git") || segments.includes(".aurict")) {
    return "Aurict and Git internal paths require direct approval"
  }

  const name = basename(path).toLowerCase()
  if (name === ".env" || name.startsWith(".env.")) {
    return "environment files may contain secrets"
  }
  if (SENSITIVE_NAMES.has(name) || name.includes("credential") || name.includes("secret")) {
    return "credential and secret files require direct approval"
  }
  const extension = name.includes(".") ? name.slice(name.lastIndexOf(".")) : ""
  if (SENSITIVE_EXTENSIONS.has(extension)) {
    return "key and certificate files require direct approval"
  }
  return null
}

/**
 * Determines whether an interactive permission request can be answered by
 * Project Auto. This is intentionally limited to typed file tools: shell and
 * unknown/custom tools always remain behind their normal permission prompt.
 */
export async function evaluateProjectAutoRequest(
  request: PermissionRequest,
  workdir: string,
): Promise<ProjectAutoVerdict> {
  if (!AUTO_FILE_TOOLS.has(request.tool)) {
    return { allow: false, reason: "only typed file mutations are eligible" }
  }
  if (request.level === "danger") {
    return { allow: false, reason: "dangerous operations require direct approval" }
  }

  const paths = requestPaths(request)
  if (paths.length === 0) {
    return { allow: false, reason: "the affected path set is unknown" }
  }
  if (paths.length > MAX_AUTO_FILES || (request.diff?.fileCount ?? paths.length) > MAX_AUTO_FILES) {
    return { allow: false, reason: `more than ${MAX_AUTO_FILES} files are affected` }
  }
  const deleteCount = request.files?.filter(file => file.action === "delete").length ?? 0
  if (deleteCount > MAX_AUTO_DELETES) {
    return { allow: false, reason: `more than ${MAX_AUTO_DELETES} files would be deleted` }
  }

  for (const path of paths) {
    const sensitiveReason = sensitivePathReason(path)
    if (sensitiveReason) return { allow: false, reason: sensitiveReason }
    try {
      await resolveWithinWorkspace(workdir, path, { allowMissing: true })
    } catch (error) {
      return {
        allow: false,
        reason: error instanceof Error ? error.message : String(error),
      }
    }
  }

  return { allow: true, reason: "typed file mutation is contained by the project boundary" }
}
