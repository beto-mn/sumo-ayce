CREATE TYPE "public"."branch_type" AS ENUM('ayce', 'express');--> statement-breakpoint
ALTER TABLE "branches" ADD COLUMN "type" "branch_type" DEFAULT 'ayce' NOT NULL;--> statement-breakpoint
CREATE INDEX "branches_type_idx" ON "branches" USING btree ("type");