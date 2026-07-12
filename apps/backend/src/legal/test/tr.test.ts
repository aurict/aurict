import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { parseHierarchyTr, extractCitationsTr } from "../jurisdictions/tr"
import type { ParsedUnit } from "../types"

// Gerçek Türk Borçlar Kanunu (6098) metni — 2026-07-12'de mevzuat.gov.tr'den
// fetchStatuteTr() ile canlı çekilip kaydedilmiştir (bkz. fixtures/tbk-6098.txt).
// Bu, elle yazılmış bir örnek değil, gerçek resmî kaynaktan alınmış tam metindir.
const tbkText = readFileSync(join(import.meta.dir, "fixtures/tbk-6098.txt"), "utf-8")

function countByKind(units: ParsedUnit[], kind: string): number {
  let n = 0
  for (const u of units) {
    if (u.kind === kind) n++
    n += countByKind(u.children, kind)
  }
  return n
}

function findByPath(units: ParsedUnit[], path: string): ParsedUnit | undefined {
  for (const u of units) {
    if (u.path === path) return u
    const found = findByPath(u.children, path)
    if (found) return found
  }
  return undefined
}

function allPaths(units: ParsedUnit[]): string[] {
  const out: string[] = []
  for (const u of units) {
    out.push(u.path)
    out.push(...allPaths(u.children))
  }
  return out
}

describe("TR adapter — gerçek TBK (6098) metni", () => {
  const units = parseHierarchyTr(tbkText)

  test("iki KISIM'ı doğru ayrıştırır", () => {
    expect(units).toHaveLength(2)
    expect(units[0]!.kind).toBe("part")
    expect(units[0]!.label).toBe("BİRİNCİ KISIM")
    expect(units[0]!.heading).toBe("Genel Hükümler")
    expect(units[1]!.label).toBe("İKİNCİ KISIM")
  })

  test("BÖLÜM ve AYIRIM seviyelerini iç içe kurar", () => {
    const bolum1 = units[0]!.children[0]!
    expect(bolum1.kind).toBe("chapter")
    expect(bolum1.label).toBe("BİRİNCİ BÖLÜM")
    const ayirim1 = bolum1.children[0]!
    expect(ayirim1.kind).toBe("subdivision")
    expect(ayirim1.label).toBe("BİRİNCİ AYIRIM")
  })

  test("649 gerçek MADDE + en az 1 GEÇİCİ MADDE bulur (tekrarlanan GEÇİCİ MADDE 2 dahil)", () => {
    const articleCount = countByKind(units, "article")
    // 649 numaralı MADDE + TBK'nın kendi GEÇİCİ MADDE'leri + PDF'e eklenmiş
    // 6217 sayılı Yürürlük Kanunu'nun kendi GEÇİCİ MADDE'leri (path çakışması
    // testi aşağıda ayrıca doğrulanıyor).
    expect(articleCount).toBeGreaterThanOrEqual(650)
  })

  test("MADDE 1'i doğru içerik ve konu başlığıyla çıkarır", () => {
    const madde1 = findByPath(units, "1/1/1/1")
    expect(madde1).toBeDefined()
    expect(madde1!.kind).toBe("article")
    expect(madde1!.label).toBe("MADDE 1")
    expect(madde1!.heading).toBe("1. Genel olarak")
    // NOT: pdf-parse'ın düz metin çıktısı, numaralandırılmamış fıkralar arasındaki
    // boş satırı korumaz (pdftotext -layout'un aksine) — bu yüzden TBK gibi fıkra
    // numarası (1)(2) kullanmayan kanunlarda gövde tek blok kalır, ayrılmaz. Bu
    // gerçek veriyle doğrulanmış bir sınırlamadır (bkz. tr.ts başlık yorumu ve
    // "numaralı fıkra ayrımı" testi aşağıda — o yol blank-line'a bağımlı değildir).
    expect(madde1!.bodyText).toBe(
      "Sözleşme, tarafların iradelerini karşılıklı ve birbirine uygun olarak\naçıklamalarıyla kurulur.\nİrade açıklaması, açık veya örtülü olabilir.",
    )
    expect(madde1!.children).toHaveLength(0)
  })

  test("numaralı fıkra deseni ('(1)...(2)...') blank-line'dan bağımsız ayrılır", () => {
    // TBK'da numaralandırılmış fıkra örneği yok (doğrulandı: sıfır eşleşme); bu
    // yüzden bu yol sentetik bir örnekle test ediliyor — splitIntoParagraphs'ın
    // kendisi hierarchy.ts'te tanımlı, jurisdiction'dan bağımsız ortak bir yardımcı.
    const synthetic = "MADDE 99- (1) Birinci fıkra metni.\n(2) İkinci fıkra metni."
    const parsed = parseHierarchyTr(synthetic)
    const madde99 = parsed[0]!
    expect(madde99.label).toBe("MADDE 99")
    expect(madde99.children).toHaveLength(2)
    expect(madde99.children[0]!.bodyText).toBe("(1) Birinci fıkra metni.")
    expect(madde99.children[1]!.bodyText).toBe("(2) İkinci fıkra metni.")
  })

  test("tüm path'ler benzersizdir (gerçek veride bulunan GEÇİCİ MADDE 2 çakışması disambiguate edilir)", () => {
    const paths = allPaths(units)
    expect(new Set(paths).size).toBe(paths.length)
    const disambiguated = paths.filter((p) => p.includes("-dup"))
    expect(disambiguated.length).toBeGreaterThan(0)
  })

  test("gerçek çapraz kanun atıflarını çıkarır", () => {
    const citations = extractCitationsTr(units)
    expect(citations.length).toBeGreaterThanOrEqual(2)
    const rawTexts = citations.map((c) => c.rawText)
    expect(rawTexts).toContain("17/1/2019 tarihli ve 7161 sayılı Kanunun 56 ncı maddesiyle")
    expect(rawTexts).toContain("2/7/2018 tarihli ve 700 sayılı Kanun Hükmünde Kararnamenin 190 ıncı maddesiyle")
    for (const citation of citations) {
      expect(findByPath(units, citation.fromUnitPath)).toBeDefined()
    }
  })

  test("GEÇİCİ MADDE'leri normal maddelerden ayırt eder", () => {
    const geciciMadde1 = findByPath(units, "2/18/gecici-1")
    expect(geciciMadde1).toBeDefined()
    expect(geciciMadde1!.label).toBe("GEÇİCİ MADDE 1")
  })
})
