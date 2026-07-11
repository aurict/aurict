CREATE TABLE IF NOT EXISTS "device_login_flows" (
  "id" text PRIMARY KEY NOT NULL,
  "device_code_hash" text NOT NULL,
  "user_code_hash" text NOT NULL,
  "client_name" text NOT NULL,
  "platform" text DEFAULT 'cli' NOT NULL,
  "expires_at" timestamp NOT NULL,
  "approved_user_id" text,
  "approved_at" timestamp,
  "denied_at" timestamp,
  "consumed_at" timestamp,
  "last_polled_at" timestamp,
  "created_at" timestamp NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "device_login_flows" ADD CONSTRAINT "device_login_flows_approved_user_id_users_id_fk" FOREIGN KEY ("approved_user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "device_login_device_code_hash_idx" ON "device_login_flows" USING btree ("device_code_hash");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "device_login_user_code_hash_idx" ON "device_login_flows" USING btree ("user_code_hash");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "device_login_expiry_idx" ON "device_login_flows" USING btree ("expires_at");
