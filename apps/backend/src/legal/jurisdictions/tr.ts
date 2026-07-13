/**
 * Türkiye mevzuatı adapter'ı.
 *
 * Hiyerarşi ve atıf regex'leri, mevzuat.gov.tr'den indirilen gerçek Türk Borçlar
 * Kanunu (6098) metni üzerinde doğrulanmıştır (bkz. tr.test.ts — fixture, o
 * indirmenin bir kopyasıdır). KISIM/BÖLÜM/AYIRIM sıra sayı sözcükleri BİRİNCİ'den
 * ONYEDİNCİ'ye (17) kadar TBK'nın gerçek kullanımıyla doğrulandı; daha büyük
 * kanunlarda (TCK, TTK gibi) görülebilecek ONSEKİZİNCİ ve sonrası aynı bilinen
 * Türkçe sıra sayı desenine göre eklendi ama gerçek metinle doğrulanmadı.
 *
 * BİLİNEN SINIRLAMA (gerçek veriyle doğrulandı): pdf-parse'ın düz metin çıktısı,
 * numaralandırılmamış fıkralar (TBK'nın kullandığı stil) arasındaki boş satırı
 * korumaz — bu yüzden böyle maddelerde gövde tek blok kalır, fıkralara bölünmez.
 * Yalnızca "(1)...(2)..." gibi numaralandırılmış fıkra deseni (blank-line'a
 * bağımlı olmayan yol) güvenilir şekilde ayrılır.
 *
 * BİLİNEN SINIRLAMA: mevzuat.gov.tr PDF'leri çoğu zaman ana kanunun arkasına
 * ilgili Yürürlük Kanunu'nu ekler; o ekin GEÇİCİ MADDE numaralandırması ana
 * kanunla çakışabilir (gerçek TBK verisinde doğrulandı — bkz. tr.test.ts).
 * parseHierarchyTr bu çakışmaları benzersizleştirir ama ek metni ayrı bir
 * belge olarak modellemez; ekin maddeleri ana kanunun ağacına karışmış olur.
 */
import { PDFParse } from "pdf-parse"
import { splitIntoParagraphs } from "../hierarchy"
import type { FetchedStatuteText, JurisdictionAdapter, ParsedCitation, ParsedUnit } from "../types"

const ORDINAL_WORDS: Record<string, number> = {
  BİRİNCİ: 1, İKİNCİ: 2, ÜÇÜNCÜ: 3, DÖRDÜNCÜ: 4, BEŞİNCİ: 5,
  ALTINCI: 6, YEDİNCİ: 7, SEKİZİNCİ: 8, DOKUZUNCU: 9, ONUNCU: 10,
  ONBİRİNCİ: 11, ONİKİNCİ: 12, ONÜÇÜNCÜ: 13, ONDÖRDÜNCÜ: 14, ONBEŞİNCİ: 15,
  ONALTINCI: 16, ONYEDİNCİ: 17,
  // Aşağıdakiler gerçek metinle doğrulanmadı, aynı bilinen sıra sayı desenine göre eklendi:
  ONSEKİZİNCİ: 18, ONDOKUZUNCU: 19, YİRMİNCİ: 20,
}

const STRUCTURAL_RE = /^([A-ZÇĞİÖŞÜ]+)\s+(KISIM|BÖLÜM|AYIRIM)\s*$/
const MADDE_RE = /^(GEÇİCİ\s+)?MADDE\s+(\d+)([A-ZÇĞİÖŞÜa-zçğıöşü])?\s*[-–—]\s*(.*)$/
const HEADING_RE = /^(?:[A-ZÇĞİÖŞÜ]\.|[IVXLCDM]+\.|\d+\.)\s+(.+)$/

const STRUCTURAL_DEPTH: Record<string, number> = { KISIM: 0, BÖLÜM: 1, AYIRIM: 2 }
const STRUCTURAL_KIND: Record<string, string> = { KISIM: "part", BÖLÜM: "chapter", AYIRIM: "subdivision" }
const MADDE_DEPTH = 3

type StackEntry = { unit: ParsedUnit; depth: number; siblingCount: number }

export function parseHierarchyTr(rawText: string): ParsedUnit[] {
  const lines = rawText.split("\n")
  const roots: ParsedUnit[] = []
  const stack: StackEntry[] = []
  const bodyBuffers = new Map<ParsedUnit, string[]>()
  let pendingHeading: string | undefined
  // mevzuat.gov.tr PDF'leri çoğu zaman ana kanunun arkasına ilgili Yürürlük Kanunu'nu
  // ekler; o ekin kendi GEÇİCİ MADDE numaralandırması ana kanunla çakışabilir (gerçek
  // TBK verisinde doğrulandı: iki ayrı "GEÇİCİ MADDE 2"). Path'i her zaman benzersiz
  // tutmak için çakışmalar burada disambiguate edilir.
  const usedPaths = new Set<string>()
  const uniquePath = (candidate: string): string => {
    if (!usedPaths.has(candidate)) {
      usedPaths.add(candidate)
      return candidate
    }
    let n = 2
    while (usedPaths.has(`${candidate}-dup${n}`)) n++
    const disambiguated = `${candidate}-dup${n}`
    usedPaths.add(disambiguated)
    return disambiguated
  }

  const flush = (unit: ParsedUnit) => {
    const buf = bodyBuffers.get(unit)
    if (buf && buf.length > 0) {
      const text = buf.join("\n").trim()
      unit.bodyText = text.length > 0 ? text : null
    }
  }
  const popTo = (depth: number) => {
    while (stack.length > 0 && stack[stack.length - 1]!.depth >= depth) {
      flush(stack[stack.length - 1]!.unit)
      stack.pop()
    }
  }
  const parent = () => stack[stack.length - 1]
  const pushUnit = (unit: ParsedUnit, depth: number) => {
    const p = parent()
    if (p) p.unit.children.push(unit)
    else roots.push(unit)
    bodyBuffers.set(unit, [])
    stack.push({ unit, depth, siblingCount: 0 })
  }

  let i = 0
  while (i < lines.length) {
    const line = lines[i]!.trim()
    if (line.length === 0) {
      const cur = parent()?.unit
      if (cur) bodyBuffers.get(cur)?.push("")
      i++
      continue
    }

    const structMatch = line.match(STRUCTURAL_RE)
    const num = structMatch ? ORDINAL_WORDS[structMatch[1]!] : undefined
    if (structMatch && num !== undefined) {
      const kindWord = structMatch[2]!
      const depth = STRUCTURAL_DEPTH[kindWord]!
      const heading = lines[i + 1]?.trim()
      popTo(depth)
      const p = parent()
      const ordinal = p ? ++p.siblingCount : roots.length + 1
      const path = uniquePath(p ? `${p.unit.path}/${num}` : String(num))
      pushUnit({
        kind: STRUCTURAL_KIND[kindWord]!,
        label: `${structMatch[1]} ${kindWord}`,
        ordinal,
        heading: heading || null,
        bodyText: null,
        path,
        children: [],
      }, depth)
      pendingHeading = undefined
      i += heading ? 2 : 1
      continue
    }

    const maddeMatch = line.match(MADDE_RE)
    if (maddeMatch) {
      const isGecici = Boolean(maddeMatch[1])
      const number = maddeMatch[2]!
      const suffix = maddeMatch[3] ?? ""
      const restOfLine = maddeMatch[4] ?? ""
      popTo(MADDE_DEPTH)
      const p = parent()
      const ordinal = p ? ++p.siblingCount : roots.length + 1
      const segment = `${isGecici ? "gecici-" : ""}${number}${suffix}`
      const path = uniquePath(p ? `${p.unit.path}/${segment}` : segment)
      const unit: ParsedUnit = {
        kind: "article",
        label: `${isGecici ? "GEÇİCİ " : ""}MADDE ${number}${suffix}`,
        ordinal,
        heading: pendingHeading ?? null,
        bodyText: null,
        path,
        children: [],
      }
      pushUnit(unit, MADDE_DEPTH)
      if (restOfLine.trim().length > 0) bodyBuffers.get(unit)!.push(restOfLine.trim())
      pendingHeading = undefined
      i++
      continue
    }

    const headingMatch = line.match(HEADING_RE)
    if (headingMatch) {
      popTo(MADDE_DEPTH) // önceki maddenin gövdesini kapat
      pendingHeading = line
      i++
      continue
    }

    const cur = parent()?.unit
    if (cur) bodyBuffers.get(cur)?.push(line)
    i++
  }

  popTo(-1)

  return roots.map(splitArticlesIntoParagraphs)
}

function splitArticlesIntoParagraphs(unit: ParsedUnit): ParsedUnit {
  if (unit.kind === "article" && unit.bodyText) {
    const paragraphs = splitIntoParagraphs(unit.bodyText)
    if (paragraphs.length > 1) {
      unit.children = paragraphs.map((text, idx) => ({
        kind: "paragraph",
        label: null,
        ordinal: idx + 1,
        heading: null,
        bodyText: text,
        path: `${unit.path}/${idx + 1}`,
        children: [],
      }))
      unit.bodyText = null
    }
  }
  unit.children = unit.children.map(splitArticlesIntoParagraphs)
  return unit
}

const CITATION_RE = /\d{1,2}\/\d{1,2}\/\d{4}\s+tarihli\s+ve\s+(\d+)\s+sayılı\s+(?:Kanunun|Kanun\s+Hükmünde\s+Kararnamenin)\s+(\d+)\s*(?:inci|nci|ncı|üncü|ıncı|uncu)\s+maddesiyle/g

export function extractCitationsTr(units: ParsedUnit[]): ParsedCitation[] {
  const citations: ParsedCitation[] = []
  const walk = (unit: ParsedUnit) => {
    if (unit.bodyText) {
      for (const match of unit.bodyText.matchAll(CITATION_RE)) {
        citations.push({
          fromUnitPath: unit.path,
          rawText: match[0],
          targetIdentifier: match[1]!,
          targetArticleNumber: match[2]!,
        })
      }
    }
    unit.children.forEach(walk)
  }
  units.forEach(walk)
  return citations
}

const MEVZUAT_BASE_URL = "https://www.mevzuat.gov.tr"

export async function fetchStatuteTr(identifier: string): Promise<FetchedStatuteText> {
  // mevzuat.gov.tr botlara varsayılan User-Agent ile 403 döner; tarayıcı UA'sı gerekli.
  const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  const pdfUrl = `${MEVZUAT_BASE_URL}/MevzuatMetin/1.5.${identifier}.pdf`
  const response = await fetch(pdfUrl, { headers: { "User-Agent": userAgent } })
  if (!response.ok) {
    throw new Error(`mevzuat.gov.tr'den ${identifier} sayılı kanun çekilemedi: HTTP ${response.status}`)
  }
  const pdfBytes = new Uint8Array(await response.arrayBuffer())
  const parser = new PDFParse({ data: pdfBytes })
  const { text } = await parser.getText()
  await parser.destroy()

  const title = text.split("\n").map((l) => l.trim()).find((l) => l.length > 0) ?? `Kanun No. ${identifier}`
  // mevzuat.gov.tr her zaman güncel (konsolide) metni sunar; PDF'in kendisinde
  // "bu haliyle X tarihinden itibaren yürürlükte" bilgisi yoktur. versionDate bu
  // yüzden "kabul tarihi" değil, metnin çekildiği tarihtir — lazy cache'in tazelik
  // anahtarı budur (bkz. plan.md: "cache anahtarı jurisdiction+identifier+version_date").
  const versionDate = new Date().toISOString().slice(0, 10)

  return { rawText: text, title, versionDate, sourceUrl: pdfUrl }
}

export const trAdapter: JurisdictionAdapter = {
  jurisdiction: "TR",
  lang: "tr",
  fetchStatute: fetchStatuteTr,
  parseHierarchy: parseHierarchyTr,
  extractCitations: extractCitationsTr,
}
