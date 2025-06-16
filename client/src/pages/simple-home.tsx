import { useState } from "react";
import { Navigation } from "@/components/navigation";
import { StatsCard } from "@/components/ui/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SOLPaymentModal } from "@/components/payment/USDCPaymentModal";
import { useLocation } from "wouter";
import { useSolanaWallet } from "@/hooks/useSolanaWallet";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [, setLocation] = useLocation();
  const [filterStatus, setFilterStatus] = useState<string>("open");
  const { publicKey, connected } = useSolanaWallet();
  const { toast } = useToast();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState<any>(null);

  // Demo markets data for wallet-authenticated users
  const demoMarkets = [
    {
      id: 1,
      title: "Will Bitcoin reach $100,000 by end of 2024?",
      description: "Prediction market on Bitcoin price target",
      stakeAmount: "50.00",
      status: "open",
      createdAt: new Date().toISOString(),
      creatorPosition: "yes"
    },
    {
      id: 2,
      title: "Will Solana's SOL token surpass $200 this year?",
      description: "Market on SOL token price prediction",
      stakeAmount: "25.00",
      status: "open",
      createdAt: new Date().toISOString(),
      creatorPosition: "yes"
    },
    {
      id: 3,
      title: "Will Ethereum 2.0 staking yield exceed 5% APY?",
      description: "Prediction on ETH staking rewards",
      stakeAmount: "75.00",
      status: "active",
      createdAt: new Date().toISOString(),
      creatorPosition: "no"
    }
  ];

  const openMarkets = demoMarkets.filter(m => m.status === "open");
  const activeMarkets = demoMarkets.filter(m => m.status === "active");

  const handleJoinMarket = (marketId: number) => {
    if (!connected) {
      toast({
        title: "Wallet Required",
        description: "Please connect your Solana wallet to join markets",
        variant: "destructive",
      });
      return;
    }

    const market = demoMarkets.find(m => m.id === marketId);
    if (market) {
      setSelectedMarket(market);
      setIsPaymentModalOpen(true);
    }
  };

  const handlePaymentComplete = () => {
    if (selectedMarket) {
      toast({
        title: "Market Joined",
        description: `Successfully joined "${selectedMarket.title}" with ${selectedMarket.stakeAmount} USDC`,
      });
      setSelectedMarket(null);
    }
  };

  if (!connected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Connect your wallet to view markets</h2>
          <p className="text-gray-600 mb-6">Authentication required to participate in betting markets</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Prediction Markets</h1>
          <p className="text-gray-600">Authenticated as {publicKey?.slice(0, 8)}...{publicKey?.slice(-8)}</p>
        </div>

        {/* Platform Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Volume"
            value="$12,500"
            icon="fas fa-chart-line"
            color="primary"
          />
          <StatsCard
            title="Open Markets"
            value={openMarkets.length}
            icon="fas fa-store"
            color="success"
          />
          <StatsCard
            title="Active Bets"
            value={activeMarkets.length}
            icon="fas fa-handshake"
            color="warning"
          />
          <StatsCard
            title="Your Wallet"
            value={`${publicKey?.slice(0, 4)}...${publicKey?.slice(-4)}`}
            icon="fas fa-wallet"
            color="primary"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-4 mb-6">
          {["open", "active", "settled"].map((status) => (
            <Button
              key={status}
              variant={filterStatus === status ? "default" : "outline"}
              onClick={() => setFilterStatus(status)}
              className="capitalize"
            >
              {status} Markets
            </Button>
          ))}
        </div>

        {/* Create Market Button */}
        <div className="mb-6">
          <Button
            onClick={() => setLocation("/create")}
            className="bg-primary hover:bg-primary/90"
          >
            <i className="fas fa-plus mr-2"></i>
            Create New Market
          </Button>
        </div>

        {/* Markets Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {demoMarkets
            .filter(market => filterStatus === "all" || market.status === filterStatus)
            .map((market) => (
              <Card key={market.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg line-clamp-2">{market.title}</CardTitle>
                    <Badge variant={market.status === "open" ? "default" : market.status === "active" ? "secondary" : "outline"}>
                      {market.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{market.description}</p>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-sm text-gray-500">Stake Amount</span>
                      <div className="font-semibold">${market.stakeAmount}</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Creator Position</span>
                      <div className="font-semibold capitalize">{market.creatorPosition}</div>
                    </div>
                  </div>

                  {market.status === "open" ? (
                    <Button
                      onClick={() => handleJoinMarket(market.id)}
                      className="w-full bg-primary hover:bg-primary/90"
                    >
                      Join Market
                    </Button>
                  ) : (
                    <Button variant="outline" disabled className="w-full">
                      {market.status === "active" ? "In Progress" : "Settled"}
                    </Button>
                  )}

                  <div className="mt-3 text-xs text-gray-500">
                    Created {new Date(market.createdAt).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>

        {demoMarkets.filter(market => filterStatus === "all" || market.status === filterStatus).length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-store text-gray-400 text-2xl"></i>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No {filterStatus} markets</h3>
            <p className="text-gray-600 mb-4">Be the first to create a market in this category</p>
            <Button onClick={() => setLocation("/create")}>
              Create Market
            </Button>
          </div>
        )}

        {/* USDC Payment Modal */}
        <USDCPaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          onPaymentComplete={handlePaymentComplete}
          amount={selectedMarket?.stakeAmount || "0"}
          marketTitle={selectedMarket?.title || "Market"}
          action="join"
        />
      </div>
    </div>
  );
}