CREATE TYPE "public"."donation_type" AS ENUM('course', 'service', 'other');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('male', 'female', 'other', 'undisclosed');--> statement-breakpoint
CREATE TYPE "public"."participant_role" AS ENUM('president', 'vice_president', 'secretary', 'treasurer', 'vice_treasurer', 'board_member', 'other');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_enrollments" (
	"course_id" uuid NOT NULL,
	"participant_id" uuid NOT NULL,
	"enrolled_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "course_enrollments_course_id_participant_id_pk" PRIMARY KEY("course_id","participant_id")
);
--> statement-breakpoint
CREATE TABLE "course_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	CONSTRAINT "course_sessions_range" CHECK ("course_sessions"."ends_at" > "course_sessions"."starts_at")
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"location" text,
	"instructor_id" uuid,
	"color" text DEFAULT '#2563eb' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "donations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"participant_id" uuid,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"family_name" text,
	"email" text,
	"phone" text,
	"amount_cents" integer NOT NULL,
	"type" "donation_type" NOT NULL,
	"donated_on" date NOT NULL,
	"received_by_id" uuid NOT NULL,
	"notes" text,
	"created_by_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "donations_amount_positive" CHECK ("donations"."amount_cents" > 0)
);
--> statement-breakpoint
CREATE TABLE "participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"family_name" text,
	"email" text,
	"phone" text,
	"gender" "gender" DEFAULT 'undisclosed' NOT NULL,
	"role" "participant_role" DEFAULT 'other' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_assignments" (
	"service_id" uuid NOT NULL,
	"participant_id" uuid NOT NULL,
	"task" text,
	CONSTRAINT "service_assignments_service_id_participant_id_pk" PRIMARY KEY("service_id","participant_id")
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"location" text,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "services_range" CHECK ("services"."ends_at" > "services"."starts_at")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"impersonated_by" text,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"role" text DEFAULT 'viewer',
	"banned" boolean DEFAULT false,
	"ban_reason" text,
	"ban_expires" timestamp,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_sessions" ADD CONSTRAINT "course_sessions_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_instructor_id_participants_id_fk" FOREIGN KEY ("instructor_id") REFERENCES "public"."participants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donations" ADD CONSTRAINT "donations_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donations" ADD CONSTRAINT "donations_received_by_id_participants_id_fk" FOREIGN KEY ("received_by_id") REFERENCES "public"."participants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donations" ADD CONSTRAINT "donations_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_assignments" ADD CONSTRAINT "service_assignments_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_assignments" ADD CONSTRAINT "service_assignments_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "course_sessions_starts_idx" ON "course_sessions" USING btree ("starts_at");--> statement-breakpoint
CREATE INDEX "course_sessions_course_idx" ON "course_sessions" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "donations_donated_on_idx" ON "donations" USING btree ("donated_on");--> statement-breakpoint
CREATE INDEX "donations_type_idx" ON "donations" USING btree ("type");--> statement-breakpoint
CREATE INDEX "donations_participant_idx" ON "donations" USING btree ("participant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "participants_email_unique" ON "participants" USING btree (lower("email"));--> statement-breakpoint
CREATE INDEX "participants_name_idx" ON "participants" USING btree ("last_name","first_name");--> statement-breakpoint
CREATE INDEX "participants_role_idx" ON "participants" USING btree ("role");--> statement-breakpoint
CREATE INDEX "services_starts_idx" ON "services" USING btree ("starts_at");