CREATE TABLE "integration_submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"source_platform" varchar(30) DEFAULT 'baekjoon' NOT NULL,
	"submission_id" varchar(64) NOT NULL,
	"team_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"member_handle" varchar(50) NOT NULL,
	"problem_id" integer NOT NULL,
	"language" varchar(100) NOT NULL,
	"source_code" text NOT NULL,
	"runtime_ms" integer,
	"memory_kb" integer,
	"result" varchar(30) NOT NULL,
	"submitted_at_raw" varchar(50),
	"captured_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "integration_submissions" ADD CONSTRAINT "integration_submissions_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integration_submissions" ADD CONSTRAINT "integration_submissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "integration_submissions_team_submission_uidx" ON "integration_submissions" USING btree ("team_id","submission_id");