CREATE TABLE "payments" (
	"id" text PRIMARY KEY DEFAULT 'pay_' || encode(gen_random_bytes(12), 'hex') NOT NULL,
	"case_id" text NOT NULL,
	"kind" text NOT NULL,
	"stripe_event_id" text,
	"stripe_charge_id" text,
	"stripe_invoice_id" text,
	"sku" text,
	"amount_usd_cents" bigint NOT NULL,
	"currency" text DEFAULT 'usd' NOT NULL,
	"status" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payments_stripe_event_id_unique" UNIQUE("stripe_event_id")
);
--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "payments_case_idx" ON "payments" USING btree ("case_id","occurred_at");--> statement-breakpoint
CREATE INDEX "payments_kind_idx" ON "payments" USING btree ("kind");