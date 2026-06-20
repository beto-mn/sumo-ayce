ALTER TABLE "menu_items" ALTER COLUMN "drink_group" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."drink_group";--> statement-breakpoint
CREATE TYPE "public"."drink_group" AS ENUM('jumbo_cocktails', 'cantaritos_sumo_cups', 'non_alcoholic', 'sodas', 'coffee_digestifs', 'beers', 'spirits');--> statement-breakpoint
ALTER TABLE "menu_items" ALTER COLUMN "drink_group" SET DATA TYPE "public"."drink_group" USING "drink_group"::"public"."drink_group";