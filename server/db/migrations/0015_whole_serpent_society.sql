-- Only create drink_group_meta if the final table (drink_group) doesn't already exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'drink_group'
  ) THEN
    CREATE TABLE "drink_group_meta" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "group_key" "drink_group" NOT NULL,
      "subtitle_es" text,
      "subtitle_en" text,
      "promo_es" text,
      "promo_en" text,
      "created_at" timestamp DEFAULT now() NOT NULL,
      "updated_at" timestamp DEFAULT now() NOT NULL,
      CONSTRAINT "drink_group_meta_group_key_unique" UNIQUE("group_key")
    );
  END IF;
END $$;
--> statement-breakpoint
ALTER TABLE "menu_items" ADD COLUMN IF NOT EXISTS "price_bottle" numeric(8, 2);
