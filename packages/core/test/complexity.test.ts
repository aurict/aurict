/**
 * Faz 2.1 — assessComplexity'nin tek kaynak karmaşıklık skorunu doğru
 * hesapladığını, ek sinyallerin (değişen dosya, tekrarlayan hata) skoru
 * SADECE yükselttiğini (asla düşürmediğini) ve step/effort türetiminin
 * tutarlı olduğunu doğrular.
 */
import { describe, it, expect } from "bun:test"
import { assessComplexity, stepsForComplexity, deriveReasoningEffort } from "../src/agent/complexity.js"

describe("assessComplexity", () => {
  it("kısa, eylemsiz metin için trivial döner", () => {
    const result = assessComplexity({ text: "merhaba", hasAttachments: false })
    expect(result.level).toBe("trivial")
    expect(result.score).toBeLessThan(15)
  })

  it("kısa ama eylemsel metin (ör. 'fix tests') trivial'dan daha yüksek çıkar", () => {
    const trivial = assessComplexity({ text: "merhaba", hasAttachments: false })
    const actionable = assessComplexity({ text: "fix tests", hasAttachments: false })
    expect(actionable.score).toBeGreaterThan(trivial.score)
    expect(actionable.level).not.toBe("trivial")
  })

  it("kısa ama zor uygulama görevlerini complex seviyesine yükseltir", () => {
    for (const text of [
      "Race condition'ı düzelt",
      "fix intermittent memory leak",
      "security audit",
      "zero-downtime schema migration uygula",
      "Güvenlik açığını incele",
      "Bellek sızıntısını düzelt",
      "Üretim olayındaki gecikme regresyonunu araştır",
    ]) {
      const result = assessComplexity({ text, hasAttachments: false })
      expect(result.level).toBe("complex")
      expect(result.signals.length).toBeGreaterThan(0)
    }
  })

  it("zor bir kavramı açıklama isteğini uygulama görevi gibi complex yapmaz", () => {
    const result = assessComplexity({ text: "Race condition nedir?", hasAttachments: false })
    expect(result.level).toBe("moderate")
    expect(result.signals).toContain("concurrency")
  })

  it("continuation mesajında kanonik objective zorluğunu korur", () => {
    const result = assessComplexity({
      text: "devam et",
      objective: "Intermittent authentication race condition'ını düzelt",
      hasAttachments: false,
    })
    expect(result.level).toBe("complex")
    expect(result.signals).toEqual(expect.arrayContaining(["concurrency", "intermittent_failure"]))
  })

  it("sıradan kısa görevleri zor sinyal yokken yükseltmez", () => {
    const result = assessComplexity({ text: "README yazım hatasını düzelt", hasAttachments: false })
    expect(result.level).toBe("moderate")
    expect(result.signals).toEqual([])
  })

  it("attachments varsa en az moderate'a çıkar", () => {
    const result = assessComplexity({ text: "kısa", hasAttachments: true })
    expect(["moderate", "complex"]).toContain(result.level)
  })

  it("çok uzun metin complex'e çıkar", () => {
    const result = assessComplexity({ text: "x".repeat(2500), hasAttachments: false })
    expect(result.level).toBe("complex")
  })

  it("ek sinyaller (priorToolCalls/changedFiles/priorFailures) skoru YÜKSELTİR, asla düşürmez", () => {
    const base = assessComplexity({ text: "fix the bug", hasAttachments: false })
    const withSignals = assessComplexity({
      text: "fix the bug",
      hasAttachments: false,
      priorToolCalls: 10,
      changedFiles: 5,
      priorFailures: 2,
    })
    expect(withSignals.score).toBeGreaterThan(base.score)
  })

  it("tekrarlayan başarısızlık (priorFailures) en güçlü tekil sinyaldir — tek başına level'ı yükseltebilir", () => {
    const withoutFailures = assessComplexity({ text: "kısa görev", hasAttachments: false, priorFailures: 0 })
    const withFailures = assessComplexity({ text: "kısa görev", hasAttachments: false, priorFailures: 2 })
    expect(withFailures.score).toBeGreaterThan(withoutFailures.score)
  })

  it("skor her zaman 0-100 aralığında kalır (aşırı sinyal girişinde bile)", () => {
    const result = assessComplexity({
      text: "x".repeat(5000),
      hasAttachments: true,
      priorToolCalls: 1000,
      changedFiles: 1000,
      priorFailures: 1000,
    })
    expect(result.score).toBeLessThanOrEqual(100)
    expect(result.score).toBeGreaterThanOrEqual(0)
  })

  it("negatif sinyal değerleri crash etmez, 0 gibi davranılır", () => {
    expect(() => assessComplexity({
      text: "test", hasAttachments: false, priorToolCalls: -5, changedFiles: -3, priorFailures: -1,
    })).not.toThrow()
  })
})

describe("stepsForComplexity", () => {
  it("her level için pozitif, artan bir step sayısı döner", () => {
    const trivial = stepsForComplexity("trivial")
    const simple = stepsForComplexity("simple")
    const moderate = stepsForComplexity("moderate")
    const complex = stepsForComplexity("complex")
    expect(trivial).toBeLessThan(simple)
    expect(simple).toBeLessThan(moderate)
    expect(moderate).toBeLessThan(complex)
  })
})

describe("deriveReasoningEffort", () => {
  it("düşük skor için 0 (thinking kapalı) döner", () => {
    expect(deriveReasoningEffort(5)).toBe(0)
  })

  it("yüksek skor için maksimum bütçeye (32000) yaklaşır", () => {
    expect(deriveReasoningEffort(95)).toBe(32_000)
  })

  it("cap verilirse asla cap'i aşmaz", () => {
    const uncapped = deriveReasoningEffort(95)
    const capped = deriveReasoningEffort(95, 10_000)
    expect(uncapped).toBeGreaterThan(capped)
    expect(capped).toBeLessThanOrEqual(10_000)
  })

  it("skor arttıkça bütçe asla azalmaz (monoton artan)", () => {
    const scores = [0, 10, 20, 30, 50, 70, 90, 100]
    const budgets = scores.map((s) => deriveReasoningEffort(s))
    for (let i = 1; i < budgets.length; i++) {
      expect(budgets[i]!).toBeGreaterThanOrEqual(budgets[i - 1]!)
    }
  })
})
