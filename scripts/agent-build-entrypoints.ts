import { existsSync } from "node:fs"
import { join } from "node:path"

const WORKER_BUNDLE_SENTINEL = new TextEncoder().encode(
  "Subagent completed its tool work without a textual summary.",
)
const BLAST_RADIUS_WORKER_SENTINEL = new TextEncoder().encode(
  "Too many TypeScript source files",
)

export function agentWorkerEntrypoint(root: string): string {
  return join(root, "packages", "core", "src", "agent", "worker.ts")
}

export function blastRadiusWorkerEntrypoint(root: string): string {
  return join(root, "packages", "core", "src", "tool", "built-in", "blast-radius-worker.ts")
}

export function cliBuildEntrypoints(root: string): string[] {
  return [
    join(root, "packages", "cli", "src", "index.ts"),
    agentWorkerEntrypoint(root),
    blastRadiusWorkerEntrypoint(root),
  ]
}

export function desktopSidecarBuildEntrypoints(root: string): string[] {
  return [
    join(root, "apps", "desktop", "src", "sidecar-entry.ts"),
    agentWorkerEntrypoint(root),
    blastRadiusWorkerEntrypoint(root),
  ]
}

export async function verifyAgentWorkerBundled(output: string): Promise<void> {
  if (!existsSync(output)) throw new Error(`Compiled output is missing: ${output}`)
  const bytes = new Uint8Array(await Bun.file(output).arrayBuffer())
  if (!containsBytes(bytes, WORKER_BUNDLE_SENTINEL)) {
    throw new Error(`Compiled output does not contain the agent worker entrypoint: ${output}`)
  }
}

export async function verifyBlastRadiusWorkerBundled(output: string): Promise<void> {
  if (!existsSync(output)) throw new Error(`Compiled output is missing: ${output}`)
  const bytes = new Uint8Array(await Bun.file(output).arrayBuffer())
  if (!containsBytes(bytes, BLAST_RADIUS_WORKER_SENTINEL)) {
    throw new Error(`Compiled output does not contain the blast-radius worker entrypoint: ${output}`)
  }
}

function containsBytes(haystack: Uint8Array, needle: Uint8Array): boolean {
  let offset = haystack.indexOf(needle[0]!)
  while (offset !== -1) {
    let matches = true
    for (let index = 1; index < needle.length; index++) {
      if (haystack[offset + index] !== needle[index]) {
        matches = false
        break
      }
    }
    if (matches) return true
    offset = haystack.indexOf(needle[0]!, offset + 1)
  }
  return false
}
