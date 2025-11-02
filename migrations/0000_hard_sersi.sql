CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password" text,
	"google_id" text,
	"name" text NOT NULL,
	"picture" text,
	"credits" integer DEFAULT 0 NOT NULL,
	"stripe_customer_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_login" timestamp,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_google_id_unique" UNIQUE("google_id")
);
--> statement-breakpoint
CREATE TABLE "video_operations" (
	"id" text PRIMARY KEY NOT NULL,
	"operation_id" text,
	"status" text NOT NULL,
	"prompt" text NOT NULL,
	"image_path" text,
	"video_url" text,
	"error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"user_id" text
);
