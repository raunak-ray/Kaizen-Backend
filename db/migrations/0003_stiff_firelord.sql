ALTER TABLE "tbl_project" ALTER COLUMN "name" SET DATA TYPE varchar(100);--> statement-breakpoint
ALTER TABLE "tbl_project" ALTER COLUMN "description" SET DATA TYPE varchar(2000);--> statement-breakpoint
CREATE INDEX "tbl_project_owner_id_idx" ON "tbl_project" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "tbl_project_visibility_idx" ON "tbl_project" USING btree ("visibility");--> statement-breakpoint
CREATE INDEX "tbl_project_is_archived_idx" ON "tbl_project" USING btree ("is_archived");