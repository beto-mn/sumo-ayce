DO $$ BEGIN
  ALTER TABLE "sauces" DROP CONSTRAINT "sauces_spice_level_range";
EXCEPTION WHEN undefined_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "sauces" ADD CONSTRAINT "sauces_spice_level_nonnegative" CHECK ("sauces"."spice_level" >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
