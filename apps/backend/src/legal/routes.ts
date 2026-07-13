import { Hono } from "hono"
import { and, eq, ilike, or } from "drizzle-orm"
import { requireAuth } from "../middleware/auth"
import { ApiError } from "../middleware/errors"
import type { AppBindings } from "../types"
import { getOrFetchStatute } from "./statute-cache"
import { genericAdapter } from "./jurisdictions/generic"
import { trAdapter } from "./jurisdictions/tr"
import { legalCitations, legalDocuments, legalUnits } from "./schema"
import type { JurisdictionAdapter } from "./types"

const KNOWN_ADAPTERS: Record<string, JurisdictionAdapter> = { [trAdapter.jurisdiction]: trAdapter }

function adapterForJurisdiction(jurisdiction: string): JurisdictionAdapter {
  return KNOWN_ADAPTERS[jurisdiction] ?? { ...genericAdapter, jurisdiction }
}

export const legalRoutes = new Hono<AppBindings>()
  .use("/legal/*", requireAuth)
  .get("/legal/statute/:jurisdiction/:identifier", async (c) => {
    const jurisdiction = c.req.param("jurisdiction")
    const identifier = c.req.param("identifier")
    const db = c.get("db")
    if (!db) throw new ApiError(503, "Database is not configured.", "unavailable")

    const adapter = adapterForJurisdiction(jurisdiction)
    try {
      const { document, units } = await getOrFetchStatute(db.db, adapter, identifier)
      const roots = units.filter((u) => u.parentId === null)
      return c.json({ ok: true, document, units: roots })
    } catch (error) {
      throw new ApiError(502, error instanceof Error ? error.message : "Statute fetch failed.", "fetch_failed")
    }
  })
  .get("/legal/unit/:id", async (c) => {
    const id = c.req.param("id")
    const expand = c.req.query("expand")
    const db = c.get("db")
    if (!db) throw new ApiError(503, "Database is not configured.", "unavailable")

    const unit = await db.db.query.legalUnits.findFirst({ where: eq(legalUnits.id, id) })
    if (!unit) throw new ApiError(404, "Legal unit not found.", "not_found")

    const children = await db.db.query.legalUnits.findMany({ where: eq(legalUnits.parentId, id) })

    if (expand !== "citations") return c.json({ ok: true, unit, children })

    const citations = await db.db.query.legalCitations.findMany({ where: eq(legalCitations.fromUnitId, id) })
    return c.json({ ok: true, unit, children, citations })
  })
  .get("/legal/search", async (c) => {
    const q = c.req.query("q")?.trim()
    const jurisdiction = c.req.query("jurisdiction")
    if (!q) throw new ApiError(400, "Query parameter 'q' is required.", "missing_query")
    const db = c.get("db")
    if (!db) throw new ApiError(503, "Database is not configured.", "unavailable")

    const pattern = `%${q}%`
    const textMatch = or(ilike(legalUnits.bodyText, pattern), ilike(legalUnits.heading, pattern))
    const where = jurisdiction
      ? and(textMatch, eq(legalDocuments.jurisdiction, jurisdiction))
      : textMatch

    const results = await db.db
      .select({ unit: legalUnits, document: legalDocuments })
      .from(legalUnits)
      .innerJoin(legalDocuments, eq(legalUnits.documentId, legalDocuments.id))
      .where(where)
      .limit(20)

    return c.json({ ok: true, results })
  })
