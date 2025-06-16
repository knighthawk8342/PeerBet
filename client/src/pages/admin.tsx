import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Navigation } from "@/components/navigation";
import { StatsCard } from "@/components/ui/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Market } from "@shared/schema";

export default function Admin() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !user?.isAdmin)) {
      toast({
        title: "Unauthorized",
        description: "Admin access required. Redirecting...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, user?.isAdmin, toast]);

  const { data: pendingMarkets = [], isLoading: marketsLoading, refetch } = useQuery({
    queryKey: ["/api/admin/markets/pending"],
    enabled: isAuthenticated && user?.isAdmin,
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "Admin session expired. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return false;
      }
      return failureCount < 3;
    },
  });

  const { data: allMarkets = [] } = useQuery({
    queryKey: ["/api/markets"],
    enabled: isAuthenticated && user?.isAdmin,
  });

  const settleMutation = useMutation({
    mutationFn: async ({ marketId, settlement }: { marketId: number; settlement: string }) => {
      await apiRequest("POST", `/api/admin/markets/${marketId}/settle`, { settlement });
    },
    onSuccess: () => {
      toast({
        title: "Market Settled",
        description: "The market has been settled successfully!",
      });
      refetch();
      queryClient.invalidateQueries({ queryKey: ["/api/markets"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "Admin session expired. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to settle market",
        variant: "destructive",
      });
    },
  });

  if (isLoading || !isAuthenticated || !user?.isAdmin) {
    return <div>Loading...</div>;
  }

  const openMarkets = allMarkets.filter((m: Market) => m.status === "open");
  const activeMarkets = allMarkets.filter((m: Market) => m.status === "active");
  const settledMarkets = allMarkets.filter((m: Market) => m.status === "settled");
  
  const totalVolume = allMarkets.reduce((sum: number, m: Market) => {
    const stakeAmount = parseFloat(m.stakeAmount);
    return sum + (m.status === "active" || m.status === "settled" ? stakeAmount * 2 : stakeAmount);
  }, 0);

  const platformRevenue = settledMarkets.reduce((sum: number, m: Market) => {
    if (m.settlement !== "refund") {
      const stakeAmount = parseFloat(m.stakeAmount);
      const totalPool = stakeAmount * 2;
      return sum + (totalPool * 0.02);
    }
    return sum;
  }, 0);

  const handleSettle = (marketId: number, settlement: string) => {
    settleMutation.mutate({ marketId, settlement });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Panel</h1>
          <p className="text-gray-600">Settle pending bets and manage platform</p>
        </div>

        {/* Platform Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Pending Settlement"
            value={pendingMarkets.length}
            icon="fas fa-clock"
            color="warning"
          />
          <StatsCard
            title="Platform Revenue"
            value={`$${platformRevenue.toFixed(2)}`}
            icon="fas fa-dollar-sign"
            color="success"
          />
          <StatsCard
            title="Total Users"
            value="--"
            icon="fas fa-users"
            color="primary"
          />
          <StatsCard
            title="Total Volume"
            value={`$${totalVolume.toLocaleString()}`}
            icon="fas fa-chart-bar"
            color="gray"
          />
        </div>

        {/* Platform Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Open Markets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{openMarkets.length}</div>
              <p className="text-sm text-gray-600">Awaiting counterparties</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Active Bets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{activeMarkets.length}</div>
              <p className="text-sm text-gray-600">Requiring settlement</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Settled Markets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{settledMarkets.length}</div>
              <p className="text-sm text-gray-600">Completed markets</p>
            </CardContent>
          </Card>
        </div>

        {/* Pending Settlements */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Settlements</CardTitle>
          </CardHeader>
          <CardContent>
            {marketsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="p-4 border rounded-lg animate-pulse">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : pendingMarkets.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-check-circle text-gray-400"></i>
                </div>
                <p className="text-gray-600">No pending settlements</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Market</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Participants</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Stake</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Created</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingMarkets.map((market: Market) => (
                      <tr key={market.id} className="border-b border-gray-100">
                        <td className="py-4 px-4">
                          <div>
                            <div className="font-medium text-gray-900 line-clamp-2">{market.title}</div>
                            <div className="text-sm text-gray-500 capitalize">{market.category}</div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm">
                            <div>Creator: {market.creatorId}</div>
                            <div>Counterparty: {market.counterpartyId}</div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div>
                            <div className="font-medium">${parseFloat(market.stakeAmount).toFixed(2)}</div>
                            <div className="text-sm text-gray-500">
                              Pool: ${(parseFloat(market.stakeAmount) * 2).toFixed(2)}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-500">
                          {new Date(market.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleSettle(market.id, "creator_wins")}
                              disabled={settleMutation.isPending}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Creator Wins
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleSettle(market.id, "counterparty_wins")}
                              disabled={settleMutation.isPending}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Counterparty Wins
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSettle(market.id, "refund")}
                              disabled={settleMutation.isPending}
                            >
                              Refund
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
