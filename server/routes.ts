import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMarketSchema, joinMarketSchema, settleMarketSchema } from "@shared/schema";
import { z } from "zod";
import type { RequestHandler } from "express";

const PLATFORM_FEE_RATE = 0.02; // 2%

// Simple wallet-based authentication middleware
const requireWalletAuth: RequestHandler = async (req: any, res, next) => {
  const walletPublicKey = req.headers['x-wallet-public-key'] as string;
  
  if (!walletPublicKey) {
    return res.status(401).json({ message: "Wallet public key required" });
  }
  
  try {
    // Get or create user based on wallet public key
    let user = await storage.getUser(walletPublicKey);
    if (!user) {
      user = await storage.upsertUser({
        id: walletPublicKey,
        email: null,
        firstName: null,
        lastName: null,
        profileImageUrl: null,
      });
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error("Auth error:", error);
    res.status(401).json({ message: "Authentication failed" });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.get('/api/auth/user', requireWalletAuth, async (req: any, res) => {
    try {
      res.json(req.user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Market routes
  app.get('/api/markets', async (req, res) => {
    try {
      const status = req.query.status as string;
      const markets = await storage.getMarkets(status);
      res.json(markets);
    } catch (error) {
      console.error("Error fetching markets:", error);
      res.status(500).json({ message: "Failed to fetch markets" });
    }
  });

  app.get('/api/markets/:id', async (req, res) => {
    try {
      const marketId = parseInt(req.params.id);
      const market = await storage.getMarket(marketId);
      
      if (!market) {
        return res.status(404).json({ message: "Market not found" });
      }
      
      res.json(market);
    } catch (error) {
      console.error("Error fetching market:", error);
      res.status(500).json({ message: "Failed to fetch market" });
    }
  });

  app.post('/api/markets', requireWalletAuth, async (req: any, res) => {
    try {
      const user = req.user;

      const validatedData = insertMarketSchema.parse(req.body);
      
      // Check if user has sufficient balance
      const userBalance = parseFloat(user.balance || "0");
      if (userBalance < validatedData.stakeAmount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      // Create market
      const market = await storage.createMarket({
        ...validatedData,
        creatorId: user.id,
        stakeAmount: validatedData.stakeAmount.toString(),
      });

      // Deduct stake from user balance
      const newBalance = userBalance - validatedData.stakeAmount;
      await storage.updateUserBalance(user.id, newBalance.toString());

      // Create transaction record
      await storage.createTransaction({
        userId: user.id,
        type: "stake",
        amount: validatedData.stakeAmount.toString(),
        description: `Created market: ${validatedData.title}`,
      });

      res.json(market);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating market:", error);
      res.status(500).json({ message: "Failed to create market" });
    }
  });

  app.post('/api/markets/:id/join', requireWalletAuth, async (req: any, res) => {
    try {
      const user = req.user;
      const marketId = parseInt(req.params.id);
      
      const market = await storage.getMarket(marketId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (!market) {
        return res.status(404).json({ message: "Market not found" });
      }

      // Prevent user from joining their own market
      if (market.creatorId === user.id) {
        return res.status(400).json({ message: "Cannot join your own market" });
      }

      // Check if market is still open
      if (market.status !== "open") {
        return res.status(400).json({ message: "Market is not available for joining" });
      }

      // Check if user has sufficient balance
      const userBalance = parseFloat(user.balance || "0");
      const stakeAmount = parseFloat(market.stakeAmount);
      
      if (userBalance < stakeAmount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      // Join market
      const updatedMarket = await storage.joinMarket(marketId, user.id);

      // Deduct stake from user balance
      const newBalance = userBalance - stakeAmount;
      await storage.updateUserBalance(user.id, newBalance.toString());

      // Create transaction record
      await storage.createTransaction({
        user.id,
        marketId: updatedMarket.id,
        type: "stake",
        amount: stakeAmount.toString(),
        description: `Joined market: ${updatedMarket.title}`,
      });

      res.json(updatedMarket);
    } catch (error) {
      console.error("Error joining market:", error);
      res.status(500).json({ message: "Failed to join market" });
    }
  });

  // Admin routes
  app.get('/api/admin/markets/pending', requireWalletAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(user.id);
      
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const pendingMarkets = await storage.getMarkets("active");
      res.json(pendingMarkets);
    } catch (error) {
      console.error("Error fetching pending markets:", error);
      res.status(500).json({ message: "Failed to fetch pending markets" });
    }
  });

  app.post('/api/admin/markets/:id/settle', requireWalletAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(user.id);
      
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const marketId = parseInt(req.params.id);
      const { settlement } = settleMarketSchema.parse(req.body);
      
      const market = await storage.getMarket(marketId);
      if (!market) {
        return res.status(404).json({ message: "Market not found" });
      }

      if (market.status !== "active") {
        return res.status(400).json({ message: "Market is not active" });
      }

      // Settle the market
      const settledMarket = await storage.settleMarket(marketId, settlement);
      
      const stakeAmount = parseFloat(market.stakeAmount);
      const totalPool = stakeAmount * 2;
      const platformFee = totalPool * PLATFORM_FEE_RATE;
      const winnerAmount = totalPool - platformFee;

      // Process payouts based on settlement
      if (settlement === "creator_wins") {
        // Pay creator
        const creator = await storage.getUser(market.creatorId);
        if (creator) {
          const newBalance = parseFloat(creator.balance || "0") + winnerAmount;
          await storage.updateUserBalance(market.creatorId, newBalance.toString());
          
          await storage.createTransaction({
            userId: market.creatorId,
            marketId: market.id,
            type: "payout",
            amount: winnerAmount.toString(),
            description: `Won market: ${market.title}`,
          });
        }
      } else if (settlement === "counterparty_wins" && market.counterpartyId) {
        // Pay counterparty
        const counterparty = await storage.getUser(market.counterpartyId);
        if (counterparty) {
          const newBalance = parseFloat(counterparty.balance || "0") + winnerAmount;
          await storage.updateUserBalance(market.counterpartyId, newBalance.toString());
          
          await storage.createTransaction({
            userId: market.counterpartyId,
            marketId: market.id,
            type: "payout",
            amount: winnerAmount.toString(),
            description: `Won market: ${market.title}`,
          });
        }
      } else if (settlement === "refund") {
        // Refund both parties
        const creator = await storage.getUser(market.creatorId);
        if (creator) {
          const newBalance = parseFloat(creator.balance || "0") + stakeAmount;
          await storage.updateUserBalance(market.creatorId, newBalance.toString());
          
          await storage.createTransaction({
            userId: market.creatorId,
            marketId: market.id,
            type: "refund",
            amount: stakeAmount.toString(),
            description: `Refund for market: ${market.title}`,
          });
        }

        if (market.counterpartyId) {
          const counterparty = await storage.getUser(market.counterpartyId);
          if (counterparty) {
            const newBalance = parseFloat(counterparty.balance || "0") + stakeAmount;
            await storage.updateUserBalance(market.counterpartyId, newBalance.toString());
            
            await storage.createTransaction({
              userId: market.counterpartyId,
              marketId: market.id,
              type: "refund",
              amount: stakeAmount.toString(),
              description: `Refund for market: ${market.title}`,
            });
          }
        }
      }

      // Record platform fee if not refund
      if (settlement !== "refund") {
        await storage.createTransaction({
          userId: "platform",
          marketId: market.id,
          type: "fee",
          amount: platformFee.toString(),
          description: `Platform fee for market: ${market.title}`,
        });
      }

      res.json(settledMarket);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error settling market:", error);
      res.status(500).json({ message: "Failed to settle market" });
    }
  });

  // User dashboard routes
  app.get('/api/user/markets', requireWalletAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const markets = await storage.getUserMarkets(user.id);
      res.json(markets);
    } catch (error) {
      console.error("Error fetching user markets:", error);
      res.status(500).json({ message: "Failed to fetch user markets" });
    }
  });

  app.get('/api/user/transactions', requireWalletAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const transactions = await storage.getUserTransactions(user.id);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching user transactions:", error);
      res.status(500).json({ message: "Failed to fetch user transactions" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
