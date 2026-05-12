import { sql } from "drizzle-orm";
import { index, integer, jsonb, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessionsTable = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const usersTable = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  // Stripe
  stripeCustomerId: varchar("stripe_customer_id").unique(),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  plan: varchar("plan").notNull().default("free"), // free | starter | pro
  // Credits
  credits: integer("credits").notNull().default(3),
  creditsResetAt: timestamp("credits_reset_at", { withTimezone: true }).notNull().defaultNow(),
  totalCreditsUsed: integer("total_credits_used").notNull().default(0),
  // Admin
  isAdmin: integer("is_admin").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type UpsertUser = typeof usersTable.$inferInsert;
export type User = typeof usersTable.$inferSelect;

export const generationsTable = pgTable("generations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => usersTable.id),
  topic: text("topic").notNull(),
  sourceUrl: varchar("source_url"),
  titles: jsonb("titles").notNull().default(sql`'[]'::jsonb`),
  description: text("description").notNull().default(""),
  tags: jsonb("tags").notNull().default(sql`'[]'::jsonb`),
  thumbnails: jsonb("thumbnails").notNull().default(sql`'[]'::jsonb`),
  provider: varchar("provider"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Generation = typeof generationsTable.$inferSelect;
export type InsertGeneration = typeof generationsTable.$inferInsert;

export const creditTransactionsTable = pgTable("credit_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => usersTable.id),
  amount: integer("amount").notNull(), // positive = credit, negative = debit
  type: varchar("type").notNull(), // purchase | subscription_renewal | generation | refund | free_daily
  description: text("description"),
  stripeSessionId: varchar("stripe_session_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type CreditTransaction = typeof creditTransactionsTable.$inferSelect;
