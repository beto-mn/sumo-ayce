CREATE TYPE "public"."drink_group" AS ENUM('jumbo_cocktails', 'cantaritos_sumo_cups', 'non_alcoholic', 'sodas', 'coffee_digestifs', 'beers_spirits');--> statement-breakpoint
CREATE TYPE "public"."menu_category_key" AS ENUM('entradas', 'burgers', 'sandwich', 'burritos', 'hotdogs', 'frio', 'caliente', 'dulce', 'postres', 'alitas', 'salsas', 'extras', 'bebidas');--> statement-breakpoint
CREATE TYPE "public"."menu_location_type" AS ENUM('ayce', 'express', 'both');--> statement-breakpoint
CREATE TABLE "dishes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid NOT NULL,
	"name_es" varchar(120) NOT NULL,
	"name_en" varchar(120) NOT NULL,
	"description_es" text DEFAULT '' NOT NULL,
	"description_en" text DEFAULT '' NOT NULL,
	"location_type" "menu_location_type" DEFAULT 'both' NOT NULL,
	"price" numeric(8, 2),
	"included_in_ayce" boolean DEFAULT true NOT NULL,
	"image_url" text,
	"file_name" text,
	"badge" varchar(40),
	"featured" boolean DEFAULT false NOT NULL,
	"drink_group" "drink_group",
	"requires_sauce" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "dishes_price_nonnegative" CHECK (price IS NULL OR price >= 0),
	CONSTRAINT "dishes_order_nonnegative" CHECK ("dishes"."display_order" >= 0)
);
--> statement-breakpoint
CREATE TABLE "menu_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" "menu_category_key" NOT NULL,
	"name_es" varchar(80) NOT NULL,
	"name_en" varchar(80) NOT NULL,
	"display_order" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"file_name" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "menu_categories_key_unique" UNIQUE("key"),
	CONSTRAINT "menu_categories_order_nonnegative" CHECK ("menu_categories"."display_order" >= 0)
);
--> statement-breakpoint
CREATE TABLE "sauces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name_es" varchar(60) NOT NULL,
	"name_en" varchar(60) NOT NULL,
	"file_name" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sauces_order_nonnegative" CHECK ("sauces"."display_order" >= 0)
);
--> statement-breakpoint
ALTER TABLE "dishes" ADD CONSTRAINT "dishes_category_id_menu_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."menu_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "dishes_featured_active_idx" ON "dishes" USING btree ("featured","is_active") WHERE featured = true AND is_active = true;--> statement-breakpoint
CREATE INDEX "dishes_category_order_idx" ON "dishes" USING btree ("category_id","display_order");--> statement-breakpoint
CREATE INDEX "dishes_location_type_idx" ON "dishes" USING btree ("location_type");--> statement-breakpoint
CREATE UNIQUE INDEX "menu_categories_key_idx" ON "menu_categories" USING btree ("key");--> statement-breakpoint
CREATE INDEX "menu_categories_order_idx" ON "menu_categories" USING btree ("display_order");--> statement-breakpoint
CREATE INDEX "sauces_order_idx" ON "sauces" USING btree ("display_order");
