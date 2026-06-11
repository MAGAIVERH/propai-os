CREATE EXTENSION IF NOT EXISTS vector;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "embedding" vector(1536);--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "embedding_updated_at" timestamp with time zone;
