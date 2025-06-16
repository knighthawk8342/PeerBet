import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useSolanaWallet } from "@/hooks/useSolanaWallet";
import { Navigation } from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Market } from "@shared/schema";


export default function Admin() {
  const { connected, publicKey } = useSolanaWallet();
  const { toast } = useToast();

  // Admin access control - only specific wallet addresses can access admin functions
  const adminWallets = [
    "225uwqkTBvk9P8h7KaQNvmz5mAL4M5cUVMrJfU3zk5xP", // Original creator wallet
    "3Wsd58mfJMq3hmsNwaZe896ny91ZaAaugfjBLuNYiAh4"  // Second wallet for testing
  ];

  const isAdmin = connected && publicKey && adminWallets.includes(publicKey);

  // Show warning if not admin
  useEffect(() => {
    if (connected && !isAdmin) {
      toast({
        title: "Unauthorized",
        description: "Admin access required.",
        variant: "destructive",
      });
    }
  }, [connected, isAdmin, toast]);

  // Fetch all markets for admin overview
  const { data: allMarkets = [], isLoading: marketsLoading } = useQuery<Market[]>({
    queryKey: ["/api/markets"],
    enabled: !!connected && !!isAdmin,
  });

  // Settlement mutation
  const settleMutation = useMutation({
    mutationFn: async ({ marketId, settlement }: { marketId: number, settlement: string }) => {
      return await apiRequest("POST", `/api/admin/markets/${marketId}/settle`, { settlement });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/markets"] });
      toast({
        title: "Market Settled",
        description: "Winner has been determined and payouts processed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Settlement Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!connected) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Admin Panel
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Please connect your wallet to access admin functions.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Access Denied
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Your wallet ({publicKey?.slice(0, 8)}...) does not have admin privileges.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const activeMarkets = (allMarkets as Market[]).filter((m: Market) => m.status === "active");
  const settledMarkets = (allMarkets as Market[]).filter((m: Market) => m.status === "settled");
  const openMarkets = (allMarkets as Market[]).filter((m: Market) => m.status === "open");

  const totalVolume = (allMarkets as Market[]).reduce((sum: number, m: Market) => {
    const stakeAmount = parseFloat(m.stakeAmount);
    const multiplier = m.status === "active" || m.status === "settled" ? 2 : 1;
    return sum + (stakeAmount * multiplier);
  }, 0);

  const platformRevenue = settledMarkets.reduce((sum: number, m: Market) => {
    const stakeAmount = parseFloat(m.stakeAmount);
    const totalPool = stakeAmount * 2;
    const fee = totalPool * 0.02; // 2% platform fee
    return sum + fee;
  }, 0);

  const handleSettle = (marketId: number, settlement: string) => {
    settleMutation.mutate({ marketId, settlement });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Admin Panel
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage markets and settle betting outcomes
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Markets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {(allMarkets as Market[]).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Active Markets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {activeMarkets.length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Volume
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalVolume.toFixed(3)} SOL
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Platform Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {platformRevenue.toFixed(3)} SOL
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Markets - Ready for Settlement */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
              Active Markets - Awaiting Settlement
            </CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Markets with both participants that need outcome determination
            </p>
          </CardHeader>
          <CardContent>
            {marketsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Loading markets...</p>
              </div>
            ) : activeMarkets.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 dark:text-gray-400">No active markets awaiting settlement</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeMarkets.map((market: Market) => (
                  <div key={market.id} className="border rounded-lg p-4 bg-white dark:bg-gray-800">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
                          {market.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-2">
                          {market.description}
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                          <span>Category: {market.category}</span>
                          <span>Stake: {market.stakeAmount} SOL each</span>
                          <span>Total Pool: {(parseFloat(market.stakeAmount) * 2).toFixed(3)} SOL</span>
                        </div>
                      </div>
                      <Badge variant="secondary" className="ml-4">
                        {market.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Creator</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                          {market.creatorId.slice(0, 8)}...{market.creatorId.slice(-8)}
                        </div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Counterparty</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                          {market.counterpartyId?.slice(0, 8)}...{market.counterpartyId?.slice(-8) || "None"}
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        onClick={() => handleSettle(market.id, "creator_wins")}
                        disabled={settleMutation.isPending}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        Creator Wins
                      </Button>
                      <Button
                        onClick={() => handleSettle(market.id, "counterparty_wins")}
                        disabled={settleMutation.isPending}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        Counterparty Wins
                      </Button>
                      <Button
                        onClick={() => handleSettle(market.id, "refund")}
                        disabled={settleMutation.isPending}
                        variant="outline"
                      >
                        Refund Both
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Market Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Open Markets */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                Open Markets ({openMarkets.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {openMarkets.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400">No open markets</p>
              ) : (
                <div className="space-y-3">
                  {openMarkets.slice(0, 5).map((market: Market) => (
                    <div key={market.id} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{market.title}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{market.stakeAmount} SOL</div>
                      </div>
                      <Badge variant="outline">Open</Badge>
                    </div>
                  ))}
                  {openMarkets.length > 5 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      +{openMarkets.length - 5} more markets
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Settled Markets */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                Recently Settled ({settledMarkets.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {settledMarkets.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400">No settled markets</p>
              ) : (
                <div className="space-y-3">
                  {settledMarkets.slice(0, 5).map((market: Market) => (
                    <div key={market.id} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{market.title}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {market.settlement === "creator_wins" ? "Creator Won" : 
                           market.settlement === "counterparty_wins" ? "Counterparty Won" : "Refunded"}
                        </div>
                      </div>
                      <Badge variant="secondary">Settled</Badge>
                    </div>
                  ))}
                  {settledMarkets.length > 5 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      +{settledMarkets.length - 5} more markets
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}