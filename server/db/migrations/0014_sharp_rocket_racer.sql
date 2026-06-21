DO $$ BEGIN
  ALTER TABLE "menu_items" ALTER COLUMN "drink_group" SET DATA TYPE text;
EXCEPTION WHEN undefined_column THEN NULL;
END $$;
--> statement-breakpoint
DROP TYPE IF EXISTS "public"."drink_group";
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."drink_group" AS ENUM('jumbo_cocktails', 'cantaritos_sumo_cups', 'non_alcoholic', 'sodas', 'coffee_digestifs', 'beers', 'spirits');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  UPDATE "menu_items" SET "drink_group" = 'beers' WHERE "drink_group" = 'beers_spirits';
EXCEPTION WHEN undefined_column THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "menu_items" ALTER COLUMN "drink_group" SET DATA TYPE "public"."drink_group" USING "drink_group"::"public"."drink_group";
EXCEPTION WHEN undefined_column THEN NULL;
END $$;
