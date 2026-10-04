import type { PGlite } from "@electric-sql/pglite";

export async function initInMemoryDb(pg: PGlite) {
  // 1. Create tables
  const ddl = `
    CREATE TABLE IF NOT EXISTS "activities" (
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

    CREATE TABLE IF NOT EXISTS "b2b_enquiries" (
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

    CREATE TABLE IF NOT EXISTS "trip_types" (
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

    CREATE TABLE IF NOT EXISTS "bookings" (
      "id" serial PRIMARY KEY NOT NULL,
      "ref" text NOT NULL,
      "name" text NOT NULL,
      "whatsapp" text NOT NULL,
      "guests" integer NOT NULL,
      "trip_type_id" integer REFERENCES "trip_types"("id") ON DELETE SET NULL,
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

    CREATE TABLE IF NOT EXISTS "destinations" (
      "id" serial PRIMARY KEY NOT NULL,
      "slug" text NOT NULL,
      "name" text NOT NULL,
      "tagline" text,
      "description" text NOT NULL,
      "image" text NOT NULL,
      "active" boolean DEFAULT true NOT NULL,
      "sort_order" integer DEFAULT 0 NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "outbox" (
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

    CREATE TABLE IF NOT EXISTS "sessions" (
      "id" serial PRIMARY KEY NOT NULL,
      "token" text NOT NULL,
      "user_id" integer NOT NULL,
      "expires_at" timestamp with time zone NOT NULL,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      CONSTRAINT "sessions_token_unique" UNIQUE("token")
    );

    CREATE TABLE IF NOT EXISTS "settings" (
      "key" text PRIMARY KEY NOT NULL,
      "value" text NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "subscribers" (
      "id" serial PRIMARY KEY NOT NULL,
      "whatsapp" text NOT NULL,
      "source" text DEFAULT 'website' NOT NULL,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "testimonials" (
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

    CREATE TABLE IF NOT EXISTS "users" (
      "id" serial PRIMARY KEY NOT NULL,
      "name" text NOT NULL,
      "email" text NOT NULL,
      "password_hash" text NOT NULL,
      "role" text DEFAULT 'admin' NOT NULL,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      CONSTRAINT "users_email_unique" UNIQUE("email")
    );

    CREATE TABLE IF NOT EXISTS "yachts" (
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

    CREATE TABLE IF NOT EXISTS "media" (
      "id" serial PRIMARY KEY NOT NULL,
      "url" text NOT NULL UNIQUE,
      "filename" text NOT NULL,
      "original_name" text NOT NULL,
      "mime_type" text NOT NULL,
      "size_bytes" integer DEFAULT 0 NOT NULL,
      "category" text DEFAULT 'image' NOT NULL,
      "alt_text" text,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL
    );

    CREATE UNIQUE INDEX IF NOT EXISTS "activities_slug_idx" ON "activities" ("slug");
    CREATE UNIQUE INDEX IF NOT EXISTS "bookings_ref_idx" ON "bookings" ("ref");
    CREATE UNIQUE INDEX IF NOT EXISTS "destinations_slug_idx" ON "destinations" ("slug");
    CREATE UNIQUE INDEX IF NOT EXISTS "subscribers_whatsapp_idx" ON "subscribers" ("whatsapp");
    CREATE UNIQUE INDEX IF NOT EXISTS "trip_types_slug_idx" ON "trip_types" ("slug");
    CREATE UNIQUE INDEX IF NOT EXISTS "media_url_idx" ON "media" ("url");
  `;

  await pg.exec(ddl);

  // 2. Check if already seeded
  const check = await pg.query<{ count: string }>(
    `SELECT count(*) as count FROM "destinations"`
  );
  if (Number(check.rows[0]?.count ?? 0) > 0) {
    return;
  }

  // 3. Seed destinations
  await pg.query(
    `INSERT INTO "destinations" ("slug", "name", "tagline", "description", "image", "active", "sort_order")
     VALUES ($1, $2, $3, $4, $5, true, 0)`,
    [
      "male-atoll",
      "Malé Atoll",
      "Private departures on your own schedule across the lagoon.",
      "Salt Republic operates private yacht experiences around Malé Atoll. Board at your chosen pickup, leave the shoreline behind, and spend your hours on open water, reef and sandbank — with the yacht and crew entirely dedicated to you.",
      "https://at02gf7f3no98fex.public.blob.vercel-storage.com/male%20atoll.png",
    ]
  );

  // 4. Seed trip types
  const trips: [string, string, string, string | null, string, number, string, number][] = [
    ["half-day-private-charter", "Half-Day Private Charter", "A private half-day aboard Finch 65, tailored to how you want to spend your time on the ocean.", "Half Day", "day", 17, "https://at02gf7f3no98fex.public.blob.vercel-storage.com/Aerial%20Front%20Starboard%20Quarter%20View%20-%20Underway.webp", 1],
    ["full-day-private-charter", "Full-Day Private Charter", "A full day of privacy and freedom across the lagoon, with the yacht entirely yours.", "Full Day", "day", 17, "https://at02gf7f3no98fex.public.blob.vercel-storage.com/Aerial%20Overhead%20View%20-%20Underway%20Between%20Islands.webp", 2],
    ["overnight-28-hour-charter", "Overnight 28-Hour Charter", "An overnight escape with 28 hours aboard Finch 65 — wake up on the water, surrounded by the lagoon.", "28 Hours", "overnight", 10, "https://at02gf7f3no98fex.public.blob.vercel-storage.com/overnight-trip-1791094004109-4cr4.png", 3],
    ["overnight-36-hour-charter", "Overnight 36-Hour Charter", "A slower overnight journey — 36 hours to settle into life at sea.", "36 Hours", "overnight", 10, "https://at02gf7f3no98fex.public.blob.vercel-storage.com/3.%20Guest%20Room%201%20Master%20Room.webp", 4],
    ["fishing", "Fishing", "Private fishing experiences on the open ocean, equipped for a relaxed day on the water.", null, "day", 17, "https://at02gf7f3no98fex.public.blob.vercel-storage.com/team-fishing-trip-in-maldives.jpg", 5],
    ["sandbank-experiences", "Sandbank Experiences", "Your own setup on a secluded Maldivian sandbank, with the yacht anchored close by.", null, "day", 17, "https://at02gf7f3no98fex.public.blob.vercel-storage.com/Aerial%20Rear%20Quarter%20View%20-%20Stern%20Deck%20Over%20Reef.webp", 6],
    ["snorkeling", "Snorkeling", "Slip into clear lagoon water and explore the reef with equipment prepared onboard.", null, "day", 17, "https://at02gf7f3no98fex.public.blob.vercel-storage.com/Yacht%20front%20view%20with%20dolphins.webp", 7],
    ["sunset-experiences", "Sunset Experiences", "Golden hour at sea — an intimate way to end the day on the Indian Ocean.", "Sunset", "day", 17, "https://at02gf7f3no98fex.public.blob.vercel-storage.com/sunset-crusing-packages.jpg", 8],
    ["special-events", "Special Events", "Celebrations, gatherings and milestones, hosted privately aboard Finch 65.", null, "day", 17, "https://at02gf7f3no98fex.public.blob.vercel-storage.com/food.png", 9],
    ["bespoke-private-charter", "Bespoke Private Charter", "Tell us what you imagine. We'll design a private charter around your idea of the perfect day.", null, "day", 17, "https://at02gf7f3no98fex.public.blob.vercel-storage.com/Stern%20Eye-Level%20View%20-%20Underway%20with%20Dolphins.webp", 10],
  ];

  for (const [slug, name, description, duration, kind, capacity, image, sortOrder] of trips) {
    await pg.query(
      `INSERT INTO "trip_types" ("slug", "name", "description", "duration", "kind", "capacity", "image", "active", "sort_order")
       VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8)`,
      [slug, name, description, duration, kind, capacity, image, sortOrder]
    );
  }

  // 5. Seed activities
  const acts: [string, string, string, string, string, number][] = [
    ["jet-ski", "Jet Ski", "Water Toys", "on_request", "https://at02gf7f3no98fex.public.blob.vercel-storage.com/salt-republic-yacht-packages-5.jpg", 1],
    ["underwater-scooters", "Underwater Scooters", "Water Toys", "on_request", "https://at02gf7f3no98fex.public.blob.vercel-storage.com/salt-republic-yacht-packages-5.jpg", 2],
    ["inflatable-paddle-boat", "Inflatable Paddle Boat", "Water Toys", "available", "https://at02gf7f3no98fex.public.blob.vercel-storage.com/20.%20Full%20View%20of%20Dinghy.webp", 3],
    ["sup-boards", "SUP Boards", "Water Toys", "available", "https://at02gf7f3no98fex.public.blob.vercel-storage.com/salt-republic-yacht-packages-5.jpg", 4],
    ["paddle-boards", "Paddle Boards", "Water Toys", "available", "https://at02gf7f3no98fex.public.blob.vercel-storage.com/salt-republic-yacht-packages-5.jpg", 5],
    ["inflatable-slides", "Inflatable Slides", "Water Toys", "available", "https://at02gf7f3no98fex.public.blob.vercel-storage.com/19.%20Crane%20in%20Operation.webp", 6],
    ["trampolines", "Trampolines", "Water Toys", "available", "https://at02gf7f3no98fex.public.blob.vercel-storage.com/19.%20Crane%20in%20Operation.webp", 7],
    ["floaties", "Floaties", "Water Toys", "available", "https://at02gf7f3no98fex.public.blob.vercel-storage.com/6.%20Side%20view%20of%20Dinghy.webp", 8],
    ["snorkeling-equipment", "Snorkeling Equipment", "Water Sports", "available", "https://at02gf7f3no98fex.public.blob.vercel-storage.com/Yacht%20front%20view%20with%20dolphins.webp", 9],
    ["fishing-equipment", "Fishing Equipment", "Water Sports", "available", "https://at02gf7f3no98fex.public.blob.vercel-storage.com/team-fishing-trip-in-maldives.jpg", 10],
    ["bbq-grill", "BBQ Grill", "Dining & Comfort", "available", "https://at02gf7f3no98fex.public.blob.vercel-storage.com/food.png", 11],
    ["sunbeds", "Sunbeds", "Dining & Comfort", "available", "https://at02gf7f3no98fex.public.blob.vercel-storage.com/Aerial%20Rear%20Quarter%20View%20-%20Stern%20Deck%20Over%20Reef.webp", 12],
    ["umbrellas", "Umbrellas", "Dining & Comfort", "available", "https://at02gf7f3no98fex.public.blob.vercel-storage.com/salt-republic-yacht-packages-4.jpg", 13],
    ["cool-box", "Cool Box", "Dining & Comfort", "available", null as unknown as string, 14],
    ["sandbank-tables", "Tables for Sandbank Experiences", "Dining & Comfort", "available", "https://at02gf7f3no98fex.public.blob.vercel-storage.com/salt-republic-yacht-packages-4.jpg", 15],
  ];

  for (const [slug, name, category, availability, image, sortOrder] of acts) {
    await pg.query(
      `INSERT INTO "activities" ("slug", "name", "category", "availability", "image", "active", "sort_order")
       VALUES ($1, $2, $3, $4, $5, true, $6)`,
      [slug, name, category, availability, image, sortOrder]
    );
  }

  // 6. Seed yacht Finch 65 with authentic Vercel Blob photography
  const gallery = [
    { src: "https://at02gf7f3no98fex.public.blob.vercel-storage.com/Aerial%20Front%20Starboard%20Quarter%20View%20-%20Underway.webp", label: "Finch 65 Underway — Malé Atoll" },
    { src: "https://at02gf7f3no98fex.public.blob.vercel-storage.com/Aerial%20Overhead%20View%20-%20Underway%20Between%20Islands.webp", label: "Aerial Island Passage" },
    { src: "https://at02gf7f3no98fex.public.blob.vercel-storage.com/Aerial%20Rear%20Quarter%20View%20-%20Stern%20Deck%20Over%20Reef.webp", label: "Stern Deck Anchored Over Reef" },
    { src: "https://at02gf7f3no98fex.public.blob.vercel-storage.com/Yacht%20front%20view%20with%20dolphins.webp", label: "Bow Dolphins Encounter" },
    { src: "https://at02gf7f3no98fex.public.blob.vercel-storage.com/Stern%20Eye-Level%20View%20-%20Underway%20with%20Dolphins.webp", label: "Stern View With Ocean Dolphins" },
    { src: "https://at02gf7f3no98fex.public.blob.vercel-storage.com/Salt%20republic%20-%20interior.webp", label: "Main Saloon Lounge" },
    { src: "https://at02gf7f3no98fex.public.blob.vercel-storage.com/3.%20Guest%20Room%201%20Master%20Room.webp", label: "Master Stateroom Suite" },
    { src: "https://at02gf7f3no98fex.public.blob.vercel-storage.com/4.%20Guest%20Room%202.webp", label: "VIP Guest Stateroom" },
    { src: "https://at02gf7f3no98fex.public.blob.vercel-storage.com/10.%20Primary%20Helm%20and%20Control%20Station.webp", label: "Primary Helm & Navigation" },
    { src: "https://at02gf7f3no98fex.public.blob.vercel-storage.com/20.%20Full%20View%20of%20Dinghy.webp", label: "Private Tender Dinghy" },
    { src: "https://at02gf7f3no98fex.public.blob.vercel-storage.com/food.png", label: "Aboard Gourmet Cuisine" },
    { src: "https://at02gf7f3no98fex.public.blob.vercel-storage.com/maldives-atoll-sunset-1791090468781-azpz.png", label: "Golden Hour Ocean Cruise" },
  ];

  await pg.query(
    `INSERT INTO "yachts" ("slug", "name", "summary", "max_speed_knots", "max_speed_kmh", "bedrooms", "beds", "washrooms",
        "air_conditioned", "max_day_guests", "max_overnight_guests", "crew", "hero_image", "gallery", "active")
     VALUES ('finch-65', 'Finch 65', $1, 10, 18.5, 3, 6, 2, true, 17, 10, 4, 'https://at02gf7f3no98fex.public.blob.vercel-storage.com/Aerial%20Front%20Starboard%20Quarter%20View%20-%20Underway.webp', $2, true)`,
    [
      "Finch 65 is a private motor yacht built around comfort, privacy and long days on the water. With three air-conditioned bedrooms, a dedicated crew of four and room for seventeen guests by day, she is your base for exploring Malé Atoll at your own pace.",
      JSON.stringify(gallery),
    ]
  );

  // 7. Seed testimonials
  const testimonials = [
    ["Sophie Laurent", "Paris, France", "Full-Day Private Charter", "A truly remarkable day aboard Finch 65. The crew was attentive, the lagoon stops were secluded, and the sunset was unforgettable.", true],
    ["Marcus Weber", "Munich, Germany", "Overnight 28-Hour Charter", "Waking up on the water in the middle of Malé Atoll was the highlight of our Maldives holiday. Exceptional service.", true],
    ["Amina & Tariq", "Dubai, UAE", "Sandbank Experiences", "The sandbank setup was beyond our expectations. Pure privacy and luxury from pickup to drop-off.", true],
  ];

  for (let i = 0; i < testimonials.length; i++) {
    const [name, origin, tripType, quote, approved] = testimonials[i];
    await pg.query(
      `INSERT INTO "testimonials" ("name", "origin", "trip_type", "quote", "placeholder", "approved", "sort_order")
       VALUES ($1, $2, $3, $4, false, $5, $6)`,
      [name, origin, tripType, quote, approved, i + 1]
    );
  }

  // 8. Seed subscribers
  const subs = [
    ["+960 770 1001", "website"],
    ["+960 991 2200", "website"],
    ["+960 765 8899", "homepage"],
    ["+44 7700 900455", "homepage"],
    ["+971 50 123 4567", "website"],
  ];
  for (const [whatsapp, source] of subs) {
    await pg.query(
      `INSERT INTO "subscribers" ("whatsapp", "source") VALUES ($1, $2)`,
      [whatsapp, source]
    );
  }

  // 9. Seed demo bookings
  const now = new Date();
  const dateOffset = (days: number) => {
    const d = new Date(now.getTime() + days * 86400000);
    return d.toISOString().slice(0, 10);
  };

  const demoBookings = [
    ["SR-2026-0001", "Aisha Naseem", "+960 779 1122", 8, "Full-Day Private Charter", dateOffset(6), "08:00", "17:00", "Malé commercial harbour", "Malé commercial harbour", ["Lunch"], ["Jet Ski"], "Birthday celebration for my partner — any chance of a small cake?", "NEW", dateOffset(-2)],
    ["SR-2026-0002", "James Whitfield", "+44 7700 900231", 12, "Half-Day Private Charter", dateOffset(3), "09:00", "13:00", "Hulhumalé jetty", "Hulhumalé jetty", ["Not Required"], [], "Group of friends visiting from London.", "NEW", dateOffset(-1)],
    ["SR-2026-0003", "Mariyam Shifa", "+960 991 8842", 2, "Overnight 36-Hour Charter", dateOffset(11), "14:00", "16:00", "Malé commercial harbour", "Malé commercial harbour", ["Dinner", "Breakfast"], ["Underwater Scooters"], "Anniversary trip.", "CONTACTED", dateOffset(-4)],
    ["SR-2026-0004", "Lucas Meyer", "+49 151 2345678", 10, "Overnight 28-Hour Charter", dateOffset(15), "11:00", "15:00", "Hulhumalé jetty", "Hulhumalé jetty", ["Lunch", "Dinner", "Breakfast"], ["Inflatable Paddle Boat"], "Confirmed deposit discussed on WhatsApp.", "CONFIRMED", dateOffset(-6)],
    ["SR-2026-0005", "Fathimath Saeed", "+960 765 4321", 17, "Sandbank Experiences", dateOffset(-9), "08:30", "16:30", "Malé commercial harbour", "Malé commercial harbour", ["Lunch"], [], "Family gathering with children.", "COMPLETED", dateOffset(-12)],
  ];

  for (const [ref, name, whatsapp, guests, tripType, tripDate, pu, doff, ploc, dloc, food, acts2, notes, status, created] of demoBookings) {
    await pg.query(
      `INSERT INTO "bookings" ("ref", "name", "whatsapp", "guests", "trip_type", "destination", "trip_date", "pickup_time", "dropoff_time",
         "pickup_location", "dropoff_location", "food_prefs", "activity_requests", "special_requests", "status",
         "sheets_synced", "email_sent", "created_at")
       VALUES ($1, $2, $3, $4, $5, 'Malé Atoll', $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
      [
        ref,
        name,
        whatsapp,
        guests,
        tripType,
        tripDate,
        pu,
        doff,
        ploc,
        dloc,
        food,
        acts2,
        notes,
        status,
        status !== "NEW",
        status === "CONFIRMED" || status === "COMPLETED",
        new Date(created as string),
      ]
    );
  }

  // 10. Seed settings
  await pg.query(
    `INSERT INTO "settings" ("key", "value") VALUES ('booking_email', 'saltrepublic.mv@gmail.com')
     ON CONFLICT ("key") DO NOTHING`
  );

  const defaultButtonDownloads = JSON.stringify({
    yachtButton: {
      enabled: true,
      buttonText: "Download Yacht Specs & Rates (PDF)",
      pdfUrl: "https://at02gf7f3no98fex.public.blob.vercel-storage.com/usd---excursions-and-tour-charter-rates-1791091557440-os20.pdf",
      pdfLabel: "Finch 65 Specifications & Charter Rates (USD)",
    },
    menuButton: {
      enabled: true,
      buttonText: "Download Dining Menu (PDF)",
      pdfUrl: "https://at02gf7f3no98fex.public.blob.vercel-storage.com/salt-republic-food-menu-1791093344945-8vdt.pdf",
      pdfLabel: "Salt Republic Dining & Beverage Menu (PDF)",
    },
    headerButton: {
      enabled: true,
      buttonText: "Charter Rates (PDF)",
      pdfUrl: "https://at02gf7f3no98fex.public.blob.vercel-storage.com/usd---excursions-and-tour-charter-rates-1791091557440-os20.pdf",
      pdfLabel: "Salt Republic Private Charter Rates (USD)",
    },
    heroButton: {
      enabled: true,
      buttonText: "Download Rates (PDF)",
      pdfUrl: "https://at02gf7f3no98fex.public.blob.vercel-storage.com/usd---excursions-and-tour-charter-rates-1791091557440-os20.pdf",
      pdfLabel: "Salt Republic Full Packages & Rates (USD)",
    },
    b2bButton: {
      enabled: true,
      buttonText: "Download Travel Agent Tariff (PDF)",
      pdfUrl: "https://at02gf7f3no98fex.public.blob.vercel-storage.com/mvr---excursions-and-tour-charter-rates-1790250733636-jfxv.pdf",
      pdfLabel: "Salt Republic Travel Agent Tariff & Factsheet (MVR)",
    },
    finalCtaButton: {
      enabled: true,
      buttonText: "Download Charter Brochure (PDF)",
      pdfUrl: "https://at02gf7f3no98fex.public.blob.vercel-storage.com/Salt%20Republic%20images%20for%20proposal.pdf",
      pdfLabel: "Salt Republic Luxury Charter Proposal (PDF)",
    },
  });

  await pg.query(
    `INSERT INTO "settings" ("key", "value") VALUES ('button_downloads', $1)
     ON CONFLICT ("key") DO NOTHING`,
    [defaultButtonDownloads]
  );

  const defaultSiteImages = JSON.stringify({
    heroImage: "https://at02gf7f3no98fex.public.blob.vercel-storage.com/Aerial%20Front%20Starboard%20Quarter%20View%20-%20Underway.webp",
    diningImage: "https://at02gf7f3no98fex.public.blob.vercel-storage.com/food.png",
    menuModalImage: "https://at02gf7f3no98fex.public.blob.vercel-storage.com/lunch-menu-1791092723474-f0tm.jpeg",
    finalCtaImage: "https://at02gf7f3no98fex.public.blob.vercel-storage.com/maldives-atoll-sunset-1791090468781-azpz.png",
    b2bHeroImage: "https://at02gf7f3no98fex.public.blob.vercel-storage.com/Aerial%20Overhead%20View%20-%20Underway%20Between%20Islands.webp",
    bookingBannerImage: "https://at02gf7f3no98fex.public.blob.vercel-storage.com/salt%20republic%20yacht%20%282%29.webp",
    thankYouBannerImage: "https://at02gf7f3no98fex.public.blob.vercel-storage.com/Stern%20Eye-Level%20View%20-%20Underway%20with%20Dolphins.webp",
  });

  await pg.query(
    `INSERT INTO "settings" ("key", "value") VALUES ('site_images', $1)
     ON CONFLICT ("key") DO NOTHING`,
    [defaultSiteImages]
  );

  // 11. Seed initial media items: ONLY Authentic Vercel Blob Storage assets and PDFs
  const blobMediaSeed: [string, string, string, string, number, string, string][] = [
    ["https://at02gf7f3no98fex.public.blob.vercel-storage.com/Aerial%20Front%20Starboard%20Quarter%20View%20-%20Underway.webp", "Aerial Front Starboard Quarter View - Underway.webp", "Aerial Front Starboard Quarter View - Underway", "image/webp", 118490, "image", "Finch 65 underway in turquoise Maldivian waters, starboard quarter aerial perspective"],
    ["https://at02gf7f3no98fex.public.blob.vercel-storage.com/Aerial%20Overhead%20View%20-%20Underway%20Between%20Islands.webp", "Aerial Overhead View - Underway Between Islands.webp", "Aerial Overhead View - Underway Between Islands", "image/webp", 106392, "image", "Overhead aerial of Finch 65 cruising between tropical Maldivian atoll islands"],
    ["https://at02gf7f3no98fex.public.blob.vercel-storage.com/Aerial%20Rear%20Quarter%20View%20-%20Stern%20Deck%20Over%20Reef.webp", "Aerial Rear Quarter View - Stern Deck Over Reef.webp", "Aerial Rear Quarter View - Stern Deck Over Reef", "image/webp", 150552, "image", "Stern deck aerial perspective of Finch 65 anchored over vivid coral reef"],
    ["https://at02gf7f3no98fex.public.blob.vercel-storage.com/Stern%20Eye-Level%20View%20-%20Underway%20with%20Dolphins.webp", "Stern Eye-Level View - Underway with Dolphins.webp", "Stern Eye-Level View - Underway with Dolphins", "image/webp", 125440, "image", "Eye-level stern view showing dolphins swimming along the yacht wake"],
    ["https://at02gf7f3no98fex.public.blob.vercel-storage.com/Yacht%20front%20view%20with%20dolphins.webp", "Yacht front view with dolphins.webp", "Yacht Front View With Dolphins", "image/webp", 97818, "image", "Bow view of Finch 65 cutting through the water accompanied by playful dolphins"],
    ["https://at02gf7f3no98fex.public.blob.vercel-storage.com/Salt%20republic%20-%20interior.webp", "Salt republic - interior.webp", "Salt Republic - Interior Main Saloon", "image/webp", 141456, "image", "Finch 65 air-conditioned main saloon with panoramic ocean windows and plush seating"],
    ["https://at02gf7f3no98fex.public.blob.vercel-storage.com/3.%20Guest%20Room%201%20Master%20Room.webp", "3. Guest Room 1 Master Room.webp", "Guest Room 1 - Master Stateroom Suite", "image/webp", 655438, "image", "Master stateroom cabin with king bed, ambient lighting, and en-suite washroom"],
    ["https://at02gf7f3no98fex.public.blob.vercel-storage.com/4.%20Guest%20Room%202.webp", "4. Guest Room 2.webp", "Guest Room 2 - Double Cabin", "image/webp", 171602, "image", "VIP guest cabin aboard Finch 65 with climate control and luxury Maldivian linens"],
    ["https://at02gf7f3no98fex.public.blob.vercel-storage.com/10.%20Primary%20Helm%20and%20Control%20Station.webp", "10. Primary Helm and Control Station.webp", "Primary Helm and Control Station", "image/webp", 207810, "image", "Main helm bridge navigation consoles, radar screens, and controls"],
    ["https://at02gf7f3no98fex.public.blob.vercel-storage.com/18.%20Secondary%20Helm%20and%20Control%20Station.webp", "18. Secondary Helm and Control Station.webp", "Secondary Helm and Control Station", "image/webp", 327222, "image", "Upper flybridge secondary steering helm and panoramic observation station"],
    ["https://at02gf7f3no98fex.public.blob.vercel-storage.com/19.%20Crane%20in%20Operation.webp", "19. Crane in Operation.webp", "Yacht Deck Crane in Operation", "image/webp", 275178, "image", "Hydraulic tender launch crane deploying water toys and equipment into the lagoon"],
    ["https://at02gf7f3no98fex.public.blob.vercel-storage.com/2.%20Primary%20Helm%20GPS%20and%20VHF%20Set.webp", "2. Primary Helm GPS and VHF Set.webp", "Primary Helm GPS and Marine VHF Set", "image/webp", 322534, "image", "Garmin marine GPS chartplotter and maritime VHF communications system"],
    ["https://at02gf7f3no98fex.public.blob.vercel-storage.com/20.%20Full%20View%20of%20Dinghy.webp", "20. Full View of Dinghy.webp", "Full View of Tender Dinghy", "image/webp", 245870, "image", "High-powered rigid inflatable tender dinghy for shallow reef and sandbank transfers"],
    ["https://at02gf7f3no98fex.public.blob.vercel-storage.com/6.%20Side%20view%20of%20Dinghy.webp", "6. Side view of Dinghy.webp", "Side View of Tender Dinghy", "image/webp", 209148, "image", "Side profile of outboard-powered excursion tender dinghy"],
    ["https://at02gf7f3no98fex.public.blob.vercel-storage.com/7.%20Close%20up%20view%20of%20Dinghy.webp", "7. Close up view of Dinghy.webp", "Close Up View of Tender Dinghy", "image/webp", 614898, "image", "Detailed view of luxury tender seating and boarding facilities"],
    ["https://at02gf7f3no98fex.public.blob.vercel-storage.com/salt%20republic%20yacht%20%282%29.webp", "salt republic yacht (2).webp", "Salt Republic Yacht Finch 65 Exterior", "image/webp", 216662, "image", "Side profile of Finch 65 showing spacious sun decks and bathing platform"],
    ["https://at02gf7f3no98fex.public.blob.vercel-storage.com/aerial-front-starboard-quarter-view---un-1791090224559-uvt6.png", "aerial-front-starboard-quarter-view---un-1791090224559-uvt6.png", "Aerial Front Starboard View Underway", "image/png", 1577371, "image", "High-resolution aerial view of Finch 65 cruising the crystal waters of Malé Atoll"],
    ["https://at02gf7f3no98fex.public.blob.vercel-storage.com/food.png", "food.png", "Gourmet Ocean Dining and Fresh Cuisine", "image/png", 1452340, "image", "Artfully plated fresh seafood and tropical cuisine served aboard Finch 65"],
    ["https://at02gf7f3no98fex.public.blob.vercel-storage.com/food-1791092593137-5k9c.png", "food-1791092593137-5k9c.png", "Aboard Culinary Selection", "image/png", 1452340, "image", "Fresh gourmet ingredients and tailored dining platters prepared by the onboard chef"],
    ["https://at02gf7f3no98fex.public.blob.vercel-storage.com/light-breakfast-menu-1791092741482-2x87.jpeg", "light-breakfast-menu-1791092741482-2x87.jpeg", "Light Breakfast Menu Selection", "image/jpeg", 286088, "image", "Salt Republic sunrise breakfast spread featuring tropical fruits, pastries, and barista coffee"],
    ["https://at02gf7f3no98fex.public.blob.vercel-storage.com/lunch-menu-1791092723474-f0tm.jpeg", "lunch-menu-1791092723474-f0tm.jpeg", "Gourmet Lunch Menu Selection", "image/jpeg", 360798, "image", "Midday multi-course charter lunch menu featuring ocean catches and Maldivian flavours"],
    ["https://at02gf7f3no98fex.public.blob.vercel-storage.com/maldives-atoll-sunset-1791090468781-azpz.png", "maldives-atoll-sunset-1791090468781-azpz.png", "Maldives Atoll Sunset Panorama", "image/png", 2048, "image", "Warm sunset glow over tranquil lagoon waters at golden hour"],
    ["https://at02gf7f3no98fex.public.blob.vercel-storage.com/male%20atoll.png", "male atoll.png", "Malé Atoll Private Cruising Route", "image/png", 2022206, "image", "Aerial map and imagery of Malé Atoll island reefs and secluded sandbanks"],
    ["https://at02gf7f3no98fex.public.blob.vercel-storage.com/overnight-trip-1791094004109-4cr4.png", "overnight-trip-1791094004109-4cr4.png", "Overnight Charter Ocean Horizon", "image/png", 666717, "image", "Anchored under starlit Maldivian skies on a 28 or 36-hour private overnight voyage"],
    ["https://at02gf7f3no98fex.public.blob.vercel-storage.com/sunset-crusing-packages.jpg", "sunset-crusing-packages.jpg", "Sunset Cruising Package Experience", "image/jpeg", 238226, "image", "Evening champagne and hors d'oeuvres cruise across the coral lagoons"],
    ["https://at02gf7f3no98fex.public.blob.vercel-storage.com/team-fishing-trip-in-maldives.jpg", "team-fishing-trip-in-maldives.jpg", "Big Game Fishing Charter Excursion", "image/jpeg", 107933, "image", "Deep sea sport and big game fishing gear rigged for sailfish, wahoo, and tuna"],
    ["https://at02gf7f3no98fex.public.blob.vercel-storage.com/salt-republic-yacht-packages-2.jpg", "salt-republic-yacht-packages-2.jpg", "Charter Package Overview 2", "image/jpeg", 229672, "image", "Salt Republic tailored luxury charter package details"],
    ["https://at02gf7f3no98fex.public.blob.vercel-storage.com/salt-republic-yacht-packages-4.jpg", "salt-republic-yacht-packages-4.jpg", "Charter Package Overview 4", "image/jpeg", 832200, "image", "Sandbank excursion setup and beach dining services"],
    ["https://at02gf7f3no98fex.public.blob.vercel-storage.com/salt-republic-yacht-packages-5.jpg", "salt-republic-yacht-packages-5.jpg", "Charter Package Overview 5", "image/jpeg", 314759, "image", "Water sports gear and sea scooters included aboard Finch 65"],
    ["https://at02gf7f3no98fex.public.blob.vercel-storage.com/salt-republic-yacht-packages-7.jpg", "salt-republic-yacht-packages-7.jpg", "Charter Package Overview 7", "image/jpeg", 257580, "image", "Full-day private itinerary and lagoon anchorages"],
    ["https://at02gf7f3no98fex.public.blob.vercel-storage.com/salt-republic-yacht-packages-8.jpg", "salt-republic-yacht-packages-8.jpg", "Charter Package Overview 8", "image/jpeg", 384247, "image", "Overnight voyage suite specifications and amenities"],
    ["https://at02gf7f3no98fex.public.blob.vercel-storage.com/yacht%20interior%20%281%29.1.webp", "yacht interior (1).1.webp", "Saloon Dining Table Setting", "image/webp", 199232, "image", "Interior saloon dining table with sea views"],
    ["https://at02gf7f3no98fex.public.blob.vercel-storage.com/yacht%20interior%20%281%29.2.webp", "yacht interior (1).2.webp", "Interior Lounge and Entertainment", "image/webp", 197876, "image", "Spacious saloon lounge seating with state of the art sound system"],
    ["https://at02gf7f3no98fex.public.blob.vercel-storage.com/yacht%20interior%20%281%29.webp", "yacht interior (1).webp", "Interior Saloon Wide Angle", "image/webp", 270200, "image", "Wide angle perspective of Finch 65 air conditioned saloon"],
    ["https://at02gf7f3no98fex.public.blob.vercel-storage.com/yacht%20interior%20%282%29.webp", "yacht interior (2).webp", "Master Stateroom Bed and Wardrobe", "image/webp", 418476, "image", "Luxurious master stateroom double bed with handcrafted cabinetry"],
    ["https://at02gf7f3no98fex.public.blob.vercel-storage.com/yacht%20interior%20%283%29.webp", "yacht interior (3).webp", "Guest Stateroom Twin Berth", "image/webp", 191512, "image", "Guest stateroom twin beds with soft Maldivian lighting"],
    ["https://at02gf7f3no98fex.public.blob.vercel-storage.com/yacht%20interior%20%284%29.webp", "yacht interior (4).webp", "Guest Washroom and En-Suite", "image/webp", 337558, "image", "Modern freshwater shower and private washroom facilities"],
    ["https://at02gf7f3no98fex.public.blob.vercel-storage.com/yacht%20mid%20angle%20back%20left%20view.webp", "yacht mid angle back left view.webp", "Yacht Port Quarter Mid Angle", "image/webp", 134876, "image", "Port quarter view showing hydraulic swim platform and aft deck sun lounge"],
    ["https://at02gf7f3no98fex.public.blob.vercel-storage.com/usd---excursions-and-tour-charter-rates-1791091557440-os20.pdf", "usd---excursions-and-tour-charter-rates-1791091557440-os20.pdf", "USD Excursions & Tour Charter Rates (PDF)", "application/pdf", 4188064, "pdf", "Official Salt Republic Charter Packages & Excursion Rates in USD"],
    ["https://at02gf7f3no98fex.public.blob.vercel-storage.com/mvr---excursions-and-tour-charter-rates-1790250733636-jfxv.pdf", "mvr---excursions-and-tour-charter-rates-1790250733636-jfxv.pdf", "MVR Excursions & Tour Charter Rates (PDF)", "application/pdf", 4804182, "pdf", "Official Salt Republic Charter Packages & Excursion Rates in MVR"],
    ["https://at02gf7f3no98fex.public.blob.vercel-storage.com/salt-republic-food-menu-1791093344945-8vdt.pdf", "salt-republic-food-menu-1791093344945-8vdt.pdf", "Salt Republic Gourmet Food & Beverage Menu (PDF)", "application/pdf", 955380, "pdf", "Official Salt Republic Aboard Dining, Breakfast, Lunch & Dinner Menu"],
    ["https://at02gf7f3no98fex.public.blob.vercel-storage.com/Salt%20Republic%20images%20for%20proposal.pdf", "Salt Republic images for proposal.pdf", "Salt Republic Vessel & Proposal Guide (PDF)", "application/pdf", 3700317, "pdf", "Comprehensive Salt Republic Client Proposal & Vessel Photography Guide"],
  ];

  for (const [url, filename, originalName, mimeType, sizeBytes, category, altText] of blobMediaSeed) {
    await pg.query(
      `INSERT INTO "media" ("url", "filename", "original_name", "mime_type", "size_bytes", "category", "alt_text")
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT ("url") DO UPDATE SET
         "filename" = EXCLUDED."filename",
         "original_name" = EXCLUDED."original_name",
         "mime_type" = EXCLUDED."mime_type",
         "size_bytes" = EXCLUDED."size_bytes",
         "category" = EXCLUDED."category",
         "alt_text" = EXCLUDED."alt_text"`,
      [url, filename, originalName, mimeType, sizeBytes, category, altText]
    );
  }
}
