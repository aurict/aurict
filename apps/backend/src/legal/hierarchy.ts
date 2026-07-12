import type { ParsedUnit } from "./types"

export type LineMatcher = {
  kind: string
  /** Yapısal derinlik: 0 en dıştaki birim (örn. KISIM), artan sayı içe doğru gider. */
  depth: number
  test: (line: string) => { label: string; heading: string | undefined } | null
}

type StackEntry = { unit: ParsedUnit; depth: number; siblingCount: number }

/**
 * Satır listesini, azalan yapısal önceliğe göre sıralanmış matcher'lara göre
 * materialized-path ağacına dönüştürür. Bir satır eşleşince, o derinlikten
 * daha derin açık birimler kapatılır (stack pop) ve yeni birim eklenir.
 * Eşleşmeyen satırlar, o an açık en derin birimin gövde metnine eklenir.
 */
export function buildTree(lines: string[], matchers: LineMatcher[]): ParsedUnit[] {
  const roots: ParsedUnit[] = []
  const stack: StackEntry[] = []
  const bodyBuffers = new Map<ParsedUnit, string[]>()

  const flushBody = (unit: ParsedUnit) => {
    const buf = bodyBuffers.get(unit)
    if (buf && buf.length > 0) {
      const text = buf.join("\n").trim()
      unit.bodyText = text.length > 0 ? text : null
    }
  }

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (line.length === 0) {
      const current = stack[stack.length - 1]?.unit
      if (current) bodyBuffers.get(current)?.push("")
      continue
    }

    let matched = false
    for (const matcher of matchers) {
      const result = matcher.test(line)
      if (!result) continue
      matched = true

      while (stack.length > 0 && stack[stack.length - 1]!.depth >= matcher.depth) {
        flushBody(stack[stack.length - 1]!.unit)
        stack.pop()
      }

      const parentEntry = stack[stack.length - 1]
      const ordinal = parentEntry ? ++parentEntry.siblingCount : roots.length + 1

      const parentPath = parentEntry?.unit.path
      const segment = extractOrdinalSegment(result.label) ?? String(ordinal)
      const path = parentPath ? `${parentPath}/${segment}` : segment

      const unit: ParsedUnit = {
        kind: matcher.kind,
        label: result.label,
        ordinal,
        heading: result.heading ?? null,
        bodyText: null,
        path,
        children: [],
      }
      bodyBuffers.set(unit, [])

      if (parentEntry) parentEntry.unit.children.push(unit)
      else roots.push(unit)

      stack.push({ unit, depth: matcher.depth, siblingCount: 0 })
      break
    }

    if (!matched) {
      const current = stack[stack.length - 1]?.unit
      if (current) bodyBuffers.get(current)?.push(line)
      // Hiçbir birim açık değilken eşleşmeyen satırlar (başlık bloğu vb.) yok sayılır.
    }
  }

  while (stack.length > 0) {
    flushBody(stack[stack.length - 1]!.unit)
    stack.pop()
  }

  return roots
}

/** "MADDE 5" -> "5", "§ 823" -> "823", "Article 12" -> "12". Bulunamazsa null. */
function extractOrdinalSegment(label: string): string | null {
  const match = label.match(/(\d+)/)
  return match ? match[1]! : null
}

/**
 * Bir birimin gövde metnini fıkralara böler. Önce numaralandırılmış fıkra
 * deseni "(1)" denenir; yoksa boş satırla ayrılmış bloklara düşülür.
 * Sonuç, çağıran tarafından "paragraph" kind'ında çocuk ParsedUnit'lere
 * dönüştürülebilir (bkz. splitIntoParagraphs kullanan adapter'lar).
 */
export function splitIntoParagraphs(bodyText: string): string[] {
  const numbered = bodyText.split(/\n(?=\(\d+\))/).map((s) => s.trim()).filter(Boolean)
  if (numbered.length > 1) return numbered

  return bodyText
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean)
}
