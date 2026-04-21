CREATE TABLE "batch_entries" (
	"batch_id" text NOT NULL,
	"entry_id" text NOT NULL,
	"position" integer NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "batch_entries_batch_id_entry_id_pk" PRIMARY KEY("batch_id","entry_id")
);
--> statement-breakpoint
CREATE TABLE "batches" (
	"id" text PRIMARY KEY DEFAULT 'bat_' || encode(gen_random_bytes(12), 'hex') NOT NULL,
	"case_id" text NOT NULL,
	"label" text NOT NULL,
	"phase_flag" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"validation_run_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "batch_entries" ADD CONSTRAINT "batch_entries_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batch_entries" ADD CONSTRAINT "batch_entries_entry_id_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."entries"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batches" ADD CONSTRAINT "batches_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "batch_entries_batch_idx" ON "batch_entries" USING btree ("batch_id","position");--> statement-breakpoint
CREATE INDEX "batch_entries_entry_idx" ON "batch_entries" USING btree ("entry_id");--> statement-breakpoint
CREATE INDEX "batches_case_idx" ON "batches" USING btree ("case_id","created_at");--> statement-breakpoint
CREATE INDEX "batches_status_idx" ON "batches" USING btree ("status");