ALTER TABLE "auth_identities" ALTER COLUMN "password_hash" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "auth_identities" ADD COLUMN "provider_subject" text;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "auth_provider_subject_idx" ON "auth_identities" USING btree ("provider","provider_subject");