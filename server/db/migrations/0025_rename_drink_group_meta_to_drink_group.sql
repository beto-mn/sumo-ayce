-- Replace drink_group enum column in menu_items with a proper FK to drink_group_meta
-- then rename drink_group_meta → drink_group and drop the enum type.

-- 1. Add FK column (idempotent)
ALTER TABLE "menu_items" ADD COLUMN IF NOT EXISTS "drink_group_id" UUID;

--> statement-breakpoint
DO $$ DECLARE
  meta_exists boolean;
  dg_exists   boolean;
  col_exists  boolean;
  fk_exists   boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'drink_group_meta'
  ) INTO meta_exists;

  SELECT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'drink_group'
  ) INTO dg_exists;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'menu_items' AND column_name = 'drink_group'
  ) INTO col_exists;

  SELECT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'menu_items_drink_group_id_fkey'
  ) INTO fk_exists;

  -- 2. Populate FK column from whichever source table exists
  IF col_exists THEN
    IF meta_exists THEN
      EXECUTE '
        UPDATE "menu_items" mi
        SET "drink_group_id" = dg.id
        FROM "drink_group_meta" dg
        WHERE mi."drink_group"::text = dg."group_key"::text
          AND mi."drink_group_id" IS NULL
      ';
    ELSIF dg_exists THEN
      EXECUTE '
        UPDATE "menu_items" mi
        SET "drink_group_id" = dg.id
        FROM "drink_group" dg
        WHERE mi."drink_group"::text = dg."group_key"::text
          AND mi."drink_group_id" IS NULL
      ';
    END IF;
  END IF;

  -- 3. Add FK constraint pointing to whichever table exists
  IF NOT fk_exists THEN
    IF meta_exists THEN
      ALTER TABLE "menu_items"
        ADD CONSTRAINT "menu_items_drink_group_id_fkey"
        FOREIGN KEY ("drink_group_id") REFERENCES "drink_group_meta"("id");
    ELSIF dg_exists THEN
      ALTER TABLE "menu_items"
        ADD CONSTRAINT "menu_items_drink_group_id_fkey"
        FOREIGN KEY ("drink_group_id") REFERENCES "drink_group"("id");
    END IF;
  END IF;

  -- 4. Drop old enum column
  IF col_exists THEN
    ALTER TABLE "menu_items" DROP COLUMN "drink_group";
  END IF;

  -- 5 + 7. Only needed when drink_group_meta still exists (pre-rename state)
  IF meta_exists THEN
    -- 5. Convert group_key from enum to varchar so we can drop the enum type
    ALTER TABLE "drink_group_meta"
      ALTER COLUMN "group_key" TYPE varchar(60) USING "group_key"::text;

    -- 6. Drop enum type (only if it is actually an enum — not the table composite type)
    IF EXISTS (
      SELECT 1 FROM pg_type t
      JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE t.typname = 'drink_group' AND t.typtype = 'e' AND n.nspname = 'public'
    ) THEN
      DROP TYPE "public"."drink_group";
    END IF;

    -- 7. Rename table (only if target name is still free)
    IF NOT dg_exists THEN
      ALTER TABLE "drink_group_meta" RENAME TO "drink_group";
    END IF;

  ELSE
    -- drink_group_meta already renamed; drop enum type if it still lingers as an enum
    IF EXISTS (
      SELECT 1 FROM pg_type t
      JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE t.typname = 'drink_group' AND t.typtype = 'e' AND n.nspname = 'public'
    ) THEN
      DROP TYPE "public"."drink_group";
    END IF;
  END IF;
END $$;
