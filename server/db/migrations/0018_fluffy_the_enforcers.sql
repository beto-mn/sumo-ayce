ALTER TABLE "sauces" DROP CONSTRAINT "sauces_spice_level_range";--> statement-breakpoint
ALTER TABLE "sauces" ADD CONSTRAINT "sauces_spice_level_nonnegative" CHECK ("sauces"."spice_level" >= 0);