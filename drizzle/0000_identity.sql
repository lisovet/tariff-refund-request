CREATE TABLE "customers" (
	"id" text PRIMARY KEY DEFAULT 'cus_' || encode(gen_random_bytes(12), 'hex') NOT NULL,
	"clerk_user_id" text NOT NULL,
	"email" text NOT NULL,
	"full_name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "customers_clerk_user_id_unique" UNIQUE("clerk_user_id")
);
--> statement-breakpoint
CREATE TABLE "staff_users" (
	"id" text PRIMARY KEY DEFAULT 'stf_' || encode(gen_random_bytes(12), 'hex') NOT NULL,
	"clerk_user_id" text NOT NULL,
	"role" text NOT NULL,
	"name" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "staff_users_clerk_user_id_unique" UNIQUE("clerk_user_id")
);
