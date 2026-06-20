ALTER TABLE "menu_items" DROP CONSTRAINT "dishes_price_nonnegative";--> statement-breakpoint
ALTER TABLE "menu_items" DROP CONSTRAINT "dishes_order_nonnegative";--> statement-breakpoint
DROP INDEX "dishes_featured_active_idx";--> statement-breakpoint
DROP INDEX "dishes_category_order_idx";--> statement-breakpoint
DROP INDEX "dishes_location_type_idx";--> statement-breakpoint
CREATE INDEX "menu_items_featured_active_idx" ON "menu_items" USING btree ("featured","is_active") WHERE featured = true AND is_active = true;--> statement-breakpoint
CREATE INDEX "menu_items_category_order_idx" ON "menu_items" USING btree ("category_id","display_order");--> statement-breakpoint
CREATE INDEX "menu_items_location_type_idx" ON "menu_items" USING btree ("location_type");--> statement-breakpoint
ALTER TABLE "menu_items" DROP COLUMN "image_url";--> statement-breakpoint
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_price_nonnegative" CHECK (price IS NULL OR price >= 0);--> statement-breakpoint
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_order_nonnegative" CHECK ("menu_items"."display_order" >= 0);