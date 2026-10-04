import { randomBytes, scryptSync } from "node:crypto";
import { Pool } from "pg";
import { config } from "dotenv";

config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

const dateOffset = (days) => {
  const d = new Date(Date.UTC(2026, 2, 24) + days * 86400000);
  return d.toISOString().slice(0, 10);
};

async function seed() {
  /* Admin user */
  const existingAdmin = await pool.query(
    `select id from users where email = $1`,
    ["admin@saltrepublic.mv"]
  );
  if (existingAdmin.rowCount === 0) {
    await pool.query(
      `insert into users (name, email, password_hash, role) values ($1,$2,$3,'admin')`,
      ["Salt Republic Admin", "admin@saltrepublic.mv", hashPassword("saltrepublic")]
    );
    console.log("→ admin user created");
  }

  /* Destination */
  await pool.query(
    `insert into destinations (slug, name, tagline, description, image, active, sort_order)
     values ($1,$2,$3,$4,$5,true,0)
     on conflict (slug) do update set name=excluded.name, tagline=excluded.tagline,
       description=excluded.description, image=excluded.image`,
    [
      "male-atoll",
      "Malé Atoll",
      "Private departures on your own schedule across the lagoon.",
      "Salt Republic operates private yacht experiences around Malé Atoll. Board at your chosen pickup, leave the shoreline behind, and spend your hours on open water, reef and sandbank — with the yacht and crew entirely dedicated to you.",
      "/images/sandbank.jpg",
    ]
  );

  /* Trip types */
  const trips = [
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
    await pool.query(
      `insert into trip_types (slug,name,description,duration,kind,capacity,image,active,sort_order)
       values ($1,$2,$3,$4,$5,$6,$7,true,$8)
       on conflict (slug) do update set
         name=excluded.name, description=excluded.description, duration=excluded.duration,
         kind=excluded.kind, capacity=excluded.capacity, image=excluded.image, sort_order=excluded.sort_order`,
      [slug, name, description, duration, kind, capacity, image, sortOrder]
    );
  }
  console.log(`→ ${trips.length} trip types upserted`);

  /* Activities */
  const acts = [
    ["jet-ski", "Jet Ski", null, "Water Toys", "on_request", "/images/toys.jpg", 1],
    ["underwater-scooters", "Underwater Scooters", null, "Water Toys", "on_request", "/images/snorkeling.jpg", 2],
    ["inflatable-paddle-boat", "Inflatable Paddle Boat", null, "Water Toys", "available", "/images/toys.jpg", 3],
    ["sup-boards", "SUP Boards", null, "Water Toys", "available", "/images/toys.jpg", 4],
    ["paddle-boards", "Paddle Boards", null, "Water Toys", "available", "/images/toys.jpg", 5],
    ["inflatable-slides", "Inflatable Slides", null, "Water Toys", "available", "/images/toys.jpg", 6],
    ["trampolines", "Trampolines", null, "Water Toys", "available", "/images/toys.jpg", 7],
    ["floaties", "Floaties", null, "Water Toys", "available", "/images/toys.jpg", 8],
    ["snorkeling-equipment", "Snorkeling Equipment", null, "Water Sports", "available", "/images/snorkeling.jpg", 9],
    ["fishing-equipment", "Fishing Equipment", null, "Water Sports", "available", "/images/sunset.jpg", 10],
    ["bbq-grill", "BBQ Grill", null, "Dining & Comfort", "available", "/images/dining.jpg", 11],
    ["sunbeds", "Sunbeds", null, "Dining & Comfort", "available", "/images/sandbank.jpg", 12],
    ["umbrellas", "Umbrellas", null, "Dining & Comfort", "available", "/images/sandbank.jpg", 13],
    ["cool-box", "Cool Box", null, "Dining & Comfort", "available", null, 14],
    ["sandbank-tables", "Tables for Sandbank Experiences", null, "Dining & Comfort", "available", "/images/sandbank.jpg", 15],
  ];
  for (const [slug, name, description, category, availability, image, sortOrder] of acts) {
    await pool.query(
      `insert into activities (slug,name,description,category,availability,image,active,sort_order)
       values ($1,$2,$3,$4,$5,$6,true,$7)
       on conflict (slug) do update set
         name=excluded.name, category=excluded.category, availability=excluded.availability,
         image=excluded.image, sort_order=excluded.sort_order`,
      [slug, name, description, category, availability, image, sortOrder]
    );
  }
  console.log(`→ ${acts.length} activities upserted`);

  /* Yacht */
  const gallery = [
    { src: "/images/yacht-exterior.jpg", label: "Exterior" },
    { src: "/images/hero.jpg", label: "Aerial View" },
    { src: "/images/yacht-interior.jpg", label: "Interior Saloon" },
    { src: "/images/yacht-cabin.jpg", label: "Accommodation" },
    { src: "/images/sandbank.jpg", label: "At Anchor" },
    { src: "/images/yacht-night.jpg", label: "Evenings Aboard" },
    { src: "/images/dining.jpg", label: "Aft Deck Dining" },
  ];
  await pool.query(
    `insert into yachts (slug,name,summary,max_speed_knots,max_speed_kmh,bedrooms,beds,washrooms,
        air_conditioned,max_day_guests,max_overnight_guests,crew,hero_image,gallery,active)
     values ('finch-65','Finch 65',$1,10,18.5,3,6,2,true,17,10,4,'/images/yacht-exterior.jpg',$2::jsonb,true)
     on conflict (slug) do update set
       summary=excluded.summary, max_speed_knots=excluded.max_speed_knots,
       max_speed_kmh=excluded.max_speed_kmh, bedrooms=excluded.bedrooms, beds=excluded.beds,
       washrooms=excluded.washrooms, air_conditioned=excluded.air_conditioned,
       max_day_guests=excluded.max_day_guests, max_overnight_guests=excluded.max_overnight_guests,
       crew=excluded.crew, gallery=excluded.gallery`,
    [
      "Finch 65 is a private motor yacht built around comfort, privacy and long days on the water. With three air-conditioned bedrooms, a dedicated crew of four and room for seventeen guests by day, she is your base for exploring Malé Atoll at your own pace.",
      JSON.stringify(gallery),
    ]
  );
  console.log("→ yacht Finch 65 upserted");

  /* Placeholder testimonials (drafts — never shown publicly) */
  const tCount = await pool.query(`select count(*)::int n from testimonials`);
  if (tCount.rows[0].n === 0) {
    const placeholders = [
      ["Placeholder draft", null, null, "Replace this draft with a genuine Salt Republic guest review via the dashboard. Placeholder content is never published to the website."],
      ["Placeholder draft", null, null, "Replace this draft with a genuine guest review once charter feedback has been collected."],
      ["Placeholder draft", null, null, "Only publish testimonials you know to be genuine Salt Republic guest feedback."],
    ];
    for (const [name, origin, tripType, quote] of placeholders) {
      await pool.query(
        `insert into testimonials (name, origin, trip_type, quote, placeholder, approved, sort_order)
         values ($1,$2,$3,$4,true,false,0)`,
        [name, origin, tripType, quote]
      );
    }
    console.log("→ 3 placeholder testimonial drafts created");
  }

  /* Demo subscribers */
  const sCount = await pool.query(`select count(*)::int n from subscribers`);
  if (sCount.rows[0].n === 0) {
    const subs = [
      ["+960 770 1001", "website"],
      ["+960 991 2200", "website"],
      ["+960 765 8899", "homepage"],
      ["+44 7700 900455", "homepage"],
      ["+971 50 123 4567", "website"],
    ];
    for (const [whatsapp, source] of subs) {
      await pool.query(
        `insert into subscribers (whatsapp, source) values ($1,$2)
         on conflict (whatsapp) do nothing`,
        [whatsapp, source]
      );
    }
    console.log(`→ ${subs.length} demo subscribers created`);
  }

  /* Demo bookings */
  const bCount = await pool.query(`select count(*)::int n from bookings`);
  if (bCount.rows[0].n === 0) {
    const demo = [
      ["SR-2026-0001", "Aisha Naseem", "+960 779 1122", 8, "Full-Day Private Charter", dateOffset(6), "08:00", "17:00", "Malé commercial harbour", "Malé commercial harbour", ["Lunch"], ["Jet Ski"], "Birthday celebration for my partner — any chance of a small cake?", "NEW", dateOffset(-2)],
      ["SR-2026-0002", "James Whitfield", "+44 7700 900231", 12, "Half-Day Private Charter", dateOffset(3), "09:00", "13:00", "Hulhumalé jetty", "Hulhumalé jetty", ["Not Required"], [], "Group of friends visiting from London.", "NEW", dateOffset(-1)],
      ["SR-2026-0003", "Mariyam Shifa", "+960 991 8842", 2, "Overnight 36-Hour Charter", dateOffset(11), "14:00", "16:00", "Malé commercial harbour", "Malé commercial harbour", ["Dinner", "Breakfast"], ["Underwater Scooters"], "Anniversary trip.", "CONTACTED", dateOffset(-4)],
      ["SR-2026-0004", "Lucas Meyer", "+49 151 2345678", 10, "Overnight 28-Hour Charter", dateOffset(15), "11:00", "15:00", "Hulhumalé jetty", "Hulhumalé jetty", ["Lunch", "Dinner", "Breakfast"], ["Inflatable Paddle Boat"], "Confirmed deposit discussed on WhatsApp.", "CONFIRMED", dateOffset(-6)],
      ["SR-2026-0005", "Fathimath Saeed", "+960 765 4321", 17, "Sandbank Experiences", dateOffset(-9), "08:30", "16:30", "Malé commercial harbour", "Malé commercial harbour", ["Lunch"], [], "Family gathering with children.", "COMPLETED", dateOffset(-12)],
      ["SR-2026-0006", "Daniel Carter", "+1 415 555 0132", 6, "Snorkeling", dateOffset(-15), "09:00", "14:00", "Hulhumalé jetty", "Hulhumalé jetty", ["Not Required"], ["Underwater Scooters"], "Keen snorkellers.", "COMPLETED", dateOffset(-18)],
      ["SR-2026-0007", "Ibrahim Rasheed", "+960 778 0099", 14, "Sunset Experiences", dateOffset(-22), "16:30", "19:00", "Malé commercial harbour", "Malé commercial harbour", ["Dinner"], [], null, "DECLINED", dateOffset(-25)],
      ["SR-2026-0008", "Hassan Riza", "+960 778 3311", 14, "Sandbank Experiences", dateOffset(8), "09:30", "17:00", "Guraidhoo ferry terminal", "Guraidhoo ferry terminal", ["Lunch"], ["Jet Ski", "Inflatable Paddle Boat"], "Office team day — 14 guests, please advise on shade setup.", "NEW", dateOffset(0)],
    ];
    for (const [ref, name, whatsapp, guests, tripType, tripDate, pu, doff, ploc, dloc, food, acts2, notes, status, created] of demo) {
      await pool.query(
        `insert into bookings (ref,name,whatsapp,guests,trip_type,destination,trip_date,pickup_time,dropoff_time,
           pickup_location,dropoff_location,food_prefs,activity_requests,special_requests,status,
           sheets_synced,email_sent,created_at)
         values ($1,$2,$3,$4,$5,'Malé Atoll',$6,$7,$8,$9,$10,$11::text[],$12::text[],$13,$14,$15,$16,$17)
         on conflict (ref) do nothing`,
        [ref, name, whatsapp, guests, tripType, tripDate, pu, doff, ploc, dloc, food, acts2, notes, status,
          status !== "NEW", status === "CONFIRMED" || status === "COMPLETED", new Date(created)]
      );
    }
    console.log(`→ ${demo.length} demo bookings created`);
  }

  /* Settings */
  await pool.query(
    `insert into settings (key, value) values ('booking_email','saltrepublic.mv@gmail.com')
     on conflict do nothing`
  );

  console.log("✓ seed complete");
  await pool.end();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
