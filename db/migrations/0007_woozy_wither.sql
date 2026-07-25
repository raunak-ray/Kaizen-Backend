CREATE TYPE "public"."issue_status_category_enum" AS ENUM('todo', 'in-progress', 'done');--> statement-breakpoint
CREATE TABLE "tbl_issue_status" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"category" "issue_status_category_enum" DEFAULT 'todo' NOT NULL,
	"position" integer NOT NULL,
	"archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_issue_status_project_name" UNIQUE("project_id","name")
);
--> statement-breakpoint
ALTER TABLE "tbl_issue_status" ADD CONSTRAINT "tbl_issue_status_project_id_tbl_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."tbl_project"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_issue_status_project_id" ON "tbl_issue_status" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_issue_status_category" ON "tbl_issue_status" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_issue_status_position" ON "tbl_issue_status" USING btree ("position");