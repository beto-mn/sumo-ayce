-- Add drink_sub_group table and link menu_items to it.

CREATE TABLE IF NOT EXISTS "drink_sub_group" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "drink_group_id" uuid NOT NULL REFERENCES "drink_group"("id"),
  "key" varchar(60) NOT NULL UNIQUE,
  "name_es" text NOT NULL,
  "name_en" text NOT NULL,
  "subtitle_es" text,
  "subtitle_en" text,
  "promo_es" text,
  "promo_en" text,
  "display_order" integer NOT NULL DEFAULT 0,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "drink_sub_group_group_order_idx"
  ON "drink_sub_group" ("drink_group_id", "display_order");

--> statement-breakpoint
ALTER TABLE "menu_items"
  ADD COLUMN IF NOT EXISTS "drink_sub_group_id" uuid
  REFERENCES "drink_sub_group"("id");
