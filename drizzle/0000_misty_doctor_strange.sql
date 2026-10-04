CREATE TABLE "activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" text DEFAULT 'Onboard' NOT NULL,
	"availability" text DEFAULT 'available' NOT NULL,
	"image" text,
	"active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "b2b_enquiries" (
	"id" serial PRIMARY KEY NOT NULL,
	"ref" text NOT NULL,
	"company_name" text NOT NULL,
	"contact_person" text NOT NULL,
	"email" text NOT NULL,
	"whatsapp" text NOT NULL,
	"country" text NOT NULL,
	"business_type" text NOT NULL,
	"monthly_bookings" text,
	"interested_product" text NOT NULL,
	"departure_location" text,
	"message" text,
	"status" text DEFAULT 'NEW' NOT NULL,
	"admin_notes" text,
	"email_sent" boolean DEFAULT false NOT NULL,
	"email_sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "b2b_enquiries_ref_unique" UNIQUE("ref")
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" serial PRIMARY KEY NOT NULL,
	"ref" text NOT NULL,
	"name" text NOT NULL,
	"whatsapp" text NOT NULL,
	"guests" integer NOT NULL,
	"trip_type_id" integer,
	"trip_type" text NOT NULL,
	"destination" text NOT NULL,
	"trip_date" date NOT NULL,
	"pickup_time" text NOT NULL,
	"dropoff_time" text NOT NULL,
	"pickup_location" text NOT NULL,
	"dropoff_location" text NOT NULL,
	"food_prefs" text[] DEFAULT '{}' NOT NULL,
	"activity_requests" text[] DEFAULT '{}' NOT NULL,
	"special_requests" text,
	"status" text DEFAULT 'NEW' NOT NULL,
	"admin_notes" text,
	"sheets_synced" boolean DEFAULT false NOT NULL,
	"sheets_synced_at" timestamp with time zone,
	"email_sent" boolean DEFAULT false NOT NULL,
	"email_sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bookings_ref_unique" UNIQUE("ref")
);
--> statement-breakpoint
CREATE TABLE "destinations" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"tagline" text,
	"description" text NOT NULL,
	"image" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "outbox" (
	"id" serial PRIMARY KEY NOT NULL,
	"channel" text NOT NULL,
	"recipient" text,
	"subject" text,
	"body" text NOT NULL,
	"meta" jsonb,
	"sent" boolean DEFAULT false NOT NULL,
	"error" text,
	"booking_ref" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"user_id" integer NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscribers" (
	"id" serial PRIMARY KEY NOT NULL,
	"whatsapp" text NOT NULL,
	"source" text DEFAULT 'website' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "testimonials" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"origin" text,
	"trip_type" text,
	"quote" text NOT NULL,
	"placeholder" boolean DEFAULT false NOT NULL,
	"approved" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trip_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"duration" text,
	"kind" text DEFAULT 'day' NOT NULL,
	"capacity" integer DEFAULT 17 NOT NULL,
	"image" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" text DEFAULT 'admin' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "yachts" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"summary" text NOT NULL,
	"max_speed_knots" integer NOT NULL,
	"max_speed_kmh" double precision NOT NULL,
	"bedrooms" integer NOT NULL,
	"beds" integer NOT NULL,
	"washrooms" integer NOT NULL,
	"air_conditioned" boolean DEFAULT true NOT NULL,
	"max_day_guests" integer NOT NULL,
	"max_overnight_guests" integer NOT NULL,
	"crew" integer NOT NULL,
	"hero_image" text NOT NULL,
	"gallery" jsonb NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "yachts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_trip_type_id_trip_types_id_fk" FOREIGN KEY ("trip_type_id") REFERENCES "public"."trip_types"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "activities_slug_idx" ON "activities" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "bookings_ref_idx" ON "bookings" USING btree ("ref");--> statement-breakpoint
CREATE UNIQUE INDEX "destinations_slug_idx" ON "destinations" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "subscribers_whatsapp_idx" ON "subscribers" USING btree ("whatsapp");--> statement-breakpoint
CREATE UNIQUE INDEX "trip_types_slug_idx" ON "trip_types" USING btree ("slug");