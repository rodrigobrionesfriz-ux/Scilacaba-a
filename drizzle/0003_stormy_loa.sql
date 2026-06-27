ALTER TABLE "users" ADD COLUMN "username" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "display_username" text;--> statement-breakpoint
UPDATE "users" SET "username" = lower("id") WHERE "username" IS NULL;--> statement-breakpoint
UPDATE "users" SET "display_username" = "nombre" WHERE "display_username" IS NULL;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_username_unique" UNIQUE("username");