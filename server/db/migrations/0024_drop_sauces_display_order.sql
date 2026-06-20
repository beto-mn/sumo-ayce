-- Drop display_order from sauces — ordering is handled by spice_level
DROP INDEX IF EXISTS "sauces_order_idx";
ALTER TABLE "sauces" DROP COLUMN IF EXISTS "display_order";
