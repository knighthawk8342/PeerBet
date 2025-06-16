import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMarketSchema, joinMarketSchema, settleMarketRequestSchema } from "@shared/schema";
import { z } from "zod";
import type { RequestHandler } from "express";

const PLATFORM_FEE_RATE = 0.02; // 2%

// Simple wallet-based authentication middleware
const requireWalletAuth: RequestHandler = async (req: any, res, next) => {
  const walletPublicKey = req.headers['x-wallet-public-key'] as string;
  
  console.log("Auth middleware - Wallet public key:", walletPublicKey);
  
  if (!walletPublicKey) {
    console.log("Auth middleware - No wallet public key provided");
    return res.status(401).json({ message: "Wallet public key required" });
  }
  
  try {
    // Get or create user based on wallet public key
    let user = await storage.getUser(walletPublicKey);
    console.log("Auth middleware - Found user:", user ? "Yes" : "No");
    
    if (!user) {
      console.log("Auth middleware - Creating new user");
      user = await storage.upsertUser({
        id: walletPublicKey,
        email: null,
        firstName: null,
        lastName: null,
        profileImageUrl: null,
      });
    }
    
    req.user = user;
    console.log("Auth middleware - User set:", user.id);
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
      const { paymentSignature } = req.body;
      
      const market = await storage.getMarket(marketId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (!market) {
        return res.status(404).json({ message: "Market not found" });
      }

      if (market.status !== "open") {
        return res.status(400).json({ message: "Market is not open for joining" });
      }

      if (market.creatorId === user.id) {
        return res.status(400).json({ message: "Cannot join your own market" });
      }

      if (!paymentSignature) {
        return res.status(400).json({ message: "Payment signature required" });
      }

      const stakeAmount = parseFloat(market.stakeAmount);

      // Join the market with payment signature
      const updatedMarket = await storage.joinMarket(marketId, user.id);

      // Create transaction record with payment signature
      await storage.createTransaction({
        userId: user.id,
        marketId: updatedMarket.id,
        type: "stake",
        amount: stakeAmount.toString(),
        description: `Joined market: ${updatedMarket.title}`,
        paymentSignature: paymentSignature,
      });

      res.json(updatedMarket);
    } catch (error) {
      console.error("Error joining market:", error);
      res.status(500).json({ message: "Failed to join market" });
    }
  });

  // Admin settlement endpoint  
  app.post('/api/admin/markets/:id/settle', requireWalletAuth, async (req: any, res) => {
    try {
      const user = req.user;
      const marketId = parseInt(req.params.id);
      const { settlement } = settleMarketRequestSchema.parse(req.body);

      // Admin wallet addresses - only these can settle markets
      const adminWallets = [
        "225uwqkTBvk9P8h7KaQNvmz5mAL4M5cUVMrJfU3zk5xP",
        "3Wsd58mfJMq3hmsNwaZe896ny91ZaAaugfjBLuNYiAh4"
      ];

      if (!adminWallets.includes(user.id)) {
        return res.status(403).json({ message: "Admin access required to settle markets" });
      }

      const market = await storage.getMarket(marketId);
      
      if (!market) {
        return res.status(404).json({ message: "Market not found" });
      }

      if (market.status !== "active") {
        return res.status(400).json({ message: "Market is not active" });
      }

      if (!market.counterpartyId) {
        return res.status(400).json({ message: "Market must have a counterparty to settle" });
      }

      // Settle the market in database
      const settledMarket = await storage.settleMarket(marketId, settlement);
      
      const stakeAmount = parseFloat(settledMarket.stakeAmount);
      const totalPot = stakeAmount * 2;
      const platformFee = totalPot * PLATFORM_FEE_RATE;
      const winnerPayout = totalPot - platformFee;

      // Determine winner and create transaction records
      if (settlement === "creator_wins") {
        await storage.createTransaction({
          userId: settledMarket.creatorId,
          marketId: settledMarket.id,
          type: "payout",
          amount: winnerPayout.toString(),
          description: `Won market: ${settledMarket.title}`,
        });
      } else if (settlement === "counterparty_wins") {
        await storage.createTransaction({
          userId: settledMarket.counterpartyId!,
          marketId: settledMarket.id,
          type: "payout", 
          amount: winnerPayout.toString(),
          description: `Won market: ${settledMarket.title}`,
        });
      } else if (settlement === "refund") {
        // Create refund transactions for both parties
        await storage.createTransaction({
          userId: settledMarket.creatorId,
          marketId: settledMarket.id,
          type: "refund",
          amount: stakeAmount.toString(),
          description: `Refund for market: ${settledMarket.title}`,
        });
        await storage.createTransaction({
          userId: settledMarket.counterpartyId!,
          marketId: settledMarket.id,
          type: "refund",
          amount: stakeAmount.toString(),
          description: `Refund for market: ${settledMarket.title}`,
        });
      }

      // Record platform fee transaction (skip for now since platform user doesn't exist)
      // TODO: Create platform user or handle fees differently
      // if (settlement !== "refund") {
      //   await storage.createTransaction({
      //     userId: "platform",
      //     marketId: settledMarket.id,
      //     type: "fee",
      //     amount: platformFee.toString(),
      //     description: `Platform fee for market: ${settledMarket.title}`,
      //   });
      // }

      res.json({ 
        market: settledMarket,
        settlement: {
          totalPot: totalPot.toString(),
          winnerPayout: settlement === "refund" ? stakeAmount.toString() : winnerPayout.toString(),
          platformFee: settlement === "refund" ? "0" : platformFee.toString(),
          payoutRecipient: settlement === "creator_wins" ? settledMarket.creatorId : 
                          settlement === "counterparty_wins" ? settledMarket.counterpartyId : "both"
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error settling market:", error);
      res.status(500).json({ message: "Failed to settle market" });
    }
  });

  app.get('/api/markets/user', requireWalletAuth, async (req: any, res) => {
    try {
      const user = req.user;
      const markets = await storage.getUserMarkets(user.id);
      res.json(markets);
    } catch (error) {
      console.error("Error fetching user markets:", error);
      res.status(500).json({ message: "Failed to fetch user markets" });
    }
  });

  app.get('/api/transactions', requireWalletAuth, async (req: any, res) => {
    try {
      const user = req.user;
      const transactions = await storage.getUserTransactions(user.id);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  // User dashboard routes
  app.get('/api/user/markets', requireWalletAuth, async (req: any, res) => {
    try {
      const user = req.user;
      const markets = await storage.getUserMarkets(user.id);
      res.json(markets);
    } catch (error) {
      console.error("Error fetching user markets:", error);
      res.status(500).json({ message: "Failed to fetch user markets" });
    }
  });

  app.get('/api/user/transactions', requireWalletAuth, async (req: any, res) => {
    try {
      const user = req.user;
      const transactions = await storage.getUserTransactions(user.id);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching user transactions:", error);
      res.status(500).json({ message: "Failed to fetch user transactions" });
    }
  });

  // Admin routes
  app.get('/api/admin/markets', requireWalletAuth, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const markets = await storage.getMarkets();
      res.json(markets);
    } catch (error) {
      console.error("Error fetching admin markets:", error);
      res.status(500).json({ message: "Failed to fetch markets" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}