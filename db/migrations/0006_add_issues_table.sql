CREATE TYPE "public"."issue_priority" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."issue_status" AS ENUM('todo', 'in-progress', 'done');--> statement-breakpoint
CREATE TYPE "public"."issue_type" AS ENUM('task', 'bug-fix');--> statement-breakpoint
CREATE TABLE "tbl_issue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"reporter_id" uuid NOT NULL,
	"assignee_id" uuid,
	"title" varchar(255) NOT NULL,
	"description" varchar(2000),
	"status" "issue_status" DEFAULT 'todo' NOT NULL,
	"priority" "issue_priority" DEFAULT 'medium' NOT NULL,
	"type" "issue_type" DEFAULT 'task' NOT NULL,
	"archived" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tbl_issue" ADD CONSTRAINT "tbl_issue_project_id_tbl_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."tbl_project"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tbl_issue" ADD CONSTRAINT "tbl_issue_reporter_id_tbl_user_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."tbl_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tbl_issue" ADD CONSTRAINT "tbl_issue_assignee_id_tbl_user_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."tbl_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_issue_project_id" ON "tbl_issue" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_issue_assignee_id" ON "tbl_issue" USING btree ("assignee_id");--> statement-breakpoint
CREATE INDEX "idx_issue_reporter_id" ON "tbl_issue" USING btree ("reporter_id");--> statement-breakpoint
CREATE INDEX "idx_issue_status" ON "tbl_issue" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_issue_priority" ON "tbl_issue" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "idx_issue_type" ON "tbl_issue" USING btree ("type");