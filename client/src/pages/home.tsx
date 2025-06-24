import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Navigation } from "@/components/navigation";
import { StatsCard } from "@/components/ui/stats-card";
import { MarketCard } from "@/components/ui/market-card";
import { JoinMarketModal } from "@/components/ui/join-market-modal";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useSolanaWallet } from "@/hooks/useSolanaWallet";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Market } from "@shared/schema";

export default function Home() {
  const [, setLocation] = useLocation();
  const [filterStatus, setFilterStatus] = useState<string>("open");
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const { publicKey } = useSolanaWallet();
  const { toast } = useToast();

  const { data: allMarkets = [], isLoading } = useQuery({
    queryKey: ["/api/markets"],
    queryFn: async () => {
      const headers: Record<string, string> = {};
      if (publicKey) {
        headers["x-wallet-public-key"] = publicKey;
      }
      
      const response = await fetch("/api/markets", {
        credentials: "include",
        headers,
      });
      if (!response.ok) throw new Error("Failed to fetch markets");
      const data = await response.json();
      console.log("Fetched markets data:", data);
      return data;
    },
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const markets = filterStatus === "all" ? allMarkets : allMarkets.filter((m: Market) => m.status === filterStatus);

  const openMarkets = allMarkets.filter((m: Market) => m.status === "open");
  const activeMarkets = allMarkets.filter((m: Market) => m.status === "active");
  const settledMarkets = allMarkets.filter((m: Market) => m.status === "settled");
  const cancelledMarkets = allMarkets.filter((m: Market) => m.status === "cancelled");

  const handleJoinMarket = (market: Market) => {
    setSelectedMarket(market);
  };

  const closeMarketMutation = useMutation({
    mutationFn: async (marketId: number) => {
      return await apiRequest("POST", `/api/markets/${marketId}/close`);
    },
    onSuccess: (data: any) => {
      const refundStatus = data?.refund?.status;
      const refundAmount = data?.refund?.amount;
      const signature = data?.refund?.signature;
      
      if (refundStatus === "completed" && signature) {
        toast({
          title: "Market Closed & Refunded",
          description: `Your market has been closed and ${refundAmount} SOL has been automatically refunded to your wallet.`,
        });
      } else {
        toast({
          title: "Market Closed",
          description: "Your market has been closed. Refund processing may take a moment.",
          variant: "default",
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/markets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/markets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/transactions"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to close market",
        variant: "destructive",
      });
    },
  });

  const handleCloseMarket = (market: Market) => {
    closeMarketMutation.mutate(market.id);
  };

  const tabs = [
    { id: "open", label: "Open Markets", count: openMarkets.length },
    { id: "active", label: "Active Bets", count: activeMarkets.length },
    { id: "settled", label: "Completed", count: settledMarkets.length },
    { id: "cancelled", label: "Closed", count: cancelledMarkets.length },
    { id: "all", label: "All Markets", count: allMarkets.length },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
                Prediction Markets
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Join 1v1 betting markets or create your own predictions on Solana
              </p>
            </div>
            <div className="mt-6 sm:mt-0">
              <Button 
                onClick={() => setLocation("/create-market")}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
                size="lg"
              >
                <span className="mr-2">✨</span>
                Create Market
              </Button>
            </div>
          </div>
        </div>

        {/* Market Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <div className="w-6 h-6 text-blue-600 dark:text-blue-400">📊</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{openMarkets.length}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Available</div>
              </div>
            </div>
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Open Markets</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
                <div className="w-6 h-6 text-orange-600 dark:text-orange-400">⚡</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{activeMarkets.length}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Live</div>
              </div>
            </div>
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Active Bets</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                <div className="w-6 h-6 text-green-600 dark:text-green-400">✅</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{settledMarkets.length}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Settled</div>
              </div>
            </div>
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Completed</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                <div className="w-6 h-6 text-purple-600 dark:text-purple-400">💰</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {allMarkets.reduce((sum: number, m: Market) => sum + parseFloat(m.stakeAmount) * (m.status === "active" || m.status === "settled" ? 2 : 1), 0).toFixed(3)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">SOL</div>
              </div>
            </div>
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Volume</div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-2 shadow-sm border border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-2 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilterStatus(tab.id)}
                  className={`${
                    filterStatus === tab.id
                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  } whitespace-nowrap py-2 px-4 rounded-xl font-medium text-sm flex items-center space-x-2 transition-all duration-200`}
                >
                  <span>{tab.label}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    filterStatus === tab.id 
                      ? "bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200"
                      : "bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300"
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Markets Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="h-3 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : markets.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-chart-line text-gray-400 text-xl"></i>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No markets found</h3>
            <p className="text-gray-600">Be the first to create a market!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {markets.map((market: Market) => (
              <MarketCard
                key={market.id}
                market={market}
                onJoin={handleJoinMarket}
                onClose={handleCloseMarket}
              />
            ))}
          </div>
        )}

        {/* Join Market Modal */}
        <JoinMarketModal
          market={selectedMarket}
          isOpen={!!selectedMarket}
          onClose={() => setSelectedMarket(null)}
        />
      </div>
    </div>
  );
}
