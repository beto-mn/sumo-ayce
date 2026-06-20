ALTER TABLE "sauces" ADD COLUMN "spice_level" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "sauces" ADD COLUMN "file_name" text;--> statement-breakpoint
ALTER TABLE "sauces" ADD CONSTRAINT "sauces_spice_level_range" CHECK ("sauces"."spice_level" >= 0 AND "sauces"."spice_level" <= 4);