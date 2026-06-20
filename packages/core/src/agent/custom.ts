import { join } from "path"
import { readdirSync, readFileSync, existsSync } from "fs"
import { parseFrontmatter } from "../skill/frontmatter.js"

export interface CustomAgentDef {
  id:           string    // dosya adı (uzantısız)
  name:         string
  description:  string
  tools:        string[]
  model?:       string
  provider?:    string
  system:       string    // markdown body = system prompt
}

const cache = new Map<string, CustomAgentDef[]>()

export function loadCustomAgents(workdir: string): CustomAgentDef[] {
  if (cache.has(workdir)) return cache.get(workdir)!

  const agentsDir = join(workdir, ".aurict", "agents")
  if (!existsSync(agentsDir)) { cache.set(workdir, []); return [] }

  const defs: CustomAgentDef[] = []

  let names: string[]
  try { names = readdirSync(agentsDir) as unknown as string[] }
  catch { cache.set(workdir, []); return [] }

  for (const file of names) {
    if (!file.endsWith(".md")) continue
    try {
      const raw         = readFileSync(join(agentsDir, file), "utf8")
      const { meta: rawMeta, body } = parseFrontmatter(raw)
      const meta = rawMeta as unknown as Record<string, unknown>

      const def: CustomAgentDef = {
        id:          file.replace(/\.md$/, ""),
        name:        (meta["name"] as string | undefined) || file.replace(/\.md$/, ""),
        description: (meta["description"] as string | undefined) || "",
        tools:       (meta["tools"] as string[] | undefined) || ["read", "glob", "grep"],
        system:      body,
        ...(meta["model"]    !== undefined ? { model:    meta["model"]    as string } : {}),
        ...(meta["provider"] !== undefined ? { provider: meta["provider"] as string } : {}),
      }
      defs.push(def)
    } catch { /* geçersiz dosya, atla */ }
  }

  cache.set(workdir, defs)
  return defs
}

export function getCustomAgent(workdir: string, id: string): CustomAgentDef | undefined {
  return loadCustomAgents(workdir).find((a) => a.id === id)
}

export function clearCustomAgentCache(): void { cache.clear() }
