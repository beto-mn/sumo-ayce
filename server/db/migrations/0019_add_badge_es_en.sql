ALTER TABLE "menu_items" RENAME COLUMN "badge" TO "badge_es";--> statement-breakpoint
ALTER TABLE "menu_items" ADD COLUMN "badge_en" varchar(40);
