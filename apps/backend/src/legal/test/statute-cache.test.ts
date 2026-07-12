import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import { createDbClient, type BackendDb } from "../../db/client"
import { loadEnv } from "../../env"
import { getOrFetchStatute, fetchAndPersistStatute } from "../statute-cache"
import type { FetchedStatuteText, JurisdictionAdapter } from "../types"

// Bu test gerçek Postgres gerektirir (statute-cache.ts, backend'in in-memory
// repository soyutlamasından bağımsız olarak doğrudan Drizzle üzerinden çalışır
// — bkz. test/integration.test.ts'teki aynı DATABASE_URL-gated desen).
// Gerçek mevzuat.gov.tr'ye karşı canlı uçtan uca doğrulama bu oturumda elle
// yapıldı (1006 birim, 4 atıf, ~1.6sn ilk çekim / ~20ms cache'li okuma) — bu
// test suite'i ağdan bağımsız sahte bir adapter kullanır, sadece cache
// mantığını (fetch sayısı, versiyon çakışması, hata izolasyonu) doğrular.
const databaseUrl = process.env.DATABASE_URL

function fakeAdapter(fetchCounter: { count: number }): JurisdictionAdapter {
  const fetched: FetchedStatuteText = {
    rawText: "MADDE 1- Test maddesi.\n\nMADDE 2- İkinci test maddesi.",
    title: "TEST KANUNU",
    versionDate: "2026-07-12",
    sourceUrl: "https://example.test/test-kanun.pdf",
  }
  return {
    jurisdiction: "TR-TEST",
    lang: "tr",
    async fetchStatute() {
      fetchCounter.count++
      return fetched
    },
    parseHierarchy(rawText) {
      return rawText.split("\n\n").map((block, i) => {
        const [, label, body] = block.match(/^(MADDE \d+)- (.+)$/s) ?? [null, `MADDE ${i + 1}`, block]
        return {
          kind: "article",
          label,
          ordinal: i + 1,
          heading: null,
          bodyText: body,
          path: String(i + 1),
          children: [],
        }
      })
    },
    extractCitations() {
      return []
    },
  }
}

if (!databaseUrl) {
  test.skip("legal statute cache requires DATABASE_URL", () => {})
} else {
  const env = loadEnv({ NODE_ENV: "test", JWT_SECRET: "test-secret-test-secret-test-secret-test-secret", DATABASE_URL: databaseUrl })
  let db: BackendDb

  beforeAll(() => {
    db = createDbClient(env)!
  })

  afterAll(async () => {
    await db.close()
  })

  describe("lazy statute cache", () => {
    test("first call fetches and persists; second call reuses cache without fetching", async () => {
      const counter = { count: 0 }
      const adapter = fakeAdapter(counter)

      const first = await getOrFetchStatute(db.db, adapter, `cache-test-${Date.now()}`)
      expect(counter.count).toBe(1)
      expect(first.units).toHaveLength(2)
      expect(first.document.title).toBe("TEST KANUNU")

      const second = await getOrFetchStatute(db.db, adapter, first.document.identifier)
      expect(counter.count).toBe(1) // ikinci çağrı fetch yapmadı
      expect(second.document.id).toBe(first.document.id)
      expect(second.units).toHaveLength(2)
    })

    test("different identifiers are cached independently", async () => {
      const counter = { count: 0 }
      const adapter = fakeAdapter(counter)
      const idA = `cache-test-a-${Date.now()}`
      const idB = `cache-test-b-${Date.now()}`

      await getOrFetchStatute(db.db, adapter, idA)
      await getOrFetchStatute(db.db, adapter, idB)
      expect(counter.count).toBe(2)
    })

    test("fetchAndPersistStatute bypasses cache and always fetches", async () => {
      const counter = { count: 0 }
      const adapter = fakeAdapter(counter)
      const identifier = `cache-test-refresh-${Date.now()}`

      await fetchAndPersistStatute(db.db, adapter, identifier)
      expect(counter.count).toBe(1)

      // getOrFetchStatute artık cache'te bulur, tekrar fetch yapmaz
      const cached = await getOrFetchStatute(db.db, adapter, identifier)
      expect(counter.count).toBe(1)
      expect(cached.units).toHaveLength(2)
    })

    test("two same-day fetchAndPersistStatute calls for the same identifier conflict (version_date benzersizliği kasıtlı)", async () => {
      const counter = { count: 0 }
      const adapter = fakeAdapter(counter)
      const identifier = `cache-test-conflict-${Date.now()}`

      await fetchAndPersistStatute(db.db, adapter, identifier)
      await expect(fetchAndPersistStatute(db.db, adapter, identifier)).rejects.toThrow()
    })

    test("persisted units carry correct body text and paths", async () => {
      const counter = { count: 0 }
      const adapter = fakeAdapter(counter)
      const result = await getOrFetchStatute(db.db, adapter, `cache-test-body-${Date.now()}`)

      const madde1 = result.units.find((u) => u.path === "1")!
      expect(madde1.label).toBe("MADDE 1")
      expect(madde1.bodyText).toBe("Test maddesi.")
      expect(madde1.parentId).toBeNull()
    })
  })
}
