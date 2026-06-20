ALTER TABLE "branches" ADD COLUMN "code" varchar(60);--> statement-breakpoint
ALTER TABLE "branches" ADD COLUMN "state" varchar(100);--> statement-breakpoint
ALTER TABLE "branches" ADD COLUMN "schedule" jsonb;--> statement-breakpoint
ALTER TABLE "branches" ADD CONSTRAINT "branches_code_unique" UNIQUE("code");