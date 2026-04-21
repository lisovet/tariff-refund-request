CREATE TABLE "entries" (
	"id" text PRIMARY KEY DEFAULT 'ent_' || encode(gen_random_bytes(12), 'hex') NOT NULL,
	"case_id" text NOT NULL,
	"entry_number" text NOT NULL,
	"entry_date" date,
	"importer_of_record" text,
	"duty_amount_usd_cents" bigint,
	"hts_codes" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"phase_flag" text,
	"validated_at" timestamp with time zone,
	"validated_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "entries_case_entry_number_unique" UNIQUE("case_id","entry_number")
);
--> statement-breakpoint
CREATE TABLE "entry_source_records" (
	"id" text PRIMARY KEY DEFAULT 'esrc_' || encode(gen_random_bytes(12), 'hex') NOT NULL,
	"entry_id" text NOT NULL,
	"recovery_source_id" text NOT NULL,
	"raw_data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"confidence" text DEFAULT 'pending' NOT NULL,
	"extracted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"extracted_by" text
);
--> statement-breakpoint
ALTER TABLE "entries" ADD CONSTRAINT "entries_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entry_source_records" ADD CONSTRAINT "entry_source_records_entry_id_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."entries"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entry_source_records" ADD CONSTRAINT "entry_source_records_recovery_source_id_recovery_sources_id_fk" FOREIGN KEY ("recovery_source_id") REFERENCES "public"."recovery_sources"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "entries_case_idx" ON "entries" USING btree ("case_id","created_at");--> statement-breakpoint
CREATE INDEX "entry_source_records_entry_idx" ON "entry_source_records" USING btree ("entry_id");--> statement-breakpoint
CREATE INDEX "entry_source_records_source_idx" ON "entry_source_records" USING btree ("recovery_source_id");