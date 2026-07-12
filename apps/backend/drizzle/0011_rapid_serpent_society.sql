CREATE TABLE "legal_citations" (
	"id" text PRIMARY KEY NOT NULL,
	"from_unit_id" text NOT NULL,
	"raw_text" text NOT NULL,
	"resolved_document_id" text,
	"resolved_unit_path" text,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "legal_documents" (
	"id" text PRIMARY KEY NOT NULL,
	"jurisdiction" text NOT NULL,
	"lang" text NOT NULL,
	"identifier" text NOT NULL,
	"title" text NOT NULL,
	"version_date" text NOT NULL,
	"source_url" text,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "legal_units" (
	"id" text PRIMARY KEY NOT NULL,
	"document_id" text NOT NULL,
	"parent_id" text,
	"kind" text NOT NULL,
	"label" text,
	"ordinal" integer NOT NULL,
	"heading" text,
	"body_text" text,
	"path" text NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "legal_citations" ADD CONSTRAINT "legal_citations_from_unit_id_legal_units_id_fk" FOREIGN KEY ("from_unit_id") REFERENCES "public"."legal_units"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "legal_citations" ADD CONSTRAINT "legal_citations_resolved_document_id_legal_documents_id_fk" FOREIGN KEY ("resolved_document_id") REFERENCES "public"."legal_documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "legal_units" ADD CONSTRAINT "legal_units_document_id_legal_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."legal_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "legal_units" ADD CONSTRAINT "legal_units_parent_id_legal_units_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."legal_units"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "legal_citations_from_unit_idx" ON "legal_citations" USING btree ("from_unit_id");--> statement-breakpoint
CREATE INDEX "legal_citations_resolved_document_idx" ON "legal_citations" USING btree ("resolved_document_id");--> statement-breakpoint
CREATE UNIQUE INDEX "legal_documents_identity_idx" ON "legal_documents" USING btree ("jurisdiction","identifier","version_date");--> statement-breakpoint
CREATE INDEX "legal_units_document_idx" ON "legal_units" USING btree ("document_id");--> statement-breakpoint
CREATE UNIQUE INDEX "legal_units_document_path_idx" ON "legal_units" USING btree ("document_id","path");--> statement-breakpoint
CREATE INDEX "legal_units_parent_idx" ON "legal_units" USING btree ("parent_id");