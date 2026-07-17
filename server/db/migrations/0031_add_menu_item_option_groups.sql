-- Generic, reusable option-groups schema (feature 027, Parts C & E) — attachable
-- to ANY menu item, not Ramen/Vaso-Sumo-specific in shape. Structurally the same
-- two-level group→choice pattern already proven by drink_group→drink_sub_group;
-- editability/consumption model validated by the existing `sauces` table +
-- `MenuSaucePicker.vue`.
CREATE TABLE IF NOT EXISTS "menu_item_option_groups" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "menu_item_id" uuid NOT NULL REFERENCES "menu_items"("id"),
  "key" varchar(60) NOT NULL,
  "name_es" varchar(80) NOT NULL,
  "name_en" varchar(80) NOT NULL,
  "display_order" integer NOT NULL DEFAULT 0,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "menu_item_option_groups_menu_item_key_unique" UNIQUE ("menu_item_id", "key")
);

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "menu_item_option_choices" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "option_group_id" uuid NOT NULL REFERENCES "menu_item_option_groups"("id"),
  "name_es" varchar(80) NOT NULL,
  "name_en" varchar(80) NOT NULL,
  "price_delta" decimal(8, 2) NOT NULL DEFAULT '0.00',
  "display_order" integer NOT NULL DEFAULT 0,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "menu_item_option_choices_price_nonnegative" CHECK ("price_delta" >= 0)
);

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "menu_item_option_groups_menu_item_idx"
  ON "menu_item_option_groups" ("menu_item_id", "display_order");

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "menu_item_option_choices_group_idx"
  ON "menu_item_option_choices" ("option_group_id", "display_order");
