ALTER TYPE "public"."reservation_status" ADD VALUE 'rejected' BEFORE 'cancelled';--> statement-breakpoint
ALTER TYPE "public"."reservation_status" ADD VALUE 'escalated';--> statement-breakpoint
ALTER TYPE "public"."reservation_status" ADD VALUE 'cancelled_auto';--> statement-breakpoint
ALTER TABLE "branches" ADD COLUMN "whatsapp_reservaciones" varchar(20);--> statement-breakpoint
ALTER TABLE "branches" ADD COLUMN "whatsapp_reservaciones_backup" varchar(20);--> statement-breakpoint
ALTER TABLE "reservations" ADD COLUMN "folio" varchar(8) NOT NULL;--> statement-breakpoint
ALTER TABLE "reservations" ADD COLUMN "first_reminder_at" timestamp;--> statement-breakpoint
ALTER TABLE "reservations" ADD COLUMN "escalated_at" timestamp;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_folio_unique" UNIQUE("folio");