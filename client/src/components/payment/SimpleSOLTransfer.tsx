import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useSolanaWallet } from "@/hooks/useSolanaWallet";

interface SimpleSOLTransferProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentComplete?: (signature: string) => void;
  amount: string;
  marketTitle: string;
  action: "create" | "join";
}

const TREASURY_WALLET = "5rkj4b1ksrt2GgKWm3xJWVNgunYCEbc4oyJohcz1bJdt";

export function SimpleSOLTransfer({ 
  isOpen, 
  onClose, 
  onPaymentComplete, 
  amount, 
  marketTitle, 
  action 
}: SimpleSOLTransferProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { publicKey, connected } = useSolanaWallet();
  const { toast } = useToast();

  const handlePayment = async () => {
    if (!publicKey || !connected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      console.log("Requesting SOL transfer via Phantom...");
      
      // Try multiple methods to send SOL transaction
      let signature = null;
      
      // Method 1: Use standard transaction signing (most reliable)
      const { Transaction, SystemProgram, PublicKey, LAMPORTS_PER_SOL } = await import('@solana/web3.js');
      
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: new PublicKey(publicKey),
          toPubkey: new PublicKey(TREASURY_WALLET),
          lamports: Math.floor(parseFloat(amount) * LAMPORTS_PER_SOL),
        })
      );

      // Use Phantom's signAndSendTransaction which handles everything
      if (window.solana.signAndSendTransaction) {
        const result = await window.solana.signAndSendTransaction(transaction);
        signature = result.signature || result;
      } else {
        throw new Error("Phantom wallet does not support required transaction methods");
      }

      if (!signature) {
        throw new Error("Failed to get transaction signature");
      }

      console.log("SOL transfer successful:", signature);
      
      toast({
        title: "Payment Successful",
        description: `Successfully sent ${amount} SOL`,
      });
      
      onPaymentComplete?.(signature);
      onClose();
      
    } catch (error: any) {
      console.error("Transfer error:", error);
      
      if (error.code === 4001) {
        toast({
          title: "Payment Cancelled",
          description: "You cancelled the transaction",
        });
      } else {
        toast({
          title: "Payment Failed",
          description: "SOL transfer failed. Please try again or check your wallet connection.",
          variant: "destructive",
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>SOL Payment Required</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100">
              {action === "create" ? "Creating Market" : "Joining Market"}
            </h3>
            <p className="text-blue-700 dark:text-blue-300">{marketTitle}</p>
            <p className="text-lg font-bold text-blue-900 dark:text-blue-100 mt-2">
              Amount Required: {amount} SOL
            </p>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Click "Pay with Phantom" to approve this SOL transfer.
          </p>
          
          <div className="flex gap-2 pt-4">
            <Button 
              onClick={handlePayment}
              disabled={isProcessing || !connected}
              className="flex-1"
            >
              {isProcessing ? "Processing..." : "Pay with Phantom"}
            </Button>
            <Button 
              variant="outline" 
              onClick={onClose}
              disabled={isProcessing}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}