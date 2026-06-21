ALTER TABLE "branches" ADD COLUMN IF NOT EXISTS "code" varchar(60);
--> statement-breakpoint
ALTER TABLE "branches" ADD COLUMN IF NOT EXISTS "state" varchar(100);
--> statement-breakpoint
ALTER TABLE "branches" ADD COLUMN IF NOT EXISTS "schedule" jsonb;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "branches" ADD CONSTRAINT "branches_code_unique" UNIQUE("code");
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
