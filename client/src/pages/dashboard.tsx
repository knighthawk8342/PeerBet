import { useQuery } from "@tanstack/react-query";
import { Navigation } from "@/components/navigation";
import { useSolanaWallet } from "@/hooks/useSolanaWallet";
import type { Market, Transaction } from "@shared/schema";

function StatsCard({ title, value, icon, color }: { title: string; value: string | number; icon: string; color: string }) {
  const colorClasses = {
    primary: "bg-blue-100 text-blue-800",
    success: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
    destructive: "bg-red-100 text-red-800"
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${colorClasses[color as keyof typeof colorClasses]}`}>
          <i className={icon}></i>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { publicKey } = useSolanaWallet();
  
  const { data: userMarkets = [], isLoading: marketsLoading } = useQuery<Market[]>({
    queryKey: ["/api/user/markets"],
    enabled: !!publicKey,
  });

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/user/transactions"],
    enabled: !!publicKey,
  });

  if (!publicKey) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">Connect your wallet to view your dashboard</p>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border">
              <p className="text-center text-gray-600 dark:text-gray-400">Please connect your Solana wallet to continue</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const activeMarkets = userMarkets.filter((m: Market) => m.status === "active");
  const completedMarkets = userMarkets.filter((m: Market) => m.status === "settled");
  
  const decidedMarkets = completedMarkets.filter((m: Market) => m.settlement !== "refund");
  
  const wins = decidedMarkets.filter((m: Market) => {
    if (m.settlement === "creator_wins") {
      return m.creatorId === publicKey;
    } else if (m.settlement === "counterparty_wins") {
      return m.counterpartyId === publicKey;
    }
    return false;
  });
  
  const losses = decidedMarkets.filter((m: Market) => {
    if (m.settlement === "creator_wins") {
      return m.counterpartyId === publicKey;
    } else if (m.settlement === "counterparty_wins") {
      return m.creatorId === publicKey;
    }
    return false;
  });
  
  const refunds = completedMarkets.filter((m: Market) => m.settlement === "refund");
  
  const winRate = decidedMarkets.length > 0 ? Math.round((wins.length / decidedMarkets.length) * 100) : 0;

  const totalProfit = Array.isArray(transactions) ? 
    (transactions as Transaction[])
      .filter((t: Transaction) => t.type === "payout")
      .reduce((sum: number, t: Transaction) => sum + parseFloat(t.amount), 0) -
    (transactions as Transaction[])
      .filter((t: Transaction) => t.type === "stake")
      .reduce((sum: number, t: Transaction) => sum + parseFloat(t.amount), 0) : 0;

  const getMarketStatus = (market: Market) => {
    if (market.status === "active") {
      return { label: "Active", color: "bg-blue-100 text-blue-800" };
    } else if (market.status === "settled") {
      if (market.settlement === "refund") {
        return { label: "Refunded", color: "bg-gray-100 text-gray-800" };
      } else if (
        (market.settlement === "creator_wins" && market.creatorId === publicKey) ||
        (market.settlement === "counterparty_wins" && market.counterpartyId === publicKey)
      ) {
        return { label: "Won", color: "bg-green-100 text-green-800" };
      } else {
        return { label: "Lost", color: "bg-red-100 text-red-800" };
      }
    }
    return { label: "Unknown", color: "bg-gray-100 text-gray-800" };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400">Track your performance and manage your positions</p>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl px-4 py-2 shadow-sm border">
                <div className="text-xs text-gray-500 dark:text-gray-400">Connected Wallet</div>
                <div className="font-mono text-sm text-gray-900 dark:text-white">
                  {publicKey ? `${publicKey.slice(0, 8)}...${publicKey.slice(-4)}` : "Not Connected"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                <div className="w-6 h-6 text-green-600 dark:text-green-400">🏆</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {decidedMarkets.length > 0 ? `${winRate}%` : "—"}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {decidedMarkets.length > 0 ? `${wins.length}W/${losses.length}L` : "No games"}
                </div>
              </div>
            </div>
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Win Rate</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${totalProfit >= 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                <div className={`w-6 h-6 ${totalProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {totalProfit >= 0 ? '📈' : '📉'}
                </div>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {totalProfit >= 0 ? '+' : ''}{totalProfit.toFixed(4)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">SOL</div>
              </div>
            </div>
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Profit</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <div className="w-6 h-6 text-blue-600 dark:text-blue-400">⏱️</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{activeMarkets.length}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Active</div>
              </div>
            </div>
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Live Positions</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                <div className="w-6 h-6 text-purple-600 dark:text-purple-400">📊</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{completedMarkets.length}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Total</div>
              </div>
            </div>
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Markets Played</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* My Markets */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">My Positions</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Markets you've created or joined</p>
              </div>
              <div className="p-6">
                {marketsLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl animate-pulse">
                        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded mb-2"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : userMarkets.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <div className="text-gray-400 text-xl">📈</div>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">No markets yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userMarkets.map((market: Market) => {
                      const status = getMarketStatus(market);
                      return (
                        <div key={market.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 hover:shadow-sm transition-shadow">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-gray-900 dark:text-white">{market.title}</h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                              {status.label}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{market.description}</p>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500 dark:text-gray-400">Stake: {market.stakeAmount} SOL</span>
                            <span className="text-gray-500 dark:text-gray-400">
                              {market.status === "settled" && market.settledAt 
                                ? `Settled ${new Date(market.settledAt).toLocaleDateString()}`
                                : `Expires ${new Date(market.expiryDate).toLocaleDateString()}`}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Wallet Info Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Wallet Info</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Address</span>
                  <span className="text-sm font-mono text-gray-900 dark:text-white">
                    {publicKey?.slice(0, 8)}...{publicKey?.slice(-4)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Network</span>
                  <span className="text-sm text-green-600 dark:text-green-400">Mainnet</span>
                </div>
              </div>
            </div>
            
            {/* Recent Transactions */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Transactions</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Your latest activity</p>
              </div>
              <div className="p-6">
                {transactionsLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl animate-pulse">
                        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded mb-2"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : !Array.isArray(transactions) || transactions.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <div className="text-gray-400 text-xl">📊</div>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">No transactions yet</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {(transactions as Transaction[]).slice(0, 10).map((transaction: Transaction) => (
                      <div key={transaction.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                            {transaction.type}
                          </span>
                          <span className={`text-sm font-semibold ${
                            transaction.type === "payout" || transaction.type === "refund" 
                              ? "text-green-600 dark:text-green-400" 
                              : "text-red-600 dark:text-red-400"
                          }`}>
                            {transaction.type === "payout" || transaction.type === "refund" ? "+" : "-"}
                            {parseFloat(transaction.amount).toFixed(4)} SOL
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{transaction.description}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {transaction.createdAt ? new Date(String(transaction.createdAt)).toLocaleString() : 'N/A'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}