/**
 * `/visual` HTTP server — LLM-free browser viewer.
 *
 * Run standalone with: `bun run packages/cli/src/visual/server.ts <projectDir> [port]`
 *
 * Routes:
 *   GET /                  → 3D viewer shell (index.html)
 *   GET /viewer/<file>     → static ESM modules (scene.js, sim.js, …)
 *   GET /api/graph         → workspace-scoped GraphJson (from codegraph.db)
 *   GET /api/summary       → compact GraphSummary (same shape the model sees)
 *   GET /healthz           → liveness probe (parent uses this to detect bind failure)
 *
 * No LLM calls. No MCP. Just SQLite + HTTP. If `codegraph init` has been run the
 * graph appears live; if not, the viewer renders an empty-state hint.
 *
 * Viewer assets are served straight from disk (`viewer/` directory) so the
 * browser picks up edits without a rebuild step — the same source files are
 * the deployed files.
 */

import { existsSync, readFileSync, statSync } from "node:fs"
import { join, dirname, normalize, relative } from "node:path"
import { fileURLToPath } from "node:url"
import { loadGraphForViewer, loadGraphSummary, type GraphJson } from "./graph-data.js"

// ─── Paths ───────────────────────────────────────────────────────────────────

const MODULE_DIR  = dirname(fileURLToPath(import.meta.url))
const VIEWER_DIR  = join(MODULE_DIR, "viewer")

// ─── CLI entry point ─────────────────────────────────────────────────────────

if (import.meta.main) {
  const projectDir = process.argv[2] ?? process.cwd()
  const port = parseInt(process.argv[3] ?? "4321", 10)
  if (!existsSync(projectDir)) {
    console.error(`[visual] project dir not found: ${projectDir}`)
    process.exit(2)
  }
  startVisualServer({ projectDir, port })
    .then((handle) => console.log(`[visual] listening on ${handle.url}`))
    .catch((err) => {
      console.error(`[visual] failed to start:`, err instanceof Error ? err.message : err)
      process.exit(1)
    })
}

// ─── Server factory ──────────────────────────────────────────────────────────

export interface VisualServerOptions {
  projectDir: string
  port: number
  hostname?: string
  /** Called once the socket is bound — parent uses this to detect failures. */
  onReady?: (url: string) => void
}

export interface VisualServerHandle {
  url: string
  port: number
  stop: () => void
}

export function startVisualServer(opts: VisualServerOptions): Promise<VisualServerHandle> {
  const hostname = opts.hostname ?? "127.0.0.1"
  const projectDir = opts.projectDir

  // Cache the graph payload for a short window — a 10k-node codegraph is
  // ~1.5MB JSON and we don't want to re-scan the SQLite DB on every browser
  // hot-reload tick.
  let graphCache: { value: GraphJson; expiresAt: number } | null = null
  const GRAPH_TTL_MS = 30_000

  const fetchGraph = (): GraphJson => {
    const now = Date.now()
    if (graphCache && graphCache.expiresAt > now) return graphCache.value
    const value = loadGraphForViewer(projectDir)
    graphCache = { value, expiresAt: now + GRAPH_TTL_MS }
    return value
  }

  return new Promise<VisualServerHandle>((resolve_, reject_) => {
    let server: ReturnType<typeof Bun.serve> | null = null
    let settled = false
    const fail = (err: unknown) => { if (!settled) { settled = true; reject_(err) } }
    const ok   = (handle: VisualServerHandle) => { if (!settled) { settled = true; resolve_(handle) } }

    try {
      server = Bun.serve({
        hostname,
        port: opts.port,
        development: false,
        fetch(request) {
          return handleRequest(request, { projectDir, fetchGraph })
        },
        error(err) {
          console.error(`[visual] request error:`, err)
          return new Response("internal error", { status: 500 })
        },
      })
    } catch (err) {
      return fail(err)
    }

    const url = `http://${hostname}:${opts.port}`
    opts.onReady?.(url)
    ok({
      url,
      port: opts.port,
      stop: () => { try { server?.stop(true) } catch { /* already stopped */ } },
    })
  })
}

// ─── Request router ──────────────────────────────────────────────────────────

const JSON_HEADERS = { "content-type": "application/json; charset=utf-8" }

const MIME_BY_EXT: Record<string, string> = {
  ".js":   "application/javascript; charset=utf-8",
  ".mjs":  "application/javascript; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".css":  "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg":  "image/svg+xml",
  ".png":  "image/png",
  ".ico":  "image/x-icon",
}

function handleRequest(
  request: Request,
  deps: { projectDir: string; fetchGraph: () => GraphJson },
): Response {
  const url = new URL(request.url)
  const pathname = url.pathname

  if (request.method !== "GET") {
    return new Response("method not allowed", { status: 405 })
  }

  // Index
  if (pathname === "/" || pathname === "/index.html") {
    return serveViewerFile("index.html")
  }

  // Static viewer assets under /viewer/*
  if (pathname.startsWith("/viewer/")) {
    const rel = decodeURIComponent(pathname.slice("/viewer/".length))
    return serveViewerFile(rel)
  }

  // APIs
  if (pathname === "/api/graph")   return json(deps.fetchGraph())
  if (pathname === "/api/summary") return json(loadGraphSummary(deps.projectDir))

  // Ops
  if (pathname === "/healthz")     return new Response("ok", { status: 200 })
  if (pathname === "/favicon.ico") return new Response(null, { status: 204 })

  return new Response("not found", { status: 404 })
}

function serveViewerFile(relPath: string): Response {
  // Path traversal guard: resolve relative to viewer dir, then re-check.
  const safe = normalize(relPath)
  if (safe.includes("..")) return new Response("forbidden", { status: 403 })

  const abs = join(VIEWER_DIR, safe)
  // Ensure the resolved path is still under VIEWER_DIR.
  const rel = relative(VIEWER_DIR, abs)
  if (rel.startsWith("..") || rel === "") return new Response("forbidden", { status: 403 })

  if (!existsSync(abs) || !statSync(abs).isFile()) {
    return new Response("not found", { status: 404 })
  }

  const body = readFileSync(abs)
  const ext = safe.slice(safe.lastIndexOf("."))
  const contentType = MIME_BY_EXT[ext] ?? "application/octet-stream"
  return new Response(body, { headers: { "content-type": contentType } })
}

function json(value: unknown): Response {
  return new Response(JSON.stringify(value), { headers: JSON_HEADERS })
}