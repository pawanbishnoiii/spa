import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const enquiries = sqliteTable("enquiries", {
  id: text("id").primaryKey(),
  reference: text("reference").notNull().unique(),
  idempotencyKey: text("idempotency_key").notNull().unique(),
  name: text("name").notNull(),
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
