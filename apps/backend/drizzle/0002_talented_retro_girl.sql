ALTER TABLE "secret_transfers" ADD COLUMN "envelope_version" text DEFAULT '1' NOT NULL;--> statement-breakpoint
ALTER TABLE "secret_transfers" ADD COLUMN "sender_key_fingerprint" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "secret_transfers" ADD COLUMN "sender_signature" text DEFAULT '' NOT NULL;