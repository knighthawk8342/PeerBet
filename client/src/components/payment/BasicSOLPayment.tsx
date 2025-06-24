import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useSolanaWallet } from "@/hooks/useSolanaWallet";
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";

interface BasicSOLPaymentProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentComplete?: (signature: string) => void;
  amount: string;
  marketTitle: string;
  action: "create" | "join";
}

const TREASURY_WALLET = "5rkj4b1ksrt2GgKWm3xJWVNgunYCEbc4oyJohcz1bJdt";

// Use reliable Solana RPC endpoint
const connection = new Connection("https://mainnet.helius-rpc.com/?api-key=public", 'confirmed');

export function BasicSOLPayment({ 
  isOpen, 
  onClose, 
  onPaymentComplete, 
  amount, 
  marketTitle, 
  action 
}: BasicSOLPaymentProps) {
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

    if (publicKey === TREASURY_WALLET) {
      toast({
        title: "Invalid Transaction",
        description: "Cannot send SOL to the same wallet",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      if (!window.solana?.isPhantom) {
        throw new Error("Phantom wallet not found");
      }

      console.log("Starting SOL payment...");
      console.log("From:", publicKey);
      console.log("To:", TREASURY_WALLET);
      console.log("Amount:", amount, "SOL");

      const lamports = Math.floor(parseFloat(amount) * LAMPORTS_PER_SOL);
      
      // Create simple transaction
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: new PublicKey(publicKey),
          toPubkey: new PublicKey(TREASURY_WALLET),
          lamports,
        })
      );

      // Use more compatible transaction method
      let signature;
      
      if (window.solana.signAndSendTransaction) {
        // Method 1: Use signAndSendTransaction if available
        const result = await window.solana.signAndSendTransaction(transaction);
        signature = result.signature || result;
      } else {
        // Method 2: Fallback to sign + send manually
        const signedTransaction = await window.solana.signTransaction(transaction);
        const connection = new Connection("https://mainnet.helius-rpc.com/?api-key=public", 'confirmed');
        signature = await connection.sendRawTransaction(signedTransaction.serialize());
      }
      
      console.log("Transaction successful:", signature);
      
      toast({
        title: "Payment Successful",
        description: `Successfully sent ${amount} SOL`,
      });
      
      onPaymentComplete?.(signature);
      onClose();
      
    } catch (error: any) {
      console.error("Payment error:", error);
      
      if (error.code === 4001 || error.message?.includes("rejected") || error.message?.includes("cancelled")) {
        toast({
          title: "Payment Cancelled",
          description: "You cancelled the transaction",
        });
      } else {
        toast({
          title: "Payment Failed",
          description: error.message || "Unable to process SOL payment. Please try again.",
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