ALTER TABLE "tbl_user" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "tbl_user" ALTER COLUMN "email" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "tbl_user" ALTER COLUMN "password_hash" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "tbl_user" ALTER COLUMN "first_name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "tbl_user" ALTER COLUMN "last_name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "tbl_user" ALTER COLUMN "jwt_version" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "tbl_user" ALTER COLUMN "is_active" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "tbl_user" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "tbl_user" ALTER COLUMN "updated_at" SET NOT NULL;