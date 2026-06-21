ALTER TABLE "menu_items" ALTER COLUMN "drink_group" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."drink_group";--> statement-breakpoint
CREATE TYPE "public"."drink_group" AS ENUM('jumbo_cocktails', 'cantaritos_sumo_cups', 'non_alcoholic', 'sodas', 'coffee_digestifs', 'beers', 'spirits');--> statement-breakpoint
-- 'beers_spirits' was the legacy combined value; map it to 'beers' before casting back to the new enum.
UPDATE "menu_items" SET "drink_group" = 'beers' WHERE "drink_group" = 'beers_spirits';--> statement-breakpoint
ALTER TABLE "menu_items" ALTER COLUMN "drink_group" SET DATA TYPE "public"."drink_group" USING "drink_group"::"public"."drink_group";