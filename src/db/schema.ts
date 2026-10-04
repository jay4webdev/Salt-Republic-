import {
  pgTable,
  serial,
  text,
  integer,
  doublePrecision,
  boolean,
  timestamp,
  date,
  jsonb,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/* ------------------------------ Identity ------------------------------ */

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("admin"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  token: text("token").notNull().unique(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/* --------------------------- Charter catalogue ------------------------- */

export const destinations = pgTable(
  "destinations",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    tagline: text("tagline"),
    description: text("description").notNull(),
    image: text("image").notNull(),
    active: boolean("active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [uniqueIndex("destinations_slug_idx").on(t.slug)]
);

export type TripKind = "day" | "overnight";

export const tripTypes = pgTable(
  "trip_types",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    duration: text("duration"),
    kind: text("kind").$type<TripKind>().notNull().default("day"),
    capacity: integer("capacity").notNull().default(17),
    image: text("image").notNull(),
    active: boolean("active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("trip_types_slug_idx").on(t.slug)]
);

export type ActivityAvailability = "available" | "on_request";

export const activities = pgTable(
  "activities",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    category: text("category").notNull().default("Onboard"),
    availability: text("availability")
      .$type<ActivityAvailability>()
      .notNull()
      .default("available"),
    image: text("image"),
    active: boolean("active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [uniqueIndex("activities_slug_idx").on(t.slug)]
);

export type GalleryImage = {
  src: string;
  label: string;
};

export const yachts = pgTable("yachts", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  summary: text("summary").notNull(),
  maxSpeedKnots: integer("max_speed_knots").notNull(),
  maxSpeedKmh: doublePrecision("max_speed_kmh").notNull(),
  bedrooms: integer("bedrooms").notNull(),
  beds: integer("beds").notNull(),
  washrooms: integer("washrooms").notNull(),
  airConditioned: boolean("air_conditioned").notNull().default(true),
  maxDayGuests: integer("max_day_guests").notNull(),
  maxOvernightGuests: integer("max_overnight_guests").notNull(),
  crew: integer("crew").notNull(),
  heroImage: text("hero_image").notNull(),
  gallery: jsonb("gallery").$type<GalleryImage[]>().notNull(),
  active: boolean("active").notNull().default(true),
});

/* ------------------------------ Social proof --------------------------- */

export const testimonials = pgTable("testimonials", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  origin: text("origin"),
  tripType: text("trip_type"),
  quote: text("quote").notNull(),
  placeholder: boolean("placeholder").notNull().default(false),
  approved: boolean("approved").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const subscribers = pgTable(
  "subscribers",
  {
    id: serial("id").primaryKey(),
    whatsapp: text("whatsapp").notNull(),
    source: text("source").notNull().default("website"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("subscribers_whatsapp_idx").on(t.whatsapp)]
);

/* ------------------------------- Bookings ------------------------------ */

export type BookingStatus =
  | "NEW"
  | "CONTACTED"
  | "CONFIRMED"
  | "COMPLETED"
  | "DECLINED";

export const bookings = pgTable(
  "bookings",
  {
    id: serial("id").primaryKey(),
    ref: text("ref").notNull().unique(),
    name: text("name").notNull(),
    whatsapp: text("whatsapp").notNull(),
    guests: integer("guests").notNull(),
    tripTypeId: integer("trip_type_id").references(() => tripTypes.id, {
      onDelete: "set null",
    }),
    tripType: text("trip_type").notNull(),
    destination: text("destination").notNull(),
    tripDate: date("trip_date").notNull(),
    pickupTime: text("pickup_time").notNull(),
    dropoffTime: text("dropoff_time").notNull(),
    pickupLocation: text("pickup_location").notNull(),
    dropoffLocation: text("dropoff_location").notNull(),
    foodPrefs: text("food_prefs").notNull().array().notNull().default([]),
    activityRequests: text("activity_requests")
      .notNull()
      .array()
      .notNull()
      .default([]),
    specialRequests: text("special_requests"),
    status: text("status").$type<BookingStatus>().notNull().default("NEW"),
    adminNotes: text("admin_notes"),
    sheetsSynced: boolean("sheets_synced").notNull().default(false),
    sheetsSyncedAt: timestamp("sheets_synced_at", { withTimezone: true }),
    emailSent: boolean("email_sent").notNull().default(false),
    emailSentAt: timestamp("email_sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("bookings_ref_idx").on(t.ref)]
);

/* --------------------------- Settings / outbox ------------------------- */

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const outbox = pgTable("outbox", {
  id: serial("id").primaryKey(),
  channel: text("channel").notNull(), // 'email' | 'sheets' | 'b2b_email'
  recipient: text("recipient"),
  subject: text("subject"),
  body: text("body").notNull(),
  meta: jsonb("meta"),
  sent: boolean("sent").notNull().default(false),
  error: text("error"),
  bookingRef: text("booking_ref"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/* --------------------------- B2B / Travel Partners ---------------------- */

export type B2BStatus = "NEW" | "CONTACTED" | "ONBOARDED" | "DECLINED";

export const b2bEnquiries = pgTable("b2b_enquiries", {
  id: serial("id").primaryKey(),
  ref: text("ref").notNull().unique(),
  companyName: text("company_name").notNull(),
  contactPerson: text("contact_person").notNull(),
  email: text("email").notNull(),
  whatsapp: text("whatsapp").notNull(),
  country: text("country").notNull(),
  businessType: text("business_type").notNull(),
  monthlyBookings: text("monthly_bookings"),
  interestedProduct: text("interested_product").notNull(),
  departureLocation: text("departure_location"),
  message: text("message"),
  status: text("status").$type<B2BStatus>().notNull().default("NEW"),
  adminNotes: text("admin_notes"),
  emailSent: boolean("email_sent").notNull().default(false),
  emailSentAt: timestamp("email_sent_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/* --------------------------- Media & Assets ---------------------------- */

export type MediaCategory = "image" | "pdf" | "document";

export const media = pgTable("media", {
  id: serial("id").primaryKey(),
  url: text("url").notNull().unique(),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  sizeBytes: integer("size_bytes").notNull().default(0),
  category: text("category").$type<MediaCategory>().notNull().default("image"),
  altText: text("alt_text"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});


