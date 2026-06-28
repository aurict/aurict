import { createHash } from "node:crypto"
import type { ResolvedPromptSection } from "./prompt-sections.js"

export type PromptCacheChangeKind =
  | "first_observation"
  | "stable"
  | "system_changed"
  | "tools_changed"
  | "model_changed"

export interface PromptCacheHealthSnapshot {
  key: string
  model: string
  sectionHash: string
  cacheableHash: string
  dynamicHash: string
  toolHash: string
  sectionCount: number
  toolCount: number
}

export interface PromptCacheHealthResult {
  kind: PromptCacheChangeKind
  snapshot: PromptCacheHealthSnapshot
  previous?: PromptCacheHealthSnapshot
}

const snapshots = new Map<string, PromptCacheHealthSnapshot>()

export function recordPromptCacheHealth(args: {
  key: string
  model: string
  sections: ResolvedPromptSection[]
  toolIds: string[]
}): PromptCacheHealthResult {
  const snapshot: PromptCacheHealthSnapshot = {
    key: args.key,
    model: args.model,
    sectionHash: hash(args.sections.map(section => [section.name, section.cache, section.content])),
    cacheableHash: hash(args.sections.filter(section => section.cache !== "dynamic").map(section => [section.name, section.content])),
    dynamicHash: hash(args.sections.filter(section => section.cache === "dynamic").map(section => [section.name, section.content])),
    toolHash: hash([...args.toolIds].sort()),
    sectionCount: args.sections.length,
    toolCount: args.toolIds.length,
  }

  const previous = snapshots.get(args.key)
  snapshots.set(args.key, snapshot)

  if (!previous) return { kind: "first_observation", snapshot }
  if (previous.model !== snapshot.model) return { kind: "model_changed", snapshot, previous }
  if (previous.toolHash !== snapshot.toolHash) return { kind: "tools_changed", snapshot, previous }
  if (previous.sectionHash !== snapshot.sectionHash) return { kind: "system_changed", snapshot, previous }
  return { kind: "stable", snapshot, previous }
}

export function clearPromptCacheHealth(key?: string): void {
  if (key) snapshots.delete(key)
  else snapshots.clear()
}

export function promptCacheHealthStats(): { entries: number } {
  return { entries: snapshots.size }
}

function hash(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 16)
}

