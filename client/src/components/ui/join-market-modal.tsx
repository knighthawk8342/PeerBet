import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useSolanaWallet } from "@/hooks/useSolanaWallet";
import type { Market } from "@shared/schema";

interface JoinMarketModalProps {
  market: Market | null;
  isOpen: boolean;
  onClose: () => void;
}

export function JoinMarketModal({ market, isOpen, onClose }: JoinMarketModalProps) {
  const { toast } = useToast();
  const { publicKey, connected } = useSolanaWallet();

  const joinMutation = useMutation({
    mutationFn: async () => {
      if (!market) throw new Error("No market selected");
      if (!connected || !publicKey) throw new Error("Wallet not connected");
      
      // apiRequest automatically adds wallet public key header
      await apiRequest("POST", `/api/markets/${market.id}/join`, {});
    },
    onSuccess: () => {
      toast({
        title: "Market Joined",
        description: "You have successfully joined the market!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/markets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/markets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      onClose();
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
        description: error.message || "Failed to join market",
        variant: "destructive",
      });
    },
  });

  if (!market) return null;

  const stakeAmount = parseFloat(market.stakeAmount);
  const platformFee = stakeAmount * 2 * 0.02;
  const potentialWin = stakeAmount * 2 - platformFee;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Join Market</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2 line-clamp-3">{market.title}</h4>
            <p className="text-sm text-gray-600">
              Created by <span className="font-medium">@{market.creatorId.slice(0, 8)}...</span>
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Required stake:</span>
              <span className="font-semibold">{stakeAmount.toFixed(3)} SOL</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Platform fee (2%):</span>
              <span className="font-medium">{platformFee.toFixed(3)} SOL</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-gray-900 font-medium">If you win:</span>
              <span className="font-semibold text-green-600">{potentialWin.toFixed(3)} SOL</span>
            </div>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              <i className="fas fa-exclamation-triangle mr-1"></i>
              By joining this market, you agree that bets are final once placed and subject to admin settlement.
            </p>
          </div>
          
          <div className="flex space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => joinMutation.mutate()}
              disabled={joinMutation.isPending}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              {joinMutation.isPending ? "Joining..." : "Confirm Join"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
