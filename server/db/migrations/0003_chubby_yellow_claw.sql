ALTER TABLE "branches" ADD COLUMN "postal_code" varchar(10);--> statement-breakpoint
CREATE INDEX "branches_active_idx" ON "branches" USING btree ("is_active") WHERE is_active = true;--> statement-breakpoint
CREATE INDEX "branches_postal_code_idx" ON "branches" USING btree ("postal_code");--> statement-breakpoint
CREATE INDEX "branches_coords_idx" ON "branches" USING btree ("lat","lng");