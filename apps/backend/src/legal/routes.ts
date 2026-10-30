import { Hono } from "hono"
import { and, eq, ilike, or } from "drizzle-orm"
import { requireAuth } from "../middleware/auth"
import { ApiError } from "../middleware/errors"
import { rateLimit } from "../middleware/rate-limit"
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

// Statute identifiers end up in an upstream URL path (e.g. mevzuat.gov.tr/MevzuatMetin/1.5.<id>.pdf),
// so only plain law numbers/codes are accepted.
const IDENTIFIER_PATTERN = /^[A-Za-z0-9.-]{1,32}$/
const JURISDICTION_PATTERN = /^[A-Z]{2,8}$/

// ILIKE treats % and _ as wildcards and \ as the escape character.
export function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&")
}

export const legalRoutes = new Hono<AppBindings>()
  .use("/legal/*", requireAuth)
  .use("/legal/statute/*", rateLimit(30, 60_000, "legal-statute"))
  .use("/legal/unit/*", rateLimit(120, 60_000, "legal-unit"))
  .use("/legal/search", rateLimit(60, 60_000, "legal-search"))
  .get("/legal/statute/:jurisdiction/:identifier", async (c) => {
    const jurisdiction = c.req.param("jurisdiction")
    const identifier = c.req.param("identifier")
    if (!JURISDICTION_PATTERN.test(jurisdiction) || !IDENTIFIER_PATTERN.test(identifier)) {
      throw new ApiError(400, "Invalid jurisdiction or statute identifier.", "invalid_identifier")
    }
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
    if (q.length > 200) throw new ApiError(400, "Query parameter 'q' is too long.", "query_too_long")
    const db = c.get("db")
    if (!db) throw new ApiError(503, "Database is not configured.", "unavailable")

    const pattern = `%${escapeLikePattern(q)}%`
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
