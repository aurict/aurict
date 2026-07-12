import { relations } from "drizzle-orm"
import { type AnyPgColumn, index, integer, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core"

// Ülke-bağımsız mevzuat ağacı: Belge -> hiyerarşik birimler -> atıflar.
// Ülkeye özgü olan hiyerarşi terimleri ve atıf kalıpları jurisdictions/*.ts adaptörlerinde
// izole edilir; bu şema hiçbir ülkeye bağlı değildir (bkz. plan.md legal §Temel ilkeler).

export const legalDocuments = pgTable("legal_documents", {
  id: text("id").primaryKey(),
  jurisdiction: text("jurisdiction").notNull(), // "TR", "DE", "US-CA" ...
  lang: text("lang").notNull(), // "tr", "de", "en" ...
  identifier: text("identifier").notNull(), // örn. "6098" (Kanun No)
  title: text("title").notNull(),
  versionDate: text("version_date").notNull(), // yürürlükteki metnin tarihi (ISO date string)
  sourceUrl: text("source_url"),
  createdAt: timestamp("created_at").notNull(),
}, (table) => ({
  identityIdx: uniqueIndex("legal_documents_identity_idx").on(table.jurisdiction, table.identifier, table.versionDate),
}))

export const legalUnits = pgTable("legal_units", {
  id: text("id").primaryKey(),
  documentId: text("document_id").notNull().references(() => legalDocuments.id, { onDelete: "cascade" }),
  parentId: text("parent_id").references((): AnyPgColumn => legalUnits.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(), // "part" | "chapter" | "article" | "paragraph" | ... (serbest metin)
  label: text("label"), // "MADDE 5", "§ 823", "Sec. 230" ...
  ordinal: integer("ordinal").notNull(), // kardeşler arası sıralama
  heading: text("heading"), // konu başlığı ("A. Sözleşmenin kurulması")
  bodyText: text("body_text"), // yapısal düğümlerde (KISIM/BÖLÜM) null olabilir
  path: text("path").notNull(), // materialized path, örn. "5/2" (madde 5, fıkra 2)
  createdAt: timestamp("created_at").notNull(),
}, (table) => ({
  documentIdx: index("legal_units_document_idx").on(table.documentId),
  documentPathIdx: uniqueIndex("legal_units_document_path_idx").on(table.documentId, table.path),
  parentIdx: index("legal_units_parent_idx").on(table.parentId),
}))

export const legalCitations = pgTable("legal_citations", {
  id: text("id").primaryKey(),
  fromUnitId: text("from_unit_id").notNull().references(() => legalUnits.id, { onDelete: "cascade" }),
  rawText: text("raw_text").notNull(), // eşleşen atıf metni, örn. "17/1/2019 tarihli ve 7161 sayılı Kanunun 56 ncı maddesiyle"
  resolvedDocumentId: text("resolved_document_id").references(() => legalDocuments.id),
  resolvedUnitPath: text("resolved_unit_path"), // hedef belge cache'e girene kadar null kalır
  createdAt: timestamp("created_at").notNull(),
}, (table) => ({
  fromUnitIdx: index("legal_citations_from_unit_idx").on(table.fromUnitId),
  resolvedDocumentIdx: index("legal_citations_resolved_document_idx").on(table.resolvedDocumentId),
}))

export const legalDocumentsRelations = relations(legalDocuments, ({ many }) => ({
  units: many(legalUnits),
}))

export const legalUnitsRelations = relations(legalUnits, ({ one, many }) => ({
  document: one(legalDocuments, { fields: [legalUnits.documentId], references: [legalDocuments.id] }),
  parent: one(legalUnits, { fields: [legalUnits.parentId], references: [legalUnits.id], relationName: "unit_children" }),
  children: many(legalUnits, { relationName: "unit_children" }),
  citations: many(legalCitations),
}))

export const legalCitationsRelations = relations(legalCitations, ({ one }) => ({
  fromUnit: one(legalUnits, { fields: [legalCitations.fromUnitId], references: [legalUnits.id] }),
  resolvedDocument: one(legalDocuments, { fields: [legalCitations.resolvedDocumentId], references: [legalDocuments.id] }),
}))
