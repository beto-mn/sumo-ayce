ALTER TABLE "redemptions" ALTER COLUMN "status" SET DEFAULT 'used';--> statement-breakpoint
ALTER TABLE "redemptions" ALTER COLUMN "used_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "redemptions" ALTER COLUMN "used_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "branches" ADD COLUMN "manager_phone" varchar(20);--> statement-breakpoint
ALTER TABLE "loyalty_transactions" ADD COLUMN "ticket_id" varchar(100);--> statement-breakpoint
ALTER TABLE "loyalty_transactions" ADD COLUMN "created_by" uuid;--> statement-breakpoint
ALTER TABLE "redemptions" ADD COLUMN "ticket_id" varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE "redemptions" ADD COLUMN "created_by" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "staff_users" ADD COLUMN "phone" varchar(20);--> statement-breakpoint
ALTER TABLE "loyalty_transactions" ADD CONSTRAINT "loyalty_transactions_created_by_staff_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."staff_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "redemptions" ADD CONSTRAINT "redemptions_created_by_staff_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."staff_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "loyalty_transactions_ticket_earn_idx" ON "loyalty_transactions" USING btree ("ticket_id") WHERE transaction_type = 'earn';--> statement-breakpoint
CREATE UNIQUE INDEX "redemptions_ticket_id_idx" ON "redemptions" USING btree ("ticket_id");