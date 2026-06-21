ALTER TABLE "sauces" ADD COLUMN IF NOT EXISTS "spice_level" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "sauces" ADD COLUMN IF NOT EXISTS "file_name" text;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "sauces" ADD CONSTRAINT "sauces_spice_level_range" CHECK ("sauces"."spice_level" >= 0 AND "sauces"."spice_level" <= 4);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
