import { ApiError } from "../middleware/errors"
import { and, desc, eq } from "drizzle-orm"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import { newId, now } from "../crypto/ids"
import * as schema from "../db/schema"
import { resolveCitations } from "./citation-resolver"
import { legalCitations, legalDocuments, legalUnits } from "./schema"
import type { JurisdictionAdapter, ParsedUnit } from "./types"

type Db = PostgresJsDatabase<typeof schema>

export type CachedStatute = {
  document: typeof legalDocuments.$inferSelect
  units: (typeof legalUnits.$inferSelect)[]
}

/**
 * Lazy statute cache: (jurisdiction, identifier) için DB'de bir belge varsa
 * onu döner (fetch yapmaz). Yoksa adapter'la çeker, parse eder, kaydeder ve
 * döner. Kullanıcı verisi (sözleşme metni) bu katmandan hiç geçmez — sadece
 * kamu mevzuatı cache'lenir.
 */
export async function getOrFetchStatute(
  db: Db,
  adapter: JurisdictionAdapter,
  identifier: string,
): Promise<CachedStatute> {
  const cached = await db.query.legalDocuments.findFirst({
    where: and(eq(legalDocuments.jurisdiction, adapter.jurisdiction), eq(legalDocuments.identifier, identifier)),
    orderBy: desc(legalDocuments.versionDate),
  })

  if (cached) {
    const units = await db.query.legalUnits.findMany({
      where: eq(legalUnits.documentId, cached.id),
    })
    return { document: cached, units }
  }

  // Fetching downloads and parses a PDF of up to 25 MB. Concurrent requests for the same statute
  // share one fetch, and at most MAX_CONCURRENT_FETCHES run at once across the process.
  const key = `${adapter.jurisdiction}:${identifier}`
  let pending = inFlight.get(key)
  if (!pending) {
    pending = withFetchSlot(() => fetchAndPersistStatute(db, adapter, identifier)).finally(() => inFlight.delete(key))
    inFlight.set(key, pending)
  }
  return pending
}

const MAX_CONCURRENT_FETCHES = 2
const MAX_QUEUED_FETCHES = 20
const inFlight = new Map<string, Promise<CachedStatute>>()
let activeFetches = 0
const waiting: Array<() => void> = []

export async function withFetchSlot<T>(task: () => Promise<T>): Promise<T> {
  if (activeFetches < MAX_CONCURRENT_FETCHES) {
    activeFetches += 1
  } else {
    if (waiting.length >= MAX_QUEUED_FETCHES) {
      throw new ApiError(503, "Too many statute fetches in progress. Try again shortly.", "fetch_busy")
    }
    // The finishing task hands its slot over directly, so the count never exceeds the cap.
    await new Promise<void>((resolve) => waiting.push(resolve))
  }
  try {
    return await task()
  } finally {
    const next = waiting.shift()
    if (next) next()
    else activeFetches -= 1
  }
}

/** Cache'i yok sayıp her zaman yeniden çeker ve yeni bir version_date satırı olarak kaydeder. */
export async function fetchAndPersistStatute(
  db: Db,
  adapter: JurisdictionAdapter,
  identifier: string,
): Promise<CachedStatute> {
  const fetched = await adapter.fetchStatute(identifier)
  const parsedUnits = adapter.parseHierarchy(fetched.rawText)

  const documentId = newId("lgd")
  const createdAt = now()

  const unitRows: (typeof legalUnits.$inferInsert)[] = []
  const flatten = (units: ParsedUnit[], parentId: string | null) => {
    for (const unit of units) {
      const id = newId("lgu")
      unitRows.push({
        id,
        documentId,
        parentId,
        kind: unit.kind,
        label: unit.label,
        ordinal: unit.ordinal,
        heading: unit.heading,
        bodyText: unit.bodyText,
        path: unit.path,
        createdAt,
      })
      flatten(unit.children, id)
    }
  }
  flatten(parsedUnits, null)

  const pathToUnitId = new Map(unitRows.map((row) => [row.path, row.id!]))
  const citations = adapter.extractCitations(parsedUnits)
  const citationRows: (typeof legalCitations.$inferInsert)[] = citations
    .map((citation) => {
      const fromUnitId = pathToUnitId.get(citation.fromUnitPath)
      if (!fromUnitId) return null
      return {
        id: newId("lgc"),
        fromUnitId,
        rawText: citation.rawText,
        targetIdentifier: citation.targetIdentifier ?? null,
        targetArticleNumber: citation.targetArticleNumber ?? null,
        resolvedDocumentId: null,
        resolvedUnitPath: null,
        createdAt,
      }
    })
    .filter((row): row is NonNullable<typeof row> => row !== null)

  const document = await db.transaction(async (tx) => {
    const [inserted] = await tx
      .insert(legalDocuments)
      .values({
        id: documentId,
        jurisdiction: adapter.jurisdiction,
        lang: adapter.lang,
        identifier,
        title: fetched.title,
        versionDate: fetched.versionDate,
        sourceUrl: fetched.sourceUrl,
        createdAt,
      })
      .returning()

    if (unitRows.length > 0) await tx.insert(legalUnits).values(unitRows)
    if (citationRows.length > 0) await tx.insert(legalCitations).values(citationRows)

    return inserted!
  })

  const units = await db.query.legalUnits.findMany({ where: eq(legalUnits.documentId, documentId) })

  // Bu yeni belge, daha önce hedefi cache'te olmadığı için çözülemeyen
  // başka atıfların hedefi olabilir — her yeni belge cache'e girdiğinde
  // bekleyen atıfları tekrar dener.
  await resolveCitations(db)

  return { document, units }
}
