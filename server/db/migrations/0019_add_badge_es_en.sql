DO $$ BEGIN
  ALTER TABLE "menu_items" RENAME COLUMN "badge" TO "badge_es";
EXCEPTION
  WHEN undefined_column THEN NULL;
  WHEN duplicate_column THEN NULL;
END $$;
--> statement-breakpoint
ALTER TABLE "menu_items" ADD COLUMN IF NOT EXISTS "badge_en" varchar(40);
