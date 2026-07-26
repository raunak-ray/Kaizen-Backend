CREATE TABLE "tbl_issue_type" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" varchar(500),
	"icon" varchar(50),
	"archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_issue_type_project_name" UNIQUE("project_id","name")
);
--> statement-breakpoint
ALTER TABLE "tbl_issue_type" ADD CONSTRAINT "tbl_issue_type_project_id_tbl_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."tbl_project"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_issue_type_project_id" ON "tbl_issue_type" USING btree ("project_id");