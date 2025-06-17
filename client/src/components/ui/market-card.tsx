import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSolanaWallet } from "@/hooks/useSolanaWallet";
import type { Market } from "@shared/schema";

interface MarketCardProps {
  market: Market;
  onJoin: (market: Market) => void;
}

export function MarketCard({ market, onJoin }: MarketCardProps) {
  const { publicKey } = useSolanaWallet();
  
  const getStatusBadge = () => {
    switch (market.status) {
      case "open":
        return <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">📊 Open</Badge>;
      case "active":
        return <Badge className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800">⚡ Active</Badge>;
      case "settled":
        if (market.settlement === "refund") {
          return <Badge className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600">🔄 Refunded</Badge>;
        }
        const isWinner = (market.settlement === "creator_wins" && market.creatorId === publicKey) ||
                        (market.settlement === "counterparty_wins" && market.counterpartyId === publicKey);
        return (
          <Badge className={isWinner ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800" : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"}>
            {isWinner ? "🏆 Won" : "💔 Lost"}
          </Badge>
        );
      default:
        return <Badge className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600">❓ Unknown</Badge>;
    }
  };

  const getActionButton = () => {
    if (market.status === "open" && market.creatorId !== publicKey) {
      return (
        <Button 
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-sm hover:shadow-md transition-all duration-200"
          onClick={() => onJoin(market)}
        >
          <span className="mr-2">⚡</span>
          Join Market
        </Button>
      );
    }
    
    if (market.status === "active") {
      return (
        <Button variant="outline" className="w-full" disabled>
          Market Active
        </Button>
      );
    }
    
    if (market.status === "settled") {
      return (
        <Button variant="outline" className="w-full" disabled>
          Market Settled
        </Button>
      );
    }
    
    if (market.creatorId === publicKey) {
      return (
        <Button variant="outline" className="w-full" disabled>
          Your Market
        </Button>
      );
    }

    return (
      <Button variant="outline" className="w-full" disabled>
        Unavailable
      </Button>
    );
  };

  const stakeAmount = parseFloat(market.stakeAmount);
  const potentialPayout = market.status === "settled" 
    ? stakeAmount * 2 - (stakeAmount * 2 * 0.02)
    : stakeAmount * 2 - (stakeAmount * 2 * 0.02);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 group">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {market.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Created by <span className="font-medium text-gray-700 dark:text-gray-300">@{market.creatorId.slice(0, 8)}...</span>
              {market.counterpartyId && (
                <> • Joined by <span className="font-medium text-gray-700 dark:text-gray-300">@{market.counterpartyId.slice(0, 8)}...</span></>
              )}
            </p>
          </div>
          {getStatusBadge()}
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <span className="mr-2">💰</span>
              Stake Amount
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">{stakeAmount.toFixed(3)} SOL</div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <span className="mr-2">🎯</span>
              {market.status === "settled" ? "Final Pool" : "Potential Payout"}
            </div>
            <div className="text-lg font-semibold text-green-600 dark:text-green-400">
              {potentialPayout.toFixed(3)} SOL
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Created</span>
            <span className="text-gray-700 dark:text-gray-300">{market.createdAt ? new Date(market.createdAt).toLocaleDateString() : 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Category</span>
            <span className="text-gray-700 dark:text-gray-300 capitalize">{market.category}</span>
          </div>
        </div>
        
        {getActionButton()}
      </div>
    </div>
  );
}
