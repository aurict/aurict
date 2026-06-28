export type PromptSectionCache = "static" | "session" | "dynamic"

export interface PromptSection {
  name: string
  cache: PromptSectionCache
  compute: () => string | null | Promise<string | null>
}

export interface ResolvedPromptSection {
  name: string
  cache: PromptSectionCache
  content: string
}

export interface PromptSectionCacheSplit {
  cacheable: string
  dynamic: string
}

const sectionCache = new Map<string, string | null>()

export function promptSection(
  name: string,
  cache: PromptSectionCache,
  compute: PromptSection["compute"],
): PromptSection {
  return { name, cache, compute }
}

export function staticPromptSection(
  name: string,
  compute: PromptSection["compute"],
): PromptSection {
  return promptSection(name, "static", compute)
}

export function sessionPromptSection(
  name: string,
  compute: PromptSection["compute"],
): PromptSection {
  return promptSection(name, "session", compute)
}

export function dynamicPromptSection(
  name: string,
  compute: PromptSection["compute"],
): PromptSection {
  return promptSection(name, "dynamic", compute)
}

export async function resolvePromptSections(
  sections: PromptSection[],
  cacheKey = "default",
): Promise<ResolvedPromptSection[]> {
  const resolved = await Promise.all(sections.map(section => resolveSection(section, cacheKey)))
  return resolved.filter((section): section is ResolvedPromptSection => section !== null)
}

export function joinPromptSections(sections: ResolvedPromptSection[]): string {
  return sections
    .map(section => section.content)
    .filter(Boolean)
    .join("\n\n")
    .trim()
}

export function splitPromptSectionsByCache(
  sections: ResolvedPromptSection[],
): PromptSectionCacheSplit {
  return {
    cacheable: joinPromptSections(sections.filter(section => section.cache !== "dynamic")),
    dynamic:   joinPromptSections(sections.filter(section => section.cache === "dynamic")),
  }
}

export function clearPromptSectionCache(options: {
  cache?: Exclude<PromptSectionCache, "dynamic">
  cacheKey?: string
  name?: string
} = {}): void {
  const { cache, cacheKey, name } = options
  if (!cache && !cacheKey && !name) {
    sectionCache.clear()
    return
  }

  for (const key of sectionCache.keys()) {
    const [entryCache, entryCacheKey, entryName] = splitCacheKey(key)
    if (cache && entryCache !== cache) continue
    if (cacheKey && entryCacheKey !== cacheKey) continue
    if (name && entryName !== name) continue
    sectionCache.delete(key)
  }
}

export function promptSectionCacheStats(): { entries: number } {
  return { entries: sectionCache.size }
}

async function resolveSection(
  section: PromptSection,
  cacheKey: string,
): Promise<ResolvedPromptSection | null> {
  if (section.cache === "dynamic") {
    return toResolved(section, await section.compute())
  }

  const key = makeCacheKey(section.cache, cacheKey, section.name)
  if (sectionCache.has(key)) {
    return toResolved(section, sectionCache.get(key) ?? null)
  }

  const content = await section.compute()
  sectionCache.set(key, content)
  return toResolved(section, content)
}

function toResolved(
  section: PromptSection,
  content: string | null,
): ResolvedPromptSection | null {
  const trimmed = content?.trim()
  if (!trimmed) return null
  return { name: section.name, cache: section.cache, content: trimmed }
}

function makeCacheKey(
  cache: Exclude<PromptSectionCache, "dynamic">,
  cacheKey: string,
  name: string,
): string {
  return `${cache}\0${cacheKey}\0${name}`
}

function splitCacheKey(key: string): [PromptSectionCache, string, string] {
  const [cache, cacheKey, ...nameParts] = key.split("\0")
  return [
    cache === "static" ? "static" : "session",
    cacheKey ?? "",
    nameParts.join("\0"),
  ]
}
