/**
 * Jurisdiction adapter'ı olmayan ülkeler için fallback parser.
 *
 * NOT: Bu parser, İngilizce hukuk metinlerinde yaygın olan uluslararası
 * kalıplara (Article/Section/§) dayanır ve bu oturumda gerçek bir yabancı
 * mevzuat kaynağına karşı doğrulanmadı — sadece `tr.ts` gerçek mevzuat.gov.tr
 * verisiyle doğrulanmıştır (bkz. tr.test.ts). generic.ts'in test kapsamı
 * elle yazılmış temsili örnek metinlerledir; üretimde ilk kullanımdan önce
 * hedef ülkenin gerçek metniyle bir kez doğrulanması önerilir.
 */
import { buildTree, splitIntoParagraphs, type LineMatcher } from "../hierarchy"
import type { JurisdictionAdapter, ParsedCitation, ParsedUnit } from "../types"

const PART_RE = /^(?:PART|TITLE)\s+([IVXLCDM\d]+)\.?\s*(.*)$/i
const CHAPTER_RE = /^CHAPTER\s+([IVXLCDM\d]+)\.?\s*(.*)$/i
const ARTICLE_RE = /^(?:Article|Art\.|Section|Sec\.|§)\s*(\d+[a-z]?)\.?\s*[-–—]?\s*(.*)$/i

const matchers: LineMatcher[] = [
  {
    kind: "part",
    depth: 0,
    test: (line) => {
      const m = line.match(PART_RE)
      return m ? { label: `Part ${m[1]}`, heading: m[2]?.trim() || undefined } : null
    },
  },
  {
    kind: "chapter",
    depth: 1,
    test: (line) => {
      const m = line.match(CHAPTER_RE)
      return m ? { label: `Chapter ${m[1]}`, heading: m[2]?.trim() || undefined } : null
    },
  },
  {
    kind: "article",
    depth: 2,
    test: (line) => {
      const m = line.match(ARTICLE_RE)
      return m ? { label: m[0].split(/[-–—]/)[0]!.trim(), heading: undefined } : null
    },
  },
]

export function parseHierarchyGeneric(rawText: string): ParsedUnit[] {
  const roots = buildTree(rawText.split("\n"), matchers)
  return roots.map(splitArticlesIntoParagraphs)
}

function splitArticlesIntoParagraphs(unit: ParsedUnit): ParsedUnit {
  if (unit.kind === "article" && unit.bodyText) {
    const paragraphs = splitIntoParagraphs(unit.bodyText)
    if (paragraphs.length > 1) {
      unit.children = paragraphs.map((text, i) => ({
        kind: "paragraph",
        label: null,
        ordinal: i + 1,
        heading: null,
        bodyText: text,
        path: `${unit.path}/${i + 1}`,
        children: [],
      }))
      unit.bodyText = null
    }
  }
  unit.children = unit.children.map(splitArticlesIntoParagraphs)
  return unit
}

const CITATION_RE = /\b\d+\s+U\.S\.C\.\s*§+\s*\d+[a-z0-9-]*|§+\s*\d+[a-z]?\s+(?:of\s+)?(?:the\s+)?[A-Z][\w\s]{2,60}\bAct\b/g

export function extractCitationsGeneric(units: ParsedUnit[]): ParsedCitation[] {
  const citations: ParsedCitation[] = []
  const walk = (unit: ParsedUnit) => {
    if (unit.bodyText) {
      const matches = unit.bodyText.match(CITATION_RE)
      if (matches) {
        for (const rawText of matches) citations.push({ fromUnitPath: unit.path, rawText })
      }
    }
    unit.children.forEach(walk)
  }
  units.forEach(walk)
  return citations
}

export const genericAdapter: JurisdictionAdapter = {
  jurisdiction: "GENERIC",
  lang: "en",
  async fetchStatute(): Promise<never> {
    throw new Error("generic adapter kaynak çekmez — kullanıcı ham metni sağlamalı (fetchStatute çağrılmaz).")
  },
  parseHierarchy: parseHierarchyGeneric,
  extractCitations: extractCitationsGeneric,
}
