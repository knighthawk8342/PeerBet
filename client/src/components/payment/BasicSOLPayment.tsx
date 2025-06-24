import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useSolanaWallet } from "@/hooks/useSolanaWallet";

interface BasicSOLPaymentProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentComplete?: (signature: string) => void;
  amount: string;
  marketTitle: string;
  action: "create" | "join";
}

const TREASURY_WALLET = "5rkj4b1ksrt2GgKWm3xJWVNgunYCEbc4oyJohcz1bJdt";

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

      console.log("Starting basic SOL payment...");
      console.log("From:", publicKey);
      console.log("To:", TREASURY_WALLET);
      console.log("Amount:", amount, "SOL");

      // Use standard Web3.js approach with proper connection
      const { PublicKey, Transaction, SystemProgram, Connection } = await import('@solana/web3.js');
      
      // Use Helius free RPC which is more reliable
      const connection = new Connection("https://rpc.helius.xyz/?api-key=b8bb41c6-3d8e-4b77-9bb7-2c3a5d6e2f4a", 'confirmed');
      
      const fromPubkey = new PublicKey(publicKey);
      const toPubkey = new PublicKey(TREASURY_WALLET);
      const lamports = Math.floor(parseFloat(amount) * 1_000_000_000);

      // Create transfer instruction
      const transferInstruction = SystemProgram.transfer({
        fromPubkey,
        toPubkey,
        lamports,
      });

      // Create transaction
      const transaction = new Transaction().add(transferInstruction);
      
      // Get recent blockhash with timeout
      console.log("Fetching recent blockhash...");
      const { blockhash, lastValidBlockHeight } = await Promise.race([
        connection.getLatestBlockhash('finalized'),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Blockhash fetch timeout')), 10000)
        )
      ]);
      
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = fromPubkey;

      console.log("Requesting Phantom to sign and send transaction...");
      
      // Use signAndSendTransaction for better reliability
      const signature = await window.solana.signAndSendTransaction(transaction);
      
      if (signature) {
        console.log("Transaction sent with signature:", signature);
        
        // Wait for confirmation
        try {
          await connection.confirmTransaction({
            signature,
            blockhash,
            lastValidBlockHeight
          });
          console.log("Transaction confirmed");
        } catch (confirmError) {
          console.log("Confirmation failed but transaction was sent:", confirmError);
        }
        
        toast({
          title: "Payment Successful",
          description: `Successfully sent ${amount} SOL`,
        });

        if (onPaymentComplete) {
          onPaymentComplete(signature);
        }
        
        onClose();
      } else {
        throw new Error("Transaction failed");
      }

    } catch (error: any) {
      console.error("Payment error:", error);
      
      if (error.code === 4001 || error.message?.includes("rejected")) {
        toast({
          title: "Payment Cancelled",
          description: "You cancelled the transaction",
        });
      } else if (error.message?.includes("blockhash") || error.message?.includes("fetch")) {
        toast({
          title: "Network Error",
          description: "Solana network connection issue. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Payment Failed",
          description: error.message || "Could not process payment",
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
            <div className="text-lg font-semibold text-blue-900 dark:text-blue-100">
              {action === "create" ? "Creating Market" : "Joining Market"}
            </div>
            <div className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              {marketTitle}
            </div>
            <div className="text-lg font-bold text-blue-900 dark:text-blue-100 mt-2">
              Amount Required: {amount} SOL
            </div>
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-400">
            Click "Pay with Phantom" to approve this SOL transfer.
          </div>

          <div className="flex gap-3">
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