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
--> statement-breakpoint
ALTER TABLE "menu_items" ADD COLUMN "price_bottle" numeric(8, 2);