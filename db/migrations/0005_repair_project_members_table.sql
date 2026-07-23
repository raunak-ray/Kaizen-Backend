-- The migration ledger in some development databases recorded 0004 without
-- creating its table. Keep this forward migration idempotent so both fresh
-- and drifted databases converge on the same schema.
DO $$ BEGIN
  CREATE TYPE "public"."project_member_roles" AS ENUM('owner', 'admin', 'viewer', 'member');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tbl_project_member" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "project_id" uuid NOT NULL REFERENCES "public"."tbl_project"("id"),
  "user_id" uuid NOT NULL REFERENCES "public"."tbl_user"("id"),
  "role" "project_member_roles" DEFAULT 'member' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "tbl_unique_project_member" UNIQUE("project_id", "user_id")
);--> statement-breakpoint
ALTER TABLE "tbl_project_member" ALTER COLUMN "project_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "tbl_project_member" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_project_member_project_id" ON "tbl_project_member" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_project_member_user_id" ON "tbl_project_member" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_project_member_role" ON "tbl_project_member" USING btree ("role");
