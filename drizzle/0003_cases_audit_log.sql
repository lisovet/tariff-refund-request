CREATE TABLE "audit_log" (
	"id" text PRIMARY KEY DEFAULT 'aud_' || encode(gen_random_bytes(12), 'hex') NOT NULL,
	"case_id" text NOT NULL,
	"actor_id" text,
	"kind" text NOT NULL,
	"from_state" text,
	"to_state" text,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cases" (
	"id" text PRIMARY KEY DEFAULT 'cas_' || encode(gen_random_bytes(12), 'hex') NOT NULL,
	"customer_id" text,
	"screener_session_id" text,
	"state" text DEFAULT 'new_lead' NOT NULL,
	"tier" text NOT NULL,
	"owner_staff_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cases" ADD CONSTRAINT "cases_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cases" ADD CONSTRAINT "cases_screener_session_id_screener_sessions_id_fk" FOREIGN KEY ("screener_session_id") REFERENCES "public"."screener_sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cases" ADD CONSTRAINT "cases_owner_staff_id_staff_users_id_fk" FOREIGN KEY ("owner_staff_id") REFERENCES "public"."staff_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_log_case_idx" ON "audit_log" USING btree ("case_id","occurred_at");--> statement-breakpoint
CREATE INDEX "audit_log_kind_idx" ON "audit_log" USING btree ("kind");--> statement-breakpoint
CREATE INDEX "cases_state_idx" ON "cases" USING btree ("state");--> statement-breakpoint
CREATE INDEX "cases_owner_idx" ON "cases" USING btree ("owner_staff_id");--> statement-breakpoint
CREATE INDEX "cases_customer_idx" ON "cases" USING btree ("customer_id");--> statement-breakpoint
-- Audit log immutability per PRD 10. RLS-enforced DELETE deny so no
-- role (including app role) can remove rows. Inserts + reads are
-- granted at the GRANT level by the application bootstrap.
ALTER TABLE "audit_log" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "audit_log" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "audit_log_select_all" ON "audit_log" FOR SELECT USING (true);--> statement-breakpoint
CREATE POLICY "audit_log_insert_all" ON "audit_log" FOR INSERT WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "audit_log_no_update" ON "audit_log" FOR UPDATE USING (false);--> statement-breakpoint
CREATE POLICY "audit_log_no_delete" ON "audit_log" FOR DELETE USING (false);