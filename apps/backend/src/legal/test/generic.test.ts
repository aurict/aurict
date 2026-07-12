import { describe, expect, test } from "bun:test"
import { parseHierarchyGeneric, extractCitationsGeneric } from "../jurisdictions/generic"

describe("generic adapter — Article/Section style", () => {
  const sample = `
PART I. General Provisions

CHAPTER 1. Formation of Contracts

Article 1 - Offer and acceptance
A contract is formed when an offer is accepted.

Acceptance may be express or implied.

Article 2 - Consideration
Every contract requires consideration from both parties.

CHAPTER 2. Remedies

Article 3 - Damages
A party in breach shall be liable for damages under 15 U.S.C. § 78j.
`

  test("builds a nested part -> chapter -> article tree", () => {
    const units = parseHierarchyGeneric(sample)
    expect(units).toHaveLength(1)
    const part = units[0]!
    expect(part.kind).toBe("part")
    expect(part.heading).toBe("General Provisions")
    expect(part.children).toHaveLength(2)

    const [chapter1, chapter2] = part.children
    expect(chapter1!.kind).toBe("chapter")
    expect(chapter1!.children).toHaveLength(2)
    expect(chapter2!.children).toHaveLength(1)
  })

  test("assigns materialized paths using the article number, not sibling order", () => {
    const units = parseHierarchyGeneric(sample)
    const chapter2 = units[0]!.children[1]!
    const article3 = chapter2.children[0]!
    expect(article3.label).toBe("Article 3")
    // "Part I" düğümünün segmenti roma rakamından değil sıra numarasından gelir
    // (extractOrdinalSegment yalnız arap rakamı arar) — path şeması kararlı sıra
    // numaralarına dayanır, madde/bölüm numaralarını (arap rakamıysa) korur.
    expect(article3.path).toBe("1/2/3")
  })

  test("splits multi-paragraph article body into paragraph children", () => {
    const units = parseHierarchyGeneric(sample)
    const article1 = units[0]!.children[0]!.children[0]!
    expect(article1.label).toBe("Article 1")
    expect(article1.children).toHaveLength(2)
    expect(article1.children[0]!.bodyText).toBe("A contract is formed when an offer is accepted.")
    expect(article1.children[1]!.bodyText).toBe("Acceptance may be express or implied.")
  })

  test("extracts a U.S.C.-style citation", () => {
    const units = parseHierarchyGeneric(sample)
    const citations = extractCitationsGeneric(units)
    expect(citations).toHaveLength(1)
    expect(citations[0]!.rawText).toBe("15 U.S.C. § 78j")
  })
})

describe("generic adapter — flat § style (no parts/chapters)", () => {
  const sample = `
§ 1. Definitions
In this Act, "person" includes a corporation.

§ 2. Application
This Act applies to all persons within the jurisdiction.
`

  test("builds flat article-only tree when no part/chapter markers exist", () => {
    const units = parseHierarchyGeneric(sample)
    expect(units).toHaveLength(2)
    expect(units[0]!.kind).toBe("article")
    expect(units[0]!.path).toBe("1")
    expect(units[1]!.path).toBe("2")
  })
})
