-- Replace drink_group enum column in menu_items with a proper FK to drink_group_meta
-- then rename drink_group_meta → drink_group and drop the enum type

-- 1. Add FK column
ALTER TABLE "menu_items" ADD COLUMN "drink_group_id" UUID;

-- 2. Populate from existing enum values via group_key match
UPDATE "menu_items" mi
SET "drink_group_id" = dg.id
FROM "drink_group_meta" dg
WHERE mi."drink_group"::text = dg."group_key";

-- 3. Add FK constraint
ALTER TABLE "menu_items"
  ADD CONSTRAINT "menu_items_drink_group_id_fkey"
  FOREIGN KEY ("drink_group_id") REFERENCES "drink_group_meta"("id");

-- 4. Drop old enum column
ALTER TABLE "menu_items" DROP COLUMN "drink_group";

-- 5. Convert group_key from enum to varchar so we can drop the type
ALTER TABLE "drink_group_meta"
  ALTER COLUMN "group_key" TYPE varchar(60) USING "group_key"::text;

-- 6. Drop enum type
DROP TYPE IF EXISTS "drink_group";

-- 7. Rename table
ALTER TABLE "drink_group_meta" RENAME TO "drink_group";
