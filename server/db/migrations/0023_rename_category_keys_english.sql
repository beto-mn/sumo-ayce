-- Rename all menu_category_key enum values from Spanish to English.
-- Approach: clear seeded data, rebuild enum, re-seed via pnpm db:seed.

-- 1. Clear both tables (truncate together to satisfy FK constraint)
TRUNCATE TABLE "public"."menu_items", "public"."menu_categories";

-- 2. Drop unique index and constraint on menu_categories.key
DROP INDEX IF EXISTS "public"."menu_categories_key_idx";
ALTER TABLE "public"."menu_categories" DROP CONSTRAINT IF EXISTS "menu_categories_key_unique";

-- 3. Temporarily cast key column to text so we can drop the enum
ALTER TABLE "public"."menu_categories"
  ALTER COLUMN "key" TYPE text USING "key"::text;

-- 4. Drop the old enum
DROP TYPE IF EXISTS "public"."menu_category_key";

-- 5. Create new enum with English keys
CREATE TYPE "public"."menu_category_key" AS ENUM (
  'appetizers',
  'salads',
  'rice',
  'ramen',
  'burgers',
  'sandwiches',
  'burritos',
  'hot_dogs',
  'cold_rolls',
  'hot_rolls',
  'sweet_rolls',
  'desserts',
  'wings',
  'sauces',
  'extras',
  'drinks',
  'kids'
);

-- 6. Cast the (empty) key column back to the new enum type
ALTER TABLE "public"."menu_categories"
  ALTER COLUMN "key" TYPE "public"."menu_category_key"
  USING "key"::"public"."menu_category_key";

-- 7. Restore unique constraint and index
ALTER TABLE "public"."menu_categories"
  ADD CONSTRAINT "menu_categories_key_unique" UNIQUE ("key");

CREATE UNIQUE INDEX "menu_categories_key_idx"
  ON "public"."menu_categories" USING btree ("key");
