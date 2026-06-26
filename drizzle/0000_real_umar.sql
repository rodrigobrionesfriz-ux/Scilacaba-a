CREATE TABLE "_health" (
	"id" serial PRIMARY KEY NOT NULL,
	"checked_at" timestamp DEFAULT now() NOT NULL
);
