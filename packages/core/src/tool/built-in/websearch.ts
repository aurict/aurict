import { z } from "zod"
import type { ToolDef, ToolContext, ExecuteResult } from "../types.js"

const TIMEOUT_MS    = 20_000
const MAX_RESULTS   = 10
const DEFAULT_COUNT = 5

interface SearchResult { title: string; url: string; snippet: string }

function domain(url: string): string {
  try { return new URL(url).hostname } catch { return url }
}

function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim()
}

// Cümle ortasında kesme — en yakın nokta/satır sonuna kadar git
function safeSnippet(text: string, maxLen: number): string {
  const t = stripTags(text)
  if (t.length <= maxLen) return t
  const cut = t.slice(0, maxLen)
  const lastPunct = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "), cut.lastIndexOf("? "))
  return lastPunct > maxLen * 0.6 ? cut.slice(0, lastPunct + 1) : cut + "…"
}

// Exponential backoff retry
async function retryWithBackoff<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  maxRetries = 2,
  baseMs     = 500,
): Promise<T> {
  let last: unknown
  for (let i = 0; i <= maxRetries; i++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
    try {
      const result = await fn(controller.signal)
      clearTimeout(timer)
      return result
    } catch (err) {
      clearTimeout(timer)
      last = err
      if (i < maxRetries) await new Promise((r) => setTimeout(r, baseMs * 2 ** i))
    }
  }
  throw last
}

// ── Arama motorları ───────────────────────────────────────────────────────────

interface DDGResponse {
  AbstractText?: string; AbstractURL?: string
  RelatedTopics?: Array<{ Text?: string; FirstURL?: string; Topics?: Array<{ Text?: string; FirstURL?: string }> }>
  Results?: Array<{ Text?: string; FirstURL?: string }>
}

async function searchDDG(query: string, num: number, signal: AbortSignal): Promise<SearchResult[]> {
  const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1&t=aurict`
  const res = await fetch(url, { signal, headers: { "User-Agent": "Aurict/1.0" } })
  if (!res.ok) throw new Error(`DDG ${res.status}`)
  const data = await res.json() as DDGResponse
  const results: SearchResult[] = []

  if (data.AbstractText && data.AbstractURL)
    results.push({ title: domain(data.AbstractURL), url: data.AbstractURL, snippet: safeSnippet(data.AbstractText, 400) })

  for (const t of data.RelatedTopics ?? []) {
    if (results.length >= num) break
    if (t.Topics) for (const s of t.Topics) {
      if (results.length >= num) break
      if (s.FirstURL && s.Text) results.push({ title: domain(s.FirstURL), url: s.FirstURL, snippet: safeSnippet(s.Text, 400) })
    }
    else if (t.FirstURL && t.Text)
      results.push({ title: domain(t.FirstURL), url: t.FirstURL, snippet: safeSnippet(t.Text, 400) })
  }
  for (const r of data.Results ?? []) {
    if (results.length >= num) break
    if (r.FirstURL && r.Text) results.push({ title: domain(r.FirstURL), url: r.FirstURL, snippet: safeSnippet(r.Text, 400) })
  }
  return results.slice(0, num)
}

async function searchWikipedia(query: string, num: number, signal: AbortSignal): Promise<SearchResult[]> {
  const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=${num}&format=json&origin=*`
  const res = await fetch(url, { signal, headers: { "User-Agent": "Aurict/1.0" } })
  if (!res.ok) throw new Error(`Wikipedia ${res.status}`)
  const data = await res.json() as { query?: { search?: Array<{ title: string; snippet: string; pageid: number }> } }
  return (data.query?.search ?? []).map((r) => ({
    title:   r.title,
    url:     `https://en.wikipedia.org/wiki/${encodeURIComponent(r.title.replace(/ /g, "_"))}`,
    snippet: safeSnippet(r.snippet, 400),
  }))
}

async function searchBrave(query: string, num: number, signal: AbortSignal): Promise<SearchResult[]> {
  const url = `https://search.brave.com/api/suggest?q=${encodeURIComponent(query)}&rich=true&source=web&count=${num}`
  const res = await fetch(url, { signal, headers: { "User-Agent": "Aurict/1.0", Accept: "application/json" } })
  if (!res.ok) throw new Error(`Brave ${res.status}`)
  const data = await res.json() as unknown[]
  const suggestions = data[1] as string[] | undefined
  return (suggestions ?? []).slice(0, num).map((s) => ({
    title: s, url: `https://search.brave.com/search?q=${encodeURIComponent(s)}`,
    snippet: `Search suggestion: ${s}`,
  }))
}

// ── Domain filtresi ───────────────────────────────────────────────────────────

function filterResults(
  results: SearchResult[],
  allowed?: string[],
  blocked?: string[],
): SearchResult[] {
  return results.filter((r) => {
    const d = domain(r.url)
    if (blocked?.length && blocked.some((b) => d.includes(b))) return false
    if (allowed?.length && !allowed.some((a) => d.includes(a))) return false
    return true
  })
}

// ── Çıktı formatlama ──────────────────────────────────────────────────────────

function format(query: string, results: SearchResult[]): string {
  if (!results.length)
    return `No results for: "${query}"\nTip: Try a broader query or use webfetch with a direct URL.`
  const lines = [`Web search: "${query}"`, ""]
  results.forEach((r, i) => {
    lines.push(`${i + 1}. ${r.title}`)
    lines.push(`   ${r.url}`)
    if (r.snippet) lines.push(`   ${r.snippet}`)
    lines.push("")
  })
  return lines.join("\n").trim()
}

// ── Tool tanımı ───────────────────────────────────────────────────────────────

export const websearchTool: ToolDef = {
  id: "websearch",
  description:
    "Search the web for current information, recent news, documentation, or fact verification.\n" +
    "For fetching a specific URL use 'webfetch' instead.\n" +
    `Current year: ${new Date().getFullYear()}.`,

  parameters: z.object({
    query:          z.string().describe("Search query"),
    numResults:     z.number().min(1).max(MAX_RESULTS).optional().describe(`Results to return (default ${DEFAULT_COUNT})`),
    allowedDomains: z.array(z.string()).optional().describe("Only return results from these domains"),
    blockedDomains: z.array(z.string()).optional().describe("Exclude results from these domains"),
  }),

  async execute(args, _ctx: ToolContext): Promise<ExecuteResult> {
    const query   = String(args["query"] ?? "").trim()
    if (!query) return { output: "", error: "query is required" }

    const num     = Math.min(MAX_RESULTS, Math.max(1, Number(args["numResults"] ?? DEFAULT_COUNT)))
    const allowed = args["allowedDomains"] as string[] | undefined
    const blocked = args["blockedDomains"]  as string[] | undefined

    // Arama motoru zinciri: DDG → Wikipedia → Brave (her biri retry'lı)
    const engines: Array<(q: string, n: number, s: AbortSignal) => Promise<SearchResult[]>> = [
      searchDDG, searchWikipedia, searchBrave,
    ]

    let results: SearchResult[] = []
    let lastError = ""

    for (const engine of engines) {
      if (results.length >= num) break
      try {
        const r = await retryWithBackoff((signal) => engine(query, num, signal))
        const filtered = filterResults(r, allowed, blocked)
        for (const item of filtered) {
          if (!results.some((x) => x.url === item.url)) results.push(item)
        }
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err)
      }
    }

    if (!results.length && lastError)
      return { output: "", error: `All search engines failed: ${lastError}` }

    return { output: format(query, results.slice(0, num)) }
  },
}
