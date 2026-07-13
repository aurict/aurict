ALTER TABLE "legal_citations" ADD COLUMN "target_identifier" text;--> statement-breakpoint
ALTER TABLE "legal_citations" ADD COLUMN "target_article_number" text;--> statement-breakpoint
CREATE INDEX "legal_citations_unresolved_idx" ON "legal_citations" USING btree ("target_identifier") WHERE "legal_citations"."resolved_document_id" is null;