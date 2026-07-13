import { and, desc, eq, isNull, isNotNull } from "drizzle-orm"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import * as schema from "../db/schema"
import { legalCitations, legalDocuments, legalUnits } from "./schema"

type Db = PostgresJsDatabase<typeof schema>

export type ResolveCitationsResult = {
  resolved: number
  stillUnresolved: number
}

/**
 * `resolvedDocumentId IS NULL` olan atıfları, hedef kanun cache'e girmişse
 * çözer. `statute-cache.ts`'teki `getOrFetchStatute` her yeni belgeyi
 * cache'e eklediğinde çağrılabilir — o ana kadar çözülemeyen atıflar
 * `resolvedDocumentId = null` kalmaya devam eder, hata fırlatmaz.
 */
export async function resolveCitations(db: Db): Promise<ResolveCitationsResult> {
  const pending = await db
    .select({
      citationId: legalCitations.id,
      targetIdentifier: legalCitations.targetIdentifier,
      targetArticleNumber: legalCitations.targetArticleNumber,
      citingJurisdiction: legalDocuments.jurisdiction,
    })
    .from(legalCitations)
    .innerJoin(legalUnits, eq(legalCitations.fromUnitId, legalUnits.id))
    .innerJoin(legalDocuments, eq(legalUnits.documentId, legalDocuments.id))
    .where(and(isNull(legalCitations.resolvedDocumentId), isNotNull(legalCitations.targetIdentifier)))

  let resolved = 0

  for (const citation of pending) {
    const targetDocument = await db.query.legalDocuments.findFirst({
      where: and(
        eq(legalDocuments.jurisdiction, citation.citingJurisdiction),
        eq(legalDocuments.identifier, citation.targetIdentifier!),
      ),
      orderBy: desc(legalDocuments.versionDate),
    })
    if (!targetDocument) continue

    let resolvedUnitPath: string | null = null
    if (citation.targetArticleNumber) {
      const targetUnit = await db.query.legalUnits.findFirst({
        where: and(
          eq(legalUnits.documentId, targetDocument.id),
          eq(legalUnits.label, `MADDE ${citation.targetArticleNumber}`),
        ),
      })
      resolvedUnitPath = targetUnit?.path ?? null
    }

    await db
      .update(legalCitations)
      .set({ resolvedDocumentId: targetDocument.id, resolvedUnitPath })
      .where(eq(legalCitations.id, citation.citationId))
    resolved++
  }

  return { resolved, stillUnresolved: pending.length - resolved }
}
