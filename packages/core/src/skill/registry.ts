import { readdirSync, readFileSync, statSync } from "fs"
import { join } from "path"
import { homedir } from "os"
import { parseFrontmatter } from "./frontmatter.js"
import type { SkillDef, SkillDetector } from "./types.js"

const USER_SKILLS_DIR = join(homedir(), ".omnicod", "skills")

const LIBRARY = new URL("./library", import.meta.url).pathname

// ─── Öncelik tablosu ─────────────────────────────────────────────────────────
const PRIORITY_OVERRIDES: Record<string, number> = {
  "nextjs-expert":    10,
  "react-expert":      9,
  "typescript-expert": 8,
  "prisma-expert":     8,
  "nodejs-expert":     7,
  "blueprint":         1,
}

// OmniRule SKILL.md'de deps alanı yok — supplementary dep detection map
// Sadece en kritik framework'ler için küçük liste
const DEPS_SUPPLEMENT: Record<string, string[]> = {
  "react-expert":            ["react", "react-dom"],
  "nextjs-expert":           ["next"],
  "typescript-expert":       ["typescript"],
  "tailwind-expert":         ["tailwindcss"],
  "prisma-expert":           ["@prisma/client", "prisma"],
  "drizzle-orm":             ["drizzle-orm"],
  "supabase-patterns":       ["@supabase/supabase-js", "@supabase/ssr"],
  "nodejs-expert":           ["express", "fastify", "hono", "koa"],
  "graphql-patterns":        ["graphql", "@apollo/server", "@apollo/client"],
  "trpc-patterns":           ["@trpc/server", "@trpc/client"],
  "hono-patterns":           ["hono"],
  "state-management":        ["zustand", "jotai", "@reduxjs/toolkit", "recoil"],
  "forms-patterns":          ["react-hook-form", "formik"],
  "testing-patterns":        ["jest", "vitest", "playwright", "cypress"],
  "docker-patterns":         [],  // file-based yeterli
  "llm-integration":         ["openai", "anthropic", "@anthropic-ai/sdk", "langchain", "ai"],
  "stripe-integration":      ["stripe", "@stripe/stripe-js"],
  "clerk-auth":              ["@clerk/nextjs", "@clerk/clerk-sdk-node"],
  "redis-patterns":          ["ioredis", "redis", "@upstash/redis"],
  "mongodb-patterns":        ["mongoose", "mongodb"],
  "svelte-expert":           ["svelte", "@sveltejs/kit"],
  "nuxt-expert":             ["nuxt", "@nuxt/kit"],
  "remix-expert":            ["@remix-run/react", "@remix-run/node"],
  "expo-router":             ["expo", "expo-router"],
  "react-native":            ["react-native"],
  "animations-patterns":     ["framer-motion", "motion"],
  "monitoring-patterns":     ["@sentry/nextjs", "@sentry/node", "@opentelemetry/api"],
  "data-visualization":      ["recharts", "d3", "chart.js"],
  "email-patterns":          ["resend", "nodemailer", "@sendgrid/mail"],
  "bundle-optimization":     ["webpack", "vite", "rollup"],
  "internationalization":    ["next-intl", "i18next", "react-i18next"],
  "real-time-patterns":      ["socket.io", "ws", "pusher-js"],
  "message-queues":          ["bullmq", "kafkajs", "amqplib"],
  "vector-db-patterns":      ["@pinecone-database/pinecone", "chromadb", "weaviate-ts-client"],
  "web3-patterns":           ["ethers", "viem", "wagmi", "web3"],
  "solidity-patterns":       ["hardhat", "foundry"],
  "mlops-patterns":          ["mlflow", "tensorboard"],
  "etl-patterns":            ["airflow", "dbt"],
}

function buildDetector(triggers: SkillFrontmatter["triggers"] | undefined): SkillDetector {
  if (!triggers) return {}
  const d: SkillDetector = {}
  if (triggers.filenames?.length)   d.files    = triggers.filenames
  if (triggers.deps?.length)        d.deps     = triggers.deps
  if (triggers.directories?.length) d.dirs     = triggers.directories
  if (triggers.extensions?.length)  d.patterns = triggers.extensions
  return d
}

// ─── Sync init: modül yüklenirken library/ taranır ──────────────────────────

function scanLibrary(): Map<string, SkillDef> {
  const map = new Map<string, SkillDef>()

  let names: string[]
  try {
    names = readdirSync(LIBRARY) as unknown as string[]
  } catch {
    return map
  }

  for (const id of names) {
    try { if (!statSync(join(LIBRARY, id)).isDirectory()) continue } catch { continue }
    const contentPath = join(LIBRARY, id, "SKILL.md")

    let raw = ""
    try { raw = readFileSync(contentPath, "utf8") } catch { continue }

    const { meta } = parseFrontmatter(raw)

    const detector = buildDetector(meta.triggers)
    // Supplementary dep detection ekle
    const extraDeps = DEPS_SUPPLEMENT[id]
    if (extraDeps && extraDeps.length > 0) {
      detector.deps = [...(detector.deps ?? []), ...extraDeps]
    }

    const def: SkillDef = {
      id,
      name:        meta.name || id.replace(/-/g, " "),
      description: meta.description || "",
      detector,
      contentPath,
      priority:    PRIORITY_OVERRIDES[id] ?? meta.priority ?? 5,
      tags:        meta.tags ?? [],
      ...(meta.agent !== undefined ? { agent: meta.agent } : {}),
    }

    map.set(id, def)
  }

  return map
}

const SKILLS = scanLibrary()

// Kullanıcının ~/.omnicod/skills/ klasöründeki .md dosyalarını tarar
function scanUserSkills(): void {
  let files: string[]
  try { files = readdirSync(USER_SKILLS_DIR) } catch { return }

  for (const f of files) {
    if (!f.endsWith(".md")) continue
    const id          = f.replace(/\.md$/, "")
    const contentPath = join(USER_SKILLS_DIR, f)

    let raw = ""
    try { raw = readFileSync(contentPath, "utf8") } catch { continue }

    const { meta } = parseFrontmatter(raw)
    const def: SkillDef = {
      id,
      name:        meta.name || id.replace(/-/g, " "),
      description: meta.description || "",
      detector:    buildDetector(meta.triggers),
      contentPath,
      priority:    meta.priority ?? 5,
      tags:        meta.tags ?? [],
      ...(meta.agent !== undefined ? { agent: meta.agent } : {}),
    }
    SKILLS.set(id, def)
  }
}

scanUserSkills()

export const SkillRegistry = {
  all():                   SkillDef[]          { return [...SKILLS.values()] },
  get(id: string):         SkillDef | undefined { return SKILLS.get(id) },
  has(id: string):         boolean              { return SKILLS.has(id) },
  count():                 number               { return SKILLS.size },
  reload():                void                 { scanUserSkills() },
}

// Frontmatter tipini burada da kullanmak için — döngüsel import önlemek adına re-export değil
import type { SkillFrontmatter } from "./frontmatter.js"
