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

      console.log(`Initiating ${amount} SOL transfer from ${publicKey} to ${TREASURY_WALLET}`);

      // Create SOL transfer transaction
      console.log("Creating SOL transfer transaction...");
      
      const lamports = Math.floor(parseFloat(amount) * 1_000_000_000);
      
      const { PublicKey, Transaction, SystemProgram, Connection } = await import('@solana/web3.js');
      
      // Use devnet for testing - it's more reliable in this environment
      const connection = new Connection("https://api.devnet.solana.com");
      
      const fromPubkey = new PublicKey(publicKey);
      const toPubkey = new PublicKey(TREASURY_WALLET);
      
      const transferInstruction = SystemProgram.transfer({
        fromPubkey,
        toPubkey,
        lamports,
      });
      
      const transaction = new Transaction().add(transferInstruction);
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = fromPubkey;
      
      console.log("Requesting Phantom to sign transaction...");
      
      // Sign transaction with Phantom
      const signedTransaction = await window.solana.signTransaction(transaction);
      
      console.log("Transaction signed, sending to network...");
      
      // Send the signed transaction
      const signature = await connection.sendRawTransaction(signedTransaction.serialize());
      
      console.log("Transaction sent, waiting for confirmation...");
      
      // Wait for confirmation
      await connection.confirmTransaction(signature, 'confirmed');
      
      if (signature) {
        console.log("Payment successful:", signature);
        
        toast({
          title: "Payment Successful",
          description: `Successfully sent ${amount} SOL`,
        });

        if (onPaymentComplete) {
          onPaymentComplete(signature);
        }
        
        onClose();
      } else {
        throw new Error("Transaction was not completed");
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