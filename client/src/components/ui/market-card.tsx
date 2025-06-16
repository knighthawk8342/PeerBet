import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import type { Market } from "@shared/schema";

interface MarketCardProps {
  market: Market;
  onJoin: (market: Market) => void;
}

export function MarketCard({ market, onJoin }: MarketCardProps) {
  const { user } = useAuth();
  
  const getStatusBadge = () => {
    switch (market.status) {
      case "open":
        return <Badge className="bg-green-100 text-green-800">Open</Badge>;
      case "active":
        return <Badge className="bg-orange-100 text-orange-800">Active</Badge>;
      case "settled":
        if (market.settlement === "refund") {
          return <Badge className="bg-gray-100 text-gray-800">Refunded</Badge>;
        }
        const isWinner = (market.settlement === "creator_wins" && market.creatorId === user?.id) ||
                        (market.settlement === "counterparty_wins" && market.counterpartyId === user?.id);
        return (
          <Badge className={isWinner ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
            {isWinner ? "Won" : "Lost"}
          </Badge>
        );
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  const getActionButton = () => {
    if (market.status === "open" && market.creatorId !== user?.id) {
      return (
        <Button 
          className="w-full bg-primary hover:bg-primary/90"
          onClick={() => onJoin(market)}
        >
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
    
    if (market.creatorId === user?.id) {
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
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
              {market.title}
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Created by <span className="font-medium">@{market.creatorId.slice(0, 8)}...</span>
              {market.counterpartyId && (
                <> • Joined by <span className="font-medium">@{market.counterpartyId.slice(0, 8)}...</span></>
              )}
            </p>
          </div>
          {getStatusBadge()}
        </div>
        
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-500">Stake Amount</div>
          <div className="text-lg font-bold text-gray-900">${stakeAmount.toFixed(2)}</div>
        </div>
        
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-500">
            {market.status === "settled" ? "Final Pool" : "Potential Payout"}
          </div>
          <div className="text-lg font-semibold text-green-600">
            ${potentialPayout.toFixed(2)}
          </div>
        </div>
        
        <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
          <span>Created {new Date(market.createdAt).toLocaleDateString()}</span>
          <span className="capitalize">{market.category}</span>
        </div>
        
        {getActionButton()}
      </div>
    </div>
  );
}
