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

      console.log(`Processing ${amount} SOL payment...`);
      
      try {
        // Try Phantom's native transfer first
        const result = await window.solana.request({
          method: "sol_requestTransaction",
          params: {
            to: TREASURY_WALLET,
            lamports: Math.floor(parseFloat(amount) * 1_000_000_000)
          }
        });
        
        if (result?.signature) {
          console.log("SOL transfer successful:", result.signature);
          toast({
            title: "Payment Successful",
            description: `${amount} SOL transferred successfully`,
          });
          
          if (onPaymentComplete) {
            onPaymentComplete(result.signature);
          }
          onClose();
          return;
        }
      } catch (error) {
        console.log("Phantom direct transfer failed, trying manual transaction...");
      }
      
      try {
        // Manual transaction creation
        const { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } = await import('@solana/web3.js');
        
        const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
        
        const fromPubkey = new PublicKey(publicKey);
        const toPubkey = new PublicKey(TREASURY_WALLET);
        const lamports = Math.floor(parseFloat(amount) * LAMPORTS_PER_SOL);
        
        const transferInstruction = SystemProgram.transfer({
          fromPubkey,
          toPubkey,
          lamports,
        });
        
        const transaction = new Transaction().add(transferInstruction);
        
        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = fromPubkey;
        
        const signedTransaction = await window.solana.signTransaction(transaction);
        const signature = await connection.sendRawTransaction(signedTransaction.serialize());
        
        await connection.confirmTransaction(signature);
        
        console.log("SOL transfer confirmed:", signature);
        toast({
          title: "Payment Successful", 
          description: `${amount} SOL transferred successfully`,
        });
        
        if (onPaymentComplete) {
          onPaymentComplete(signature);
        }
        onClose();
        
      } catch (error) {
        console.error("SOL transfer failed:", error);
        toast({
          title: "Transfer Failed",
          description: "Unable to process SOL transfer. Please try again.",
          variant: "destructive",
        });
        onClose();
      }

    } catch (error: any) {
      console.error("Payment error:", error);
      
      if (error.code === 4001 || error.message?.includes("rejected")) {
        toast({
          title: "Payment Cancelled",
          description: "You cancelled the transaction",
        });
      } else if (error.message?.includes("insufficient lamports") || error.transactionMessage?.includes("insufficient lamports")) {
        toast({
          title: "Insufficient Balance",
          description: "Your wallet doesn't have enough SOL for this transaction. Please add more SOL to your wallet.",
          variant: "destructive",
        });
      } else if (error.message?.includes("blockhash") || error.message?.includes("fetch")) {
        toast({
          title: "Network Error",
          description: "Solana network connection issue. Please try again.",
          variant: "destructive",
        });
      } else if (error.transactionMessage?.includes("Transaction simulation failed")) {
        toast({
          title: "Transaction Failed",
          description: "Transaction simulation failed. Please check your wallet balance and try again.",
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