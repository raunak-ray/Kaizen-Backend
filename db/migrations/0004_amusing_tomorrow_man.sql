CREATE TYPE "public"."project_member_roles" AS ENUM('owner', 'admin', 'viewer', 'member');--> statement-breakpoint
CREATE TABLE "tbl_project_member" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid,
	"user_id" uuid,
	"role" "project_member_roles" DEFAULT 'member' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tbl_unique_project_member" UNIQUE("project_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "tbl_project_member" ADD CONSTRAINT "tbl_project_member_project_id_tbl_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."tbl_project"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tbl_project_member" ADD CONSTRAINT "tbl_project_member_user_id_tbl_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."tbl_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_project_member_project_id" ON "tbl_project_member" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_project_member_user_id" ON "tbl_project_member" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_project_member_role" ON "tbl_project_member" USING btree ("role");