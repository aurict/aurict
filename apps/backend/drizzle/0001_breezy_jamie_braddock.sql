ALTER TABLE "devices" ADD COLUMN "registration_challenge" text;--> statement-breakpoint
ALTER TABLE "devices" ADD COLUMN "registration_challenge_expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "devices" ADD COLUMN "verified_at" timestamp;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD COLUMN "reuse_detected_at" timestamp;