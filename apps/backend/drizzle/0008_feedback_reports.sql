CREATE TABLE IF NOT EXISTS "feedback_reports" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "reason" text NOT NULL,
  "note" text,
  "user_message" text,
  "assistant_message" text NOT NULL,
  "provider" text,
  "model" text,
  "app_version" text,
  "platform" text DEFAULT 'mobile' NOT NULL,
  "tool_summary_json" text NOT NULL,
  "metadata_json" text NOT NULL,
  "created_at" timestamp NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "feedback_reports" ADD CONSTRAINT "feedback_reports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "feedback_reports_user_created_idx" ON "feedback_reports" USING btree ("user_id","created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "feedback_reports_reason_idx" ON "feedback_reports" USING btree ("reason");
