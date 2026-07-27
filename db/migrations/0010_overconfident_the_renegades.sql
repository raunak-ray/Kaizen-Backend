CREATE TABLE "tbl_issue_label" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"color" varchar(7) NOT NULL,
	"description" varchar(255),
	"archieved" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_issue_label_project_name" UNIQUE("project_id","name")
);
--> statement-breakpoint
ALTER TABLE "tbl_issue_label" ADD CONSTRAINT "tbl_issue_label_project_id_tbl_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."tbl_project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_issue_label_project_id" ON "tbl_issue_label" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_issue_label_name" ON "tbl_issue_label" USING btree ("name");