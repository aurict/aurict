ALTER TABLE "remote_sessions" ADD COLUMN "protocol_version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "remote_sessions" ADD COLUMN "resume_token_hash" text;--> statement-breakpoint
ALTER TABLE "remote_sessions" ADD COLUMN "last_sequence" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "remote_sessions" ADD COLUMN "max_idle_seconds" integer DEFAULT 90 NOT NULL;--> statement-breakpoint
ALTER TABLE "remote_sessions" ADD COLUMN "accepted_at" timestamp;