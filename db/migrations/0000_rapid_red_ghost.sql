CREATE TABLE "tbl_user" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" varchar(255),
	"password_hash" varchar(255),
	"first_name" varchar(255),
	"last_name" varchar(255),
	"jwt_version" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "tbl_user_email_unique" UNIQUE("email")
);
