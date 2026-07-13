import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import { and, eq, isNotNull, isNull } from "drizzle-orm"
import { createDbClient, type BackendDb } from "../../db/client"
import { loadEnv } from "../../env"
import { newId, now } from "../../crypto/ids"
import { getOrFetchStatute } from "../statute-cache"
import { resolveCitations } from "../citation-resolver"
import { trAdapter } from "../jurisdictions/tr"
import { legalCitations, legalDocuments, legalUnits } from "../schema"

// Gerçek Postgres gerektirir (aynı desen: test/integration.test.ts,
// statute-cache.test.ts). Bu oturumda gerçek TBK verisiyle uçtan uca
// doğrulandı: TBK'nın 7161/700 sayılı kanunlara olan 4 gerçek atıfı,
// hedefler cache dışındayken NULL kalıyor (negatif senaryo), hedefler
// sentetik olarak cache'e eklenince doğru document+unit'e çözülüyor.
const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  test.skip("legal citation resolver requires DATABASE_URL", () => {})
} else {
  const env = loadEnv({ NODE_ENV: "test", JWT_SECRET: "test-secret-test-secret-test-secret-test-secret", DATABASE_URL: databaseUrl })
  let db: BackendDb

  beforeAll(() => {
    db = createDbClient(env)!
  })

  afterAll(async () => {
    await db.close()
  })

  describe("citation resolver", () => {
    test("leaves citations unresolved when the target law isn't cached, resolves once it is", async () => {
      const identifier = `citation-test-${Date.now()}`
      const targetIdentifier = `citation-target-${Date.now()}`
      const createdAt = now()

      // Kaynak belge: hedefe atıf yapan tek maddelik bir kanun.
      const sourceDocId = newId("lgd")
      await db.db.insert(legalDocuments).values({
        id: sourceDocId, jurisdiction: "TR-TEST", lang: "tr", identifier,
        title: "Test Kaynak Kanun", versionDate: "2026-07-13", sourceUrl: null, createdAt,
      })
      const sourceUnitId = newId("lgu")
      await db.db.insert(legalUnits).values({
        id: sourceUnitId, documentId: sourceDocId, parentId: null, kind: "article",
        label: "MADDE 1", ordinal: 1, heading: null, bodyText: "test", path: "1", createdAt,
      })
      const citationId = newId("lgc")
      await db.db.insert(legalCitations).values({
        id: citationId, fromUnitId: sourceUnitId, rawText: "test atıf",
        targetIdentifier, targetArticleNumber: "5",
        resolvedDocumentId: null, resolvedUnitPath: null, createdAt,
      })

      const beforeResult = await resolveCitations(db.db)
      const unresolved = await db.db.select().from(legalCitations).where(eq(legalCitations.id, citationId))
      expect(unresolved[0]!.resolvedDocumentId).toBeNull()

      // Hedef belge artık cache'e giriyor.
      const targetDocId = newId("lgd")
      await db.db.insert(legalDocuments).values({
        id: targetDocId, jurisdiction: "TR-TEST", lang: "tr", identifier: targetIdentifier,
        title: "Test Hedef Kanun", versionDate: "2026-07-13", sourceUrl: null, createdAt,
      })
      await db.db.insert(legalUnits).values({
        id: newId("lgu"), documentId: targetDocId, parentId: null, kind: "article",
        label: "MADDE 5", ordinal: 1, heading: null, bodyText: "hedef madde", path: "5", createdAt,
      })

      const afterResult = await resolveCitations(db.db)
      expect(afterResult.resolved).toBeGreaterThanOrEqual(1)

      const resolved = await db.db.select().from(legalCitations).where(eq(legalCitations.id, citationId))
      expect(resolved[0]!.resolvedDocumentId).toBe(targetDocId)
      expect(resolved[0]!.resolvedUnitPath).toBe("5")
    })

    test("real TBK citations (7161, 700) resolve against seeded targets by their real identifiers", async () => {
      const tbk = await getOrFetchStatute(db.db, trAdapter, "6098")
      expect(tbk.units.length).toBeGreaterThan(1000)

      const tbkCitations = await db.db
        .select()
        .from(legalCitations)
        .innerJoin(legalUnits, eq(legalCitations.fromUnitId, legalUnits.id))
        .where(and(eq(legalUnits.documentId, tbk.document.id), isNotNull(legalCitations.targetIdentifier)))
      expect(tbkCitations.length).toBeGreaterThanOrEqual(2)
      const identifiers = tbkCitations.map((row) => row.legal_citations.targetIdentifier)
      expect(identifiers).toContain("7161")
      expect(identifiers).toContain("700")

      // Gerçek atıfların hedef kimlikleriyle (7161, 700) eşleşen sentetik cache
      // girişleri ekleyerek resolver'ın regex'ten çıkan gerçek değerleri doğru
      // kullandığını kanıtla (statute-cache.test.ts'te 7161/700'ün gerçek
      // metinlerini canlı çekmek ayrı, gereksiz bir ağ bağımlılığı olurdu).
      const createdAt = now()
      for (const [identifier, articleNumber] of [["7161", "56"], ["700", "190"]] as const) {
        const existing = await db.db.query.legalDocuments.findFirst({
          where: and(eq(legalDocuments.jurisdiction, "TR"), eq(legalDocuments.identifier, identifier)),
        })
        if (existing) continue
        const docId = newId("lgd")
        await db.db.insert(legalDocuments).values({
          id: docId, jurisdiction: "TR", lang: "tr", identifier,
          title: `TEST — ${identifier}`, versionDate: "2026-07-13", sourceUrl: null, createdAt,
        })
        await db.db.insert(legalUnits).values({
          id: newId("lgu"), documentId: docId, parentId: null, kind: "article",
          label: `MADDE ${articleNumber}`, ordinal: 1, heading: null, bodyText: "test", path: articleNumber, createdAt,
        })
      }

      await resolveCitations(db.db)
      const resolvedTbkCitations = await db.db
        .select()
        .from(legalCitations)
        .innerJoin(legalUnits, eq(legalCitations.fromUnitId, legalUnits.id))
        .where(and(eq(legalUnits.documentId, tbk.document.id), isNotNull(legalCitations.targetIdentifier)))
      for (const row of resolvedTbkCitations) {
        expect(row.legal_citations.resolvedDocumentId).not.toBeNull()
      }
    })
  })
}
