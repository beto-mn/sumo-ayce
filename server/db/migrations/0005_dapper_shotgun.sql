DROP INDEX "branches_postal_code_idx";--> statement-breakpoint
ALTER TABLE "branches" DROP COLUMN "postal_code";--> statement-breakpoint
ALTER TABLE "branches" DROP COLUMN "phone";--> statement-breakpoint
ALTER TABLE "branches" DROP COLUMN "schedule";