ALTER TABLE "menu_items" DROP CONSTRAINT "menu_items_price_nonnegative";--> statement-breakpoint
ALTER TABLE "menu_items" DROP CONSTRAINT "menu_items_order_nonnegative";--> statement-breakpoint
ALTER TABLE "menu_items" ADD CONSTRAINT "dishes_price_nonnegative" CHECK (price IS NULL OR price >= 0);--> statement-breakpoint
ALTER TABLE "menu_items" ADD CONSTRAINT "dishes_order_nonnegative" CHECK ("menu_items"."display_order" >= 0);