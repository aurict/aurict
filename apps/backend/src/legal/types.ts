export type ParsedUnit = {
  kind: string // "part" | "chapter" | "article" | "paragraph" | ... (serbest metin, adapter'a göre değişir)
  label: string | null // "MADDE 5", "§ 823", "Article 5" ...
  ordinal: number
  heading: string | null
  bodyText: string | null
  path: string // materialized path, örn. "5/2"
  children: ParsedUnit[]
}

export type ParsedCitation = {
  fromUnitPath: string
  rawText: string
  /** Atfedilen kanunun numarası (örn. "7161"), adapter çıkarabiliyorsa. */
  targetIdentifier?: string
  /** Atfedilen maddenin numarası (örn. "56"), adapter çıkarabiliyorsa. */
  targetArticleNumber?: string
}

export type ParsedStatute = {
  jurisdiction: string
  lang: string
  identifier: string
  title: string
  versionDate: string
  sourceUrl: string | null
  units: ParsedUnit[]
  citations: ParsedCitation[]
}

export type FetchedStatuteText = {
  rawText: string
  title: string
  versionDate: string
  sourceUrl: string
}

export type JurisdictionAdapter = {
  jurisdiction: string
  lang: string
  /** Kaynak kurumdan ham metni çeker (PDF/HTML fark etmez, sonuç düz metin). */
  fetchStatute(identifier: string): Promise<FetchedStatuteText>
  /** Düz metinden hiyerarşik birim ağacını çıkarır. */
  parseHierarchy(rawText: string): ParsedUnit[]
  /** Birimlerin metninden diğer kanunlara/maddelere yapılan atıfları çıkarır. */
  extractCitations(units: ParsedUnit[]): ParsedCitation[]
}
