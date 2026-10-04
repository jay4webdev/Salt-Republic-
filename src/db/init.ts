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
      "/images/sandbank.jpg",
    ]
  );

  // 4. Seed trip types
  const trips: [string, string, string, string | null, string, number, string, number][] = [
    ["half-day-private-charter", "Half-Day Private Charter", "A private half-day aboard Finch 65, tailored to how you want to spend your time on the ocean.", "Half Day", "day", 17, "/images/hero.jpg", 1],
    ["full-day-private-charter", "Full-Day Private Charter", "A full day of privacy and freedom across the lagoon, with the yacht entirely yours.", "Full Day", "day", 17, "/images/yacht-exterior.jpg", 2],
    ["overnight-28-hour-charter", "Overnight 28-Hour Charter", "An overnight escape with 28 hours aboard Finch 65 — wake up on the water, surrounded by the lagoon.", "28 Hours", "overnight", 10, "/images/yacht-night.jpg", 3],
    ["overnight-36-hour-charter", "Overnight 36-Hour Charter", "A slower overnight journey — 36 hours to settle into life at sea.", "36 Hours", "overnight", 10, "/images/yacht-cabin.jpg", 4],
    ["fishing", "Fishing", "Private fishing experiences on the open ocean, equipped for a relaxed day on the water.", null, "day", 17, "/images/sunset.jpg", 5],
    ["sandbank-experiences", "Sandbank Experiences", "Your own setup on a secluded Maldivian sandbank, with the yacht anchored close by.", null, "day", 17, "/images/sandbank.jpg", 6],
    ["snorkeling", "Snorkeling", "Slip into clear lagoon water and explore the reef with equipment prepared onboard.", null, "day", 17, "/images/snorkeling.jpg", 7],
    ["sunset-experiences", "Sunset Experiences", "Golden hour at sea — an intimate way to end the day on the Indian Ocean.", "Sunset", "day", 17, "/images/sunset.jpg", 8],
    ["special-events", "Special Events", "Celebrations, gatherings and milestones, hosted privately aboard Finch 65.", null, "day", 17, "/images/dining.jpg", 9],
    ["bespoke-private-charter", "Bespoke Private Charter", "Tell us what you imagine. We'll design a private charter around your idea of the perfect day.", null, "day", 17, "/images/toys.jpg", 10],
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
    ["jet-ski", "Jet Ski", "Water Toys", "on_request", "/images/toys.jpg", 1],
    ["underwater-scooters", "Underwater Scooters", "Water Toys", "on_request", "/images/snorkeling.jpg", 2],
    ["inflatable-paddle-boat", "Inflatable Paddle Boat", "Water Toys", "available", "/images/toys.jpg", 3],
    ["sup-boards", "SUP Boards", "Water Toys", "available", "/images/toys.jpg", 4],
    ["paddle-boards", "Paddle Boards", "Water Toys", "available", "/images/toys.jpg", 5],
    ["inflatable-slides", "Inflatable Slides", "Water Toys", "available", "/images/toys.jpg", 6],
    ["trampolines", "Trampolines", "Water Toys", "available", "/images/toys.jpg", 7],
    ["floaties", "Floaties", "Water Toys", "available", "/images/toys.jpg", 8],
    ["snorkeling-equipment", "Snorkeling Equipment", "Water Sports", "available", "/images/snorkeling.jpg", 9],
    ["fishing-equipment", "Fishing Equipment", "Water Sports", "available", "/images/sunset.jpg", 10],
    ["bbq-grill", "BBQ Grill", "Dining & Comfort", "available", "/images/dining.jpg", 11],
    ["sunbeds", "Sunbeds", "Dining & Comfort", "available", "/images/sandbank.jpg", 12],
    ["umbrellas", "Umbrellas", "Dining & Comfort", "available", "/images/sandbank.jpg", 13],
    ["cool-box", "Cool Box", "Dining & Comfort", "available", null as unknown as string, 14],
    ["sandbank-tables", "Tables for Sandbank Experiences", "Dining & Comfort", "available", "/images/sandbank.jpg", 15],
  ];

  for (const [slug, name, category, availability, image, sortOrder] of acts) {
    await pg.query(
      `INSERT INTO "activities" ("slug", "name", "category", "availability", "image", "active", "sort_order")
       VALUES ($1, $2, $3, $4, $5, true, $6)`,
      [slug, name, category, availability, image, sortOrder]
    );
  }

  // 6. Seed yacht Finch 65
  const gallery = [
    { src: "/images/yacht-exterior.jpg", label: "Exterior" },
    { src: "/images/hero.jpg", label: "Aerial View" },
    { src: "/images/yacht-interior.jpg", label: "Interior Saloon" },
    { src: "/images/yacht-cabin.jpg", label: "Accommodation" },
    { src: "/images/sandbank.jpg", label: "At Anchor" },
    { src: "/images/yacht-night.jpg", label: "Evenings Aboard" },
    { src: "/images/dining.jpg", label: "Aft Deck Dining" },
  ];

  await pg.query(
    `INSERT INTO "yachts" ("slug", "name", "summary", "max_speed_knots", "max_speed_kmh", "bedrooms", "beds", "washrooms",
        "air_conditioned", "max_day_guests", "max_overnight_guests", "crew", "hero_image", "gallery", "active")
     VALUES ('finch-65', 'Finch 65', $1, 10, 18.5, 3, 6, 2, true, 17, 10, 4, '/images/yacht-exterior.jpg', $2, true)`,
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
      pdfUrl: "/packages/salt-republic-rates-and-packages.pdf",
      pdfLabel: "Finch 65 Specifications & Charter Rates",
    },
    menuButton: {
      enabled: true,
      buttonText: "Download Dining Menu (PDF)",
      pdfUrl: "/packages/salt-republic-mvr-package.pdf",
      pdfLabel: "Salt Republic Dining & Beverage Menu",
    },
    headerButton: {
      enabled: false,
      buttonText: "Brochure (PDF)",
      pdfUrl: "/packages/salt-republic-rates-and-packages.pdf",
      pdfLabel: "Salt Republic Luxury Charter Brochure",
    },
    heroButton: {
      enabled: true,
      buttonText: "Download Rates (PDF)",
      pdfUrl: "/packages/salt-republic-rates-and-packages.pdf",
      pdfLabel: "Salt Republic Full Packages & Rates Brochure",
    },
    b2bButton: {
      enabled: true,
      buttonText: "Download B2B Tariff Sheet (PDF)",
      pdfUrl: "/packages/salt-republic-rates-and-packages.pdf",
      pdfLabel: "Salt Republic Travel Agent Tariff & Factsheet",
    },
    finalCtaButton: {
      enabled: false,
      buttonText: "Download Charter Brochure (PDF)",
      pdfUrl: "/packages/salt-republic-rates-and-packages.pdf",
      pdfLabel: "Salt Republic Luxury Charter Guide",
    },
  });

  await pg.query(
    `INSERT INTO "settings" ("key", "value") VALUES ('button_downloads', $1)
     ON CONFLICT ("key") DO NOTHING`,
    [defaultButtonDownloads]
  );

  const defaultSiteImages = JSON.stringify({
    heroImage: "/images/hero.jpg",
    diningImage: "/images/dining.jpg",
    menuModalImage: "/images/food-menu.jpg",
    finalCtaImage: "/images/yacht-night.jpg",
    b2bHeroImage: "/images/hero.jpg",
    bookingBannerImage: "/images/yacht-exterior.jpg",
    thankYouBannerImage: "/images/hero.jpg",
  });

  await pg.query(
    `INSERT INTO "settings" ("key", "value") VALUES ('site_images', $1)
     ON CONFLICT ("key") DO NOTHING`,
    [defaultSiteImages]
  );

  // 11. Seed initial media items
  const initialMedia = [
    ["/images/hero.jpg", "hero.jpg", "Finch 65 Hero Lagoon", "image/jpeg", 280000, "image", "Finch 65 private luxury motor yacht anchored in turquoise lagoon"],
    ["/images/yacht-exterior.jpg", "yacht-exterior.jpg", "Finch 65 Exterior", "image/jpeg", 295000, "image", "Exterior side profile of Finch 65 motor yacht"],
    ["/images/yacht-interior.jpg", "yacht-interior.jpg", "Finch 65 Interior Saloon", "image/jpeg", 240000, "image", "Modern air-conditioned main saloon of Finch 65"],
    ["/images/yacht-cabin.jpg", "yacht-cabin.jpg", "Finch 65 Master Stateroom", "image/jpeg", 230000, "image", "Comfortable private guest bedroom cabin"],
    ["/images/yacht-night.jpg", "yacht-night.jpg", "Finch 65 Blue Hour", "image/jpeg", 260000, "image", "Finch 65 illuminated at dusk in Maldivian waters"],
    ["/images/dining.jpg", "dining.jpg", "Aft Deck Dining Setup", "image/jpeg", 275000, "image", "Gourmet dining table set on the yacht aft deck"],
    ["/images/sandbank.jpg", "sandbank.jpg", "Maldivian Sandbank", "image/jpeg", 310000, "image", "Private sandbank setup in Malé Atoll"],
    ["/images/sunset.jpg", "sunset.jpg", "Golden Hour Sunset", "image/jpeg", 250000, "image", "Spectacular sunset cruise across the Indian Ocean"],
    ["/images/snorkeling.jpg", "snorkeling.jpg", "Reef Snorkeling", "image/jpeg", 265000, "image", "Crystal clear lagoon reef exploration"],
    ["/images/toys.jpg", "toys.jpg", "Water Toys & Gear", "image/jpeg", 245000, "image", "Jet ski, underwater scooters and ocean toys"],
    ["/packages/salt-republic-rates-and-packages.pdf", "salt-republic-rates-and-packages.pdf", "Salt Republic Charter Rates & Equipment Brochure", "application/pdf", 3520000, "pdf", "Full charter rates, free equipment, motorised toys and overnight facilities"],
    ["/packages/salt-republic-usd-package.pdf", "salt-republic-usd-package.pdf", "Salt Republic Charter Packages (USD)", "application/pdf", 3520000, "pdf", "Full charter brochure and pricing in USD"],
    ["/packages/salt-republic-mvr-package.pdf", "salt-republic-mvr-package.pdf", "Salt Republic Charter Packages (MVR)", "application/pdf", 1420000, "pdf", "Charter brochure and dining menu in MVR"],
  ];

  for (const [url, filename, originalName, mimeType, sizeBytes, category, altText] of initialMedia) {
    await pg.query(
      `INSERT INTO "media" ("url", "filename", "original_name", "mime_type", "size_bytes", "category", "alt_text")
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT ("url") DO NOTHING`,
      [url, filename, originalName, mimeType, sizeBytes, category, altText]
    );
  }
}
