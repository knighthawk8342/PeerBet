import {
  users,
  markets,
  transactions,
  type User,
  type UpsertUser,
  type Market,
  type InsertMarket,
  type Transaction,
  type InsertTransaction,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, isNull } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Market operations
  createMarket(market: InsertMarket): Promise<Market>;
  getMarkets(status?: string): Promise<Market[]>;
  getMarket(id: number): Promise<Market | undefined>;
  joinMarket(marketId: number, counterpartyId: string): Promise<Market>;
  settleMarket(marketId: number, settlement: string): Promise<Market>;
  getUserMarkets(userId: string): Promise<Market[]>;
  
  // Transaction operations
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getUserTransactions(userId: string): Promise<Transaction[]>;
  updateUserBalance(userId: string, amount: string): Promise<User>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Market operations
  async createMarket(market: InsertMarket): Promise<Market> {
    // Validate payment signature is provided
    if (!market.paymentSignature) {
      throw new Error("USDC payment signature is required to create market");
    }

    // Validate signature format (in production, would validate against Solana blockchain)
    if (market.paymentSignature.length < 10) {
      throw new Error("Invalid USDC payment signature format");
    }

    const [createdMarket] = await db
      .insert(markets)
      .values(market)
      .returning();
    return createdMarket;
  }

  async getMarkets(status?: string): Promise<Market[]> {
    const query = db.select().from(markets);
    
    if (status) {
      return await query.where(eq(markets.status, status)).orderBy(desc(markets.createdAt));
    }
    
    return await query.orderBy(desc(markets.createdAt));
  }

  async getMarket(id: number): Promise<Market | undefined> {
    const [market] = await db.select().from(markets).where(eq(markets.id, id));
    return market;
  }

  async joinMarket(marketId: number, counterpartyId: string): Promise<Market> {
    const [market] = await db
      .update(markets)
      .set({
        counterpartyId,
        status: "active",
      })
      .where(and(
        eq(markets.id, marketId),
        eq(markets.status, "open"),
        isNull(markets.counterpartyId)
      ))
      .returning();
    
    if (!market) {
      throw new Error("Market not available for joining");
    }
    
    return market;
  }

  async settleMarket(marketId: number, settlement: string): Promise<Market> {
    const [market] = await db
      .update(markets)
      .set({
        settlement,
        status: "settled",
        settledAt: new Date(),
      })
      .where(eq(markets.id, marketId))
      .returning();
    
    if (!market) {
      throw new Error("Market not found");
    }
    
    return market;
  }

  async getUserMarkets(userId: string): Promise<Market[]> {
    return await db
      .select()
      .from(markets)
      .where(or(
        eq(markets.creatorId, userId),
        eq(markets.counterpartyId, userId)
      ))
      .orderBy(desc(markets.createdAt));
  }

  // Transaction operations
  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [created] = await db
      .insert(transactions)
      .values(transaction)
      .returning();
    return created;
  }

  async getUserTransactions(userId: string): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt));
  }

  async updateUserBalance(userId: string, amount: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ balance: amount })
      .where(eq(users.id, userId))
      .returning();
    
    if (!user) {
      throw new Error("User not found");
    }
    
    return user;
  }
}

export const storage = new DatabaseStorage();
