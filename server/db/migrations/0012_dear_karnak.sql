DO $$ BEGIN
  CREATE TYPE "public"."branch_type" AS ENUM('ayce', 'express');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
ALTER TABLE "branches" ADD COLUMN IF NOT EXISTS "type" "branch_type" DEFAULT 'ayce' NOT NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "branches_type_idx" ON "branches" USING btree ("type");
