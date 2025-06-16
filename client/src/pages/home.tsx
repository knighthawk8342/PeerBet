import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navigation } from "@/components/navigation";
import { StatsCard } from "@/components/ui/stats-card";
import { MarketCard } from "@/components/ui/market-card";
import { JoinMarketModal } from "@/components/ui/join-market-modal";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useSolanaWallet } from "@/hooks/useSolanaWallet";
import type { Market } from "@shared/schema";

export default function Home() {
  const [, setLocation] = useLocation();
  const [filterStatus, setFilterStatus] = useState<string>("open");
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const { publicKey } = useSolanaWallet();

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

  const handleJoinMarket = (market: Market) => {
    setSelectedMarket(market);
  };

  const tabs = [
    { id: "open", label: "Open Markets", count: openMarkets.length },
    { id: "active", label: "Active Bets", count: activeMarkets.length },
    { id: "settled", label: "Completed", count: settledMarkets.length },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Active Markets</h1>
              <p className="text-gray-600">Join a 1v1 betting market or create your own</p>
            </div>
            <div className="mt-4 sm:mt-0">
              <Button 
                onClick={() => setLocation("/create")}
                className="bg-primary hover:bg-primary/90"
              >
                <i className="fas fa-plus w-4 h-4 mr-2"></i>
                Create Market
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Open Markets"
            value={openMarkets.length}
            icon="fas fa-chart-line"
            color="primary"
          />
          <StatsCard
            title="Active Bets"
            value={activeMarkets.length}
            icon="fas fa-clock"
            color="warning"
          />
          <StatsCard
            title="Completed"
            value={settledMarkets.length}
            icon="fas fa-check-circle"
            color="success"
          />
          <StatsCard
            title="Total Volume"
            value={`${allMarkets.reduce((sum: number, m: Market) => sum + parseFloat(m.stakeAmount) * (m.status === "active" || m.status === "settled" ? 2 : 1), 0).toFixed(3)} SOL`}
            icon="fas fa-coins"
            color="gray"
          />
        </div>

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilterStatus(tab.id)}
                  className={`${
                    filterStatus === tab.id
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
                >
                  <span>{tab.label}</span>
                  <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
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
