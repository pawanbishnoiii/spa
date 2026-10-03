import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const enquiries = sqliteTable("enquiries", {
  id: text("id").primaryKey(),
  reference: text("reference").notNull().unique(),
  idempotencyKey: text("idempotency_key").notNull().unique(),
  name: text("name").notNull(),
  firstName: text("first_name").notNull().default(""),
  lastName: text("last_name").notNull().default(""),
  buttonId: text("button_id").notNull().default("legacy"),
  encryptedDetails: text("encrypted_details"),
  phone: text("phone"),
  gender: text("gender").notNull(),
  age: integer("age").notNull(),
  service: text("service").notNull(),
  therapistPreference: text("therapist_preference"),
  marketingConsent: integer("marketing_consent", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  deleteAfter: integer("delete_after", { mode: "timestamp" }).notNull(),
});

export const enquiryRateLimits = sqliteTable("enquiry_rate_limits", {
  fingerprint: text("fingerprint").primaryKey(),
  count: integer("count").notNull().default(1),
  windowStart: integer("window_start", { mode: "timestamp" }).notNull(),
});

export const siteSettings = sqliteTable("site_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  updatedBy: text("updated_by").notNull(),
});

export const therapistProfiles = sqliteTable("therapist_profiles", {
  id: text("id").primaryKey(),
  nameEn: text("name_en").notNull(),
  nameHi: text("name_hi").notNull(),
  specialityEn: text("speciality_en").notNull(),
  specialityHi: text("speciality_hi").notNull(),
  imageKey: text("image_key"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const analyticsSessions = sqliteTable("analytics_sessions", {
  id: text("id").primaryKey(),
  visitorHash: text("visitor_hash").notNull(),
  firstSeen: integer("first_seen", { mode: "timestamp" }).notNull(),
  lastSeen: integer("last_seen", { mode: "timestamp" }).notNull(),
  durationSeconds: integer("duration_seconds").notNull().default(0),
  pageCount: integer("page_count").notNull().default(1),
  source: text("source").notNull().default("direct"),
  medium: text("medium").notNull().default("none"),
  campaign: text("campaign"),
  landingPath: text("landing_path").notNull(),
  referrerHost: text("referrer_host"),
  device: text("device").notNull(),
  country: text("country"),
  region: text("region"),
  consentVersion: text("consent_version").notNull(),
}, (table) => [index("idx_analytics_sessions_last_seen").on(table.lastSeen), index("idx_analytics_sessions_visitor").on(table.visitorHash)]);

export const analyticsEvents = sqliteTable("analytics_events", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  eventName: text("event_name").notNull(),
  path: text("path").notNull(),
  occurredAt: integer("occurred_at", { mode: "timestamp" }).notNull(),
  metadata: text("metadata"),
}, (table) => [index("idx_analytics_events_session").on(table.sessionId), index("idx_analytics_events_name_time").on(table.eventName, table.occurredAt)]);
export const therapistPhotos = sqliteTable("therapist_photos", {
 id:text("id").primaryKey(),
 therapistId:text("therapist_id").notNull(),
 imageKey:text("image_key").notNull(),
 createdAt:integer("created_at").notNull(),
}, table=>[index("idx_therapist_photos_profile").on(table.therapistId)]);
