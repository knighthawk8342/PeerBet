import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  decimal,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (mandatory for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  balance: decimal("balance", { precision: 10, scale: 2 }).default("1000.00").notNull(),
  isAdmin: boolean("is_admin").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const markets = pgTable("markets", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  title: text("title").notNull(),
  description: text("description"),
  category: varchar("category", { length: 50 }).notNull(),
  stakeAmount: decimal("stake_amount", { precision: 10, scale: 2 }).notNull(),
  counterpartyStakeAmount: decimal("counterparty_stake_amount", { precision: 10, scale: 2 }).notNull().default("0.01"),
  odds: decimal("odds", { precision: 5, scale: 2 }).notNull().default("1.00"), // e.g., 2.00 means 2:1 odds
  creatorId: varchar("creator_id").notNull().references(() => users.id),
  counterpartyId: varchar("counterparty_id").references(() => users.id),
  status: varchar("status", { length: 20 }).notNull().default("open"), // open, active, settled, cancelled
  expiryDate: timestamp("expiry_date").notNull(),
  settlement: varchar("settlement", { length: 20 }), // creator_wins, counterparty_wins, refund
  paymentSignature: text("payment_signature"), // SOL transaction signature
  createdAt: timestamp("created_at").defaultNow(),
  settledAt: timestamp("settled_at"),
});

export const transactions = pgTable("transactions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull().references(() => users.id),
  marketId: integer("market_id").references(() => markets.id),
  type: varchar("type", { length: 20 }).notNull(), // stake, payout, fee, refund
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  paymentSignature: text("payment_signature"), // SOL transaction signature
  createdAt: timestamp("created_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Market = typeof markets.$inferSelect;
export type InsertMarket = typeof markets.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

export const insertMarketSchema = createInsertSchema(markets).pick({
  title: true,
  description: true,
  category: true,
  stakeAmount: true,
  counterpartyStakeAmount: true,
  odds: true,
  expiryDate: true,
  paymentSignature: true,
}).extend({
  stakeAmount: z.string().transform((val) => parseFloat(val)).refine((val) => val >= 0.01, "Minimum stake amount is 0.01 SOL"),
  counterpartyStakeAmount: z.string().transform((val) => parseFloat(val)).refine((val) => val >= 0.01, "Minimum counterparty stake is 0.01 SOL"),
  odds: z.string().transform((val) => parseFloat(val)).refine((val) => val >= 0.1 && val <= 10, "Odds must be between 0.1 and 10"),
  expiryDate: z.string().transform((val) => new Date(val)),
  paymentSignature: z.string().min(1, "SOL payment signature is required"),
});

export const joinMarketSchema = z.object({
  marketId: z.number(),
});

export const settleMarketSchema = z.object({
  marketId: z.number(),
  settlement: z.enum(["creator_wins", "counterparty_wins", "refund"]),
});

export const settleMarketRequestSchema = z.object({
  settlement: z.enum(["creator_wins", "counterparty_wins", "refund"]),
});
