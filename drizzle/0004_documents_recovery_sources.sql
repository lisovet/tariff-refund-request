CREATE TABLE "documents" (
	"id" text PRIMARY KEY DEFAULT 'doc_' || encode(gen_random_bytes(12), 'hex') NOT NULL,
	"case_id" text NOT NULL,
	"storage_key" text NOT NULL,
	"filename" text NOT NULL,
	"content_type" text NOT NULL,
	"byte_size" bigint NOT NULL,
	"sha256" text NOT NULL,
	"uploaded_by" text NOT NULL,
	"uploaded_by_actor_id" text,
	"version" bigint DEFAULT 1 NOT NULL,
	"supersedes_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "documents_storage_key_unique" UNIQUE("storage_key"),
	CONSTRAINT "documents_case_sha256_unique" UNIQUE("case_id","sha256")
);
--> statement-breakpoint
CREATE TABLE "recovery_sources" (
	"id" text PRIMARY KEY DEFAULT 'rsrc_' || encode(gen_random_bytes(12), 'hex') NOT NULL,
	"case_id" text NOT NULL,
	"path" text NOT NULL,
	"kind" text NOT NULL,
	"document_id" text NOT NULL,
	"uploaded_by" text NOT NULL,
	"uploaded_by_actor_id" text,
	"confidence" text DEFAULT 'pending' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recovery_sources" ADD CONSTRAINT "recovery_sources_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recovery_sources" ADD CONSTRAINT "recovery_sources_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "documents_case_idx" ON "documents" USING btree ("case_id","created_at");--> statement-breakpoint
CREATE INDEX "recovery_sources_case_idx" ON "recovery_sources" USING btree ("case_id","created_at");--> statement-breakpoint
CREATE INDEX "recovery_sources_document_idx" ON "recovery_sources" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "recovery_sources_confidence_idx" ON "recovery_sources" USING btree ("confidence");