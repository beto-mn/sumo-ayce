ALTER TABLE "staff_users" ALTER COLUMN "role" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."staff_role";--> statement-breakpoint
CREATE TYPE "public"."staff_role" AS ENUM('staff', 'admin', 'owner');--> statement-breakpoint
ALTER TABLE "staff_users" ALTER COLUMN "role" SET DATA TYPE "public"."staff_role" USING "role"::"public"."staff_role";--> statement-breakpoint
ALTER TABLE "loyalty_transactions" ADD COLUMN "voided_by" uuid;--> statement-breakpoint
ALTER TABLE "loyalty_transactions" ADD COLUMN "voided_at" timestamp;--> statement-breakpoint
ALTER TABLE "loyalty_transactions" ADD COLUMN "void_reason" text;--> statement-breakpoint
ALTER TABLE "loyalty_transactions" ADD CONSTRAINT "loyalty_transactions_voided_by_staff_users_id_fk" FOREIGN KEY ("voided_by") REFERENCES "public"."staff_users"("id") ON DELETE no action ON UPDATE no action;