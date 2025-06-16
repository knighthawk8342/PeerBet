import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Navigation } from "@/components/navigation";
import { StatsCard } from "@/components/ui/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Market, Transaction } from "@shared/schema";

export default function Dashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
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
  }, [isAuthenticated, isLoading, toast]);

  const { data: userMarkets = [], isLoading: marketsLoading } = useQuery({
    queryKey: ["/api/user/markets"],
    enabled: isAuthenticated,
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
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

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ["/api/user/transactions"],
    enabled: isAuthenticated,
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error as Error)) {
        return false;
      }
      return failureCount < 3;
    },
  });

  if (isLoading || !isAuthenticated) {
    return <div>Loading...</div>;
  }

  const activeMarkets = userMarkets.filter((m: Market) => m.status === "active");
  const completedMarkets = userMarkets.filter((m: Market) => m.status === "settled");
  const wins = completedMarkets.filter((m: Market) => 
    (m.settlement === "creator_wins" && m.creatorId === user?.id) ||
    (m.settlement === "counterparty_wins" && m.counterpartyId === user?.id)
  );
  const winRate = completedMarkets.length > 0 ? Math.round((wins.length / completedMarkets.length) * 100) : 0;

  const totalProfit = transactions
    .filter((t: Transaction) => t.type === "payout")
    .reduce((sum: number, t: Transaction) => sum + parseFloat(t.amount), 0) -
    transactions
    .filter((t: Transaction) => t.type === "stake")
    .reduce((sum: number, t: Transaction) => sum + parseFloat(t.amount), 0);

  const getMarketStatus = (market: Market) => {
    if (market.status === "open") return { label: "Open", color: "bg-green-100 text-green-800" };
    if (market.status === "active") return { label: "Active", color: "bg-orange-100 text-orange-800" };
    if (market.status === "settled") {
      if (market.settlement === "refund") return { label: "Refunded", color: "bg-gray-100 text-gray-800" };
      const isWinner = (market.settlement === "creator_wins" && market.creatorId === user?.id) ||
                      (market.settlement === "counterparty_wins" && market.counterpartyId === user?.id);
      return { 
        label: isWinner ? "Won" : "Lost", 
        color: isWinner ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800" 
      };
    }
    return { label: "Unknown", color: "bg-gray-100 text-gray-800" };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Dashboard</h1>
          <p className="text-gray-600">Manage your bets and track your performance</p>
        </div>

        {/* User Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Current Balance"
            value={`$${parseFloat(user?.balance || "0").toFixed(2)}`}
            icon="fas fa-wallet"
            color="primary"
          />
          <StatsCard
            title="Win Rate"
            value={`${winRate}%`}
            icon="fas fa-trophy"
            color="success"
          />
          <StatsCard
            title="Total Profit"
            value={`${totalProfit >= 0 ? '+' : ''}$${totalProfit.toFixed(2)}`}
            icon="fas fa-chart-bar"
            color={totalProfit >= 0 ? "success" : "destructive"}
          />
          <StatsCard
            title="Active Bets"
            value={activeMarkets.length}
            icon="fas fa-handshake"
            color="warning"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* My Markets */}
          <Card>
            <CardHeader>
              <CardTitle>My Markets</CardTitle>
            </CardHeader>
            <CardContent>
              {marketsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="p-4 bg-gray-50 rounded-lg animate-pulse">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : userMarkets.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-chart-line text-gray-400"></i>
                  </div>
                  <p className="text-gray-600">No markets yet</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {userMarkets.map((market: Market) => {
                    const status = getMarketStatus(market);
                    const isCreator = market.creatorId === user?.id;
                    
                    return (
                      <div key={market.id} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-medium text-gray-900 line-clamp-2">{market.title}</h3>
                          <Badge className={status.color}>{status.label}</Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <span>
                            {isCreator ? "Creator" : "Counterparty"} • ${parseFloat(market.stakeAmount).toFixed(2)} staked
                          </span>
                          <span>{new Date(market.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {transactionsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="p-4 bg-gray-50 rounded-lg animate-pulse">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-receipt text-gray-400"></i>
                  </div>
                  <p className="text-gray-600">No transactions yet</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {transactions.slice(0, 10).map((transaction: Transaction) => (
                    <div key={transaction.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900 capitalize">
                          {transaction.type}
                        </span>
                        <span className={`text-sm font-semibold ${
                          transaction.type === "payout" || transaction.type === "refund" 
                            ? "text-green-600" 
                            : "text-red-600"
                        }`}>
                          {transaction.type === "payout" || transaction.type === "refund" ? "+" : "-"}
                          ${parseFloat(transaction.amount).toFixed(2)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2">{transaction.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(transaction.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
