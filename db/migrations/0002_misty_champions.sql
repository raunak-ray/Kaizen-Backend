CREATE TYPE "public"."project_visibility" AS ENUM('private', 'public');--> statement-breakpoint
CREATE TABLE "tbl_project" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"name" varchar(50) NOT NULL,
	"description" varchar(255),
	"owner_id" uuid NOT NULL,
	"visibility" "project_visibility" DEFAULT 'private' NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tbl_project_key_unique" UNIQUE("key")
);
--> statement-breakpoint
ALTER TABLE "tbl_project" ADD CONSTRAINT "tbl_project_owner_id_tbl_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."tbl_user"("id") ON DELETE no action ON UPDATE no action;