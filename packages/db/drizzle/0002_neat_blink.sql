ALTER TABLE "user" ADD COLUMN "boolean" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "video" ADD COLUMN "url" text NOT NULL;--> statement-breakpoint
ALTER TABLE "video" ADD COLUMN "converted" boolean DEFAULT false NOT NULL;