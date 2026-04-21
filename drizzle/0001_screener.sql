CREATE TABLE "leads" (
	"id" text PRIMARY KEY DEFAULT 'lead_' || encode(gen_random_bytes(12), 'hex') NOT NULL,
	"email" text NOT NULL,
	"company" text,
	"screener_session_id" text,
	"source" text DEFAULT 'screener' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "screener_sessions" (
	"id" text PRIMARY KEY DEFAULT 'sess_' || encode(gen_random_bytes(16), 'hex') NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"answers" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"result" jsonb,
	"result_version" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_screener_session_id_screener_sessions_id_fk" FOREIGN KEY ("screener_session_id") REFERENCES "public"."screener_sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "leads_email_session_idx" ON "leads" USING btree ("email","screener_session_id");