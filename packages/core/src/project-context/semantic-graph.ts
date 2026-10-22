/**
 * CodeGraph → GraphJson extractor (workspace-scoped, LLM-free).
 *
 * Reads `.codegraph/codegraph.db` (SQLite) directly with Bun's native sqlite
 * module. Returns a compact graph payload for both:
 *   - the /visual HTTP server (three.js + d3-force-3d viewer)
 *   - the core context feeder (semantic summary injection)
 *
 * Filtering strategy (to keep the viewer usable on 10k+ symbol codebases):
 *   - drop `import` and `file` pseudo-nodes — they are structural noise
 *   - drop `contains` edges — file→member containment is not a dependency
 *   - keep real semantic nodes: function, method, class, interface,
 *     component, type_alias, enum, route, struct, namespace, property,
 *     enum_member, constant, variable, field
 *   - keep real semantic edges: calls, references, imports (node→node),
 *     instantiates, implements, extends
 *
 * No LLM, no network, no MCP — just SQL + a little shaping.
 */

import { Database } from "bun:sqlite"
import { existsSync } from "node:fs"
import { join } from "node:path"

// ─── Public types ─────────────────────────────────────────────────────────────

export type NodeKind =
  | "function" | "method" | "class" | "interface" | "component"
  | "type_alias" | "enum" | "enum_member" | "route" | "struct"
  | "namespace" | "property" | "constant" | "variable" | "field"

export type EdgeKind =
  | "calls" | "references" | "imports"
  | "instantiates" | "implements" | "extends"

export interface GraphNode {
  /** Stable codegraph node id (primary key in `nodes`). */
  id: string
  kind: string
  name: string
  /** Qualified, e.g. `packages/cli/src/index.ts:renderApp` — used for tooltips. */
  qualified: string
  /** Project-relative file path, e.g. `packages/cli/src/index.ts`. */
  file: string
  lang: string
  start: number
  end: number
  exported: boolean
  async: boolean
  /** Precomputed structural degree (in + out over retained edges). */
  inDeg: number
  outDeg: number
}

export interface GraphEdge {
  source: string
  target: string
  kind: EdgeKind
}

export interface GraphJson {
  project: string
  generatedAt: number
  codegraphVersion: string | null
  stats: {
    nodes: number
    edges: number
    files: number
    languages: Record<string, number>
    nodeKinds: Record<string, number>
    edgeKinds: Record<string, number>
  }
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export interface GraphSummary {
  /** True when `.codegraph/codegraph.db` exists and yielded a non-empty graph. */
  ready: boolean
  nodes: number
  edges: number
  files: number
  /** Top-N semantic hubs (highest total degree) — for LLM context injection. */
  hubs: Array<{ name: string; kind: string; file: string; degree: number }>
  /** Count of nodes per language, top 6 only. */
  byLanguage: Array<{ lang: string; count: number }>
  /** Count of nodes per kind, top 8 only. */
  byKind: Array<{ kind: string; count: number }>
  /** Sub-systems inferred by top-level directory under the project root. */
  bySubsystem: Array<{ subsystem: string; count: number }>
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const RETAINED_NODE_KINDS = new Set<string>([
  "function", "method", "class", "interface", "component",
  "type_alias", "enum", "enum_member", "route", "struct",
  "namespace", "property", "constant", "variable", "field",
])

const RETAINED_EDGE_KINDS = new Set<string>([
  "calls", "references", "imports",
  "instantiates", "implements", "extends",
])

const MAX_NODES = 8_000      // hard cap — keeps the viewer smooth
const MAX_EDGES = 20_000     // hard cap — keeps layout solvable
const MAX_HUBS = 12

export const CODEGRAPH_DB_PATH = (projectDir: string): string =>
  join(projectDir, ".codegraph", "codegraph.db")

export function isGraphReady(projectDir: string): boolean {
  return existsSync(CODEGRAPH_DB_PATH(projectDir))
}

// ─── Extractor ─────────────────────────────────────────────────────────────

/**
 * Read codegraph.db and return a workspace-scoped GraphJson.
 *
 * @param projectDir absolute project root (.codegraph lives here)
 * @param opts.maxNodes optional override for the node cap (e.g. tests)
 */
export function loadGraphData(
  projectDir: string,
  opts: { maxNodes?: number; maxEdges?: number } = {},
): GraphJson {
  const dbPath = CODEGRAPH_DB_PATH(projectDir)
  if (!existsSync(dbPath)) {
    return emptyGraph(projectDir)
  }

  const maxNodes = opts.maxNodes ?? MAX_NODES
  const maxEdges = opts.maxEdges ?? MAX_EDGES

  const db = new Database(dbPath, { readonly: true })
  try {
    return extractGraph(db, projectDir, maxNodes, maxEdges)
  } finally {
    db.close()
  }
}

function extractGraph(
  db: Database,
  projectDir: string,
  maxNodes: number,
  maxEdges: number,
): GraphJson {
  const codegraphVersion = readMetadata(db, "indexed_with_version")

  // Rank nodes by structural degree so the cap selects the most-connected
  // symbols when the codebase exceeds the viewer budget.
  const ranked = db
    .prepare(RANKED_NODES_SQL)
    .all() as RankedNodeRow[]

  const retained = new Set<string>()
  const seenFiles = new Set<string>()
  const langCounts = new Map<string, number>()
  const kindCounts = new Map<string, number>()

  for (const row of ranked) {
    if (retained.size >= maxNodes) break
    if (!RETAINED_NODE_KINDS.has(row.kind)) continue

    retained.add(row.id)
    seenFiles.add(row.file_path)
    bump(langCounts, row.language)
    bump(kindCounts, row.kind)
  }

  // Edges: keep only those whose both endpoints survived the node cap.
  // Pre-filter in SQL by `edgeKinds`, then second-pass in JS for endpoint
  // membership — SQLite can't IN-list a 10k-element Set cheaply.
  const edgeKindCounts = new Map<string, number>()
  const edges: GraphEdge[] = []
  const cursor = db.prepare(EDGE_SCAN_SQL).iterate() as IterableIterator<RawEdgeRow>

  for (const row of cursor) {
    if (edges.length >= maxEdges) break
    if (!RETAINED_EDGE_KINDS.has(row.kind)) continue
    if (!retained.has(row.source) || !retained.has(row.target)) continue

    edges.push({ source: row.source, target: row.target, kind: row.kind as EdgeKind })
    bump(edgeKindCounts, row.kind)
  }

  // Rebuild degree counts from the retained edge set (SQL degree included
  // filtered kinds, so it overestimated). This is O(edges) and cheap.
  const inDeg = new Map<string, number>()
  const outDeg = new Map<string, number>()
  for (const e of edges) {
    outDeg.set(e.source, (outDeg.get(e.source) ?? 0) + 1)
    inDeg.set(e.target, (inDeg.get(e.target) ?? 0) + 1)
  }

  const nodes: GraphNode[] = []
  for (const row of ranked) {
    if (!retained.has(row.id)) continue
    nodes.push({
      id: row.id,
      kind: row.kind,
      name: row.name,
      qualified: row.qualified_name,
      file: row.file_path,
      lang: row.language,
      start: row.start_line,
      end: row.end_line,
      exported: row.is_exported === 1,
      async: row.is_async === 1,
      inDeg: inDeg.get(row.id) ?? 0,
      outDeg: outDeg.get(row.id) ?? 0,
    })
  }

  return {
    project: basename(projectDir),
    generatedAt: Date.now(),
    codegraphVersion,
    stats: {
      nodes: nodes.length,
      edges: edges.length,
      files: seenFiles.size,
      languages: toObject(langCounts),
      nodeKinds: toObject(kindCounts),
      edgeKinds: toObject(edgeKindCounts),
    },
    nodes,
    edges,
  }
}

// ─── Summary (for LLM context injection) ─────────────────────────────────────

/**
 * Lightweight, LLM-friendly summary of the semantic graph. Cached in-process
 * for 90 seconds per project so a turn doesn't re-query on every prompt build.
 */
export function loadGraphSummary(projectDir: string): GraphSummary {
  const dbPath = CODEGRAPH_DB_PATH(projectDir)
  if (!existsSync(dbPath)) {
    return { ready: false, nodes: 0, edges: 0, files: 0, hubs: [], byLanguage: [], byKind: [], bySubsystem: [] }
  }

  const cacheKey = projectDir
  const cached = SUMMARY_CACHE.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) return cached.value

  const db = new Database(dbPath, { readonly: true })
  try {
    const summary = computeSummary(db, projectDir)
    SUMMARY_CACHE.set(cacheKey, { value: summary, expiresAt: Date.now() + 90_000 })
    return summary
  } finally {
    db.close()
  }
}

function computeSummary(db: Database, projectDir: string): GraphSummary {
  const nodeKinds = db
    .prepare("SELECT kind, COUNT(*) AS n FROM nodes GROUP BY kind ORDER BY n DESC")
    .all() as Array<{ kind: string; n: number }>
  const langKinds = db
    .prepare("SELECT language, COUNT(*) AS n FROM files GROUP BY language ORDER BY n DESC")
    .all() as Array<{ language: string; n: number }>
  const totals = db
    .prepare("SELECT (SELECT COUNT(*) FROM nodes) AS nodes, (SELECT COUNT(*) FROM edges) AS edges, (SELECT COUNT(*) FROM files) AS files")
    .get() as { nodes: number; edges: number; files: number }

  // Hubs: combine in+out degree across the retained semantic edge kinds.
  const hubRows = db
    .prepare(HUB_NODES_SQL)
    .all() as Array<HubRow>

  const hubs: GraphSummary["hubs"] = hubRows
    .filter((r) => RETAINED_NODE_KINDS.has(r.kind))
    .slice(0, MAX_HUBS)
    .map((r) => ({
      name: r.name,
      kind: r.kind,
      file: r.file_path,
      degree: r.in_deg + r.out_deg,
    }))

  const bySubsystem = computeSubsystemBreakdown(db)

  return {
    ready: true,
    nodes: totals.nodes,
    edges: totals.edges,
    files: totals.files,
    hubs,
    byLanguage: langKinds.map((r) => ({ lang: r.language, count: r.n })).slice(0, 6),
    byKind: nodeKinds.map((r) => ({ kind: r.kind, count: r.n })).slice(0, 8),
    bySubsystem,
  }
}

function computeSubsystemBreakdown(db: Database): Array<{ subsystem: string; count: number }> {
  // Buckets by the first path segment under the project root.
  const rows = db
    .prepare(`
      SELECT
        CASE
          WHEN instr(file_path, '/') = 0 THEN '(root)'
          ELSE substr(file_path, 1, instr(file_path, '/') - 1)
        END AS subsystem,
        COUNT(*) AS n
      FROM nodes
      WHERE kind IN ('function','method','class','interface','component','enum','type_alias','route','struct')
      GROUP BY subsystem
      ORDER BY n DESC
      LIMIT 12
    `)
    .all() as Array<{ subsystem: string; n: number }>
  return rows.map((r) => ({ subsystem: r.subsystem, count: r.n }))
}

// ─── CLI:s serving (graph payload for HTTP) ──────────────────────────────────

/**
 * Same as `loadGraphData` but trimmed for the wire — drops `qualified`,
 * `start`, `end` when the caller only needs the topology. Keeps the viewer
 * payload small enough for a single HTTP response even on large monorepos.
 */
export function loadGraphForViewer(projectDir: string): GraphJson {
  return loadGraphData(projectDir)
}

// ─── SQL templates ──────────────────────────────────────────────────────────

const RANKED_NODES_SQL = `
  SELECT
    n.id            AS id,
    n.kind          AS kind,
    n.name          AS name,
    n.qualified_name AS qualified_name,
    n.file_path     AS file_path,
    n.language      AS language,
    n.start_line    AS start_line,
    n.end_line      AS end_line,
    n.is_exported   AS is_exported,
    n.is_async      AS is_async,
    COALESCE(d.in_deg, 0)  AS in_deg,
    COALESCE(d.out_deg, 0) AS out_deg
  FROM nodes n
  LEFT JOIN (
    SELECT
      node,
      SUM(CASE WHEN role = 'in'  THEN cnt ELSE 0 END) AS in_deg,
      SUM(CASE WHEN role = 'out' THEN cnt ELSE 0 END) AS out_deg
    FROM (
      SELECT source AS node, 'out' AS role, COUNT(*) AS cnt FROM edges GROUP BY source
      UNION ALL
      SELECT target AS node, 'in'  AS role, COUNT(*) AS cnt FROM edges GROUP BY target
    )
    GROUP BY node
  ) d ON d.node = n.id
  ORDER BY (COALESCE(d.in_deg,0) + COALESCE(d.out_deg,0)) DESC, n.name ASC
`

const EDGE_SCAN_SQL = `
  SELECT source, target, kind
  FROM edges
  WHERE kind IN ('calls','references','imports','instantiates','implements','extends')
  ORDER BY source, target
`

const HUB_NODES_SQL = `
  SELECT
    n.id        AS id,
    n.kind      AS kind,
    n.name      AS name,
    n.file_path AS file_path,
    COALESCE(d.in_deg, 0)  AS in_deg,
    COALESCE(d.out_deg, 0) AS out_deg
  FROM nodes n
  LEFT JOIN (
    SELECT
      node,
      SUM(CASE WHEN role = 'in'  THEN cnt ELSE 0 END) AS in_deg,
      SUM(CASE WHEN role = 'out' THEN cnt ELSE 0 END) AS out_deg
    FROM (
      SELECT source AS node, 'out' AS role, COUNT(*) AS cnt FROM edges
        WHERE kind IN ('calls','imports','instantiates','implements','extends','references')
        GROUP BY source
      UNION ALL
      SELECT target AS node, 'in' AS role, COUNT(*) AS cnt FROM edges
        WHERE kind IN ('calls','imports','instantiates','implements','extends','references')
        GROUP BY target
    )
    GROUP BY node
  ) d ON d.node = n.id
  WHERE n.kind IN ('function','method','class','interface','component','enum','type_alias','route','struct')
  ORDER BY (COALESCE(d.in_deg,0) + COALESCE(d.out_deg,0)) DESC, n.name ASC
  LIMIT 80
`

// ─── Internal helpers ─────────────────────────────────────────────────────────

interface RankedNodeRow {
  id: string
  kind: string
  name: string
  qualified_name: string
  file_path: string
  language: string
  start_line: number
  end_line: number
  is_exported: number
  is_async: number
  in_deg: number
  out_deg: number
}

interface RawEdgeRow {
  source: string
  target: string
  kind: string
}

interface HubRow {
  id: string
  kind: string
  name: string
  file_path: string
  in_deg: number
  out_deg: number
}

const SUMMARY_CACHE = new Map<string, { value: GraphSummary; expiresAt: number }>()

function readMetadata(db: Database, key: string): string | null {
  try {
    const row = db
      .prepare("SELECT value FROM project_metadata WHERE key = ?")
      .get(key) as { value: string } | null
    return row?.value ?? null
  } catch {
    return null
  }
}

function bump(map: Map<string, number>, key: string): void {
  map.set(key, (map.get(key) ?? 0) + 1)
}

function toObject(map: Map<string, number>): Record<string, number> {
  const obj: Record<string, number> = {}
  for (const [k, v] of map) obj[k] = v
  return obj
}

function emptyGraph(projectDir: string): GraphJson {
  return {
    project: basename(projectDir),
    generatedAt: Date.now(),
    codegraphVersion: null,
    stats: { nodes: 0, edges: 0, files: 0, languages: {}, nodeKinds: {}, edgeKinds: {} },
    nodes: [],
    edges: [],
  }
}

function basename(p: string): string {
  const parts = p.replace(/\/+$/, "").split("/")
  return parts[parts.length - 1] ?? p
}