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

      // Let Phantom handle EVERYTHING - no RPC calls from our side
      console.log("Creating transaction for Phantom to handle...");
      
      const { PublicKey, Transaction, SystemProgram } = await import('@solana/web3.js');
      
      const fromPubkey = new PublicKey(publicKey);
      const toPubkey = new PublicKey(TREASURY_WALLET);
      const lamports = Math.floor(parseFloat(amount) * 1_000_000_000);

      // Create minimal transaction - let Phantom fill in all the details
      const transferInstruction = SystemProgram.transfer({
        fromPubkey,
        toPubkey,
        lamports,
      });
      
      const transaction = new Transaction().add(transferInstruction);
      
      console.log("Requesting Phantom to sign and send transaction...");
      
      // Use Phantom's signAndSendTransaction - it handles EVERYTHING internally
      const result = await window.solana.signAndSendTransaction(transaction);
      const signature = typeof result === 'string' ? result : result.signature;
      
      console.log("Transaction completed with signature:", signature);
      
      // Short wait for network propagation
      await new Promise(resolve => setTimeout(resolve, 1000));

      onPaymentComplete?.(signature);
      onClose();

      toast({
        title: "Payment Successful",
        description: `${amount} SOL sent successfully for ${action === "create" ? "creating" : "joining"} "${marketTitle}"`,
      });

    } catch (error) {
      console.error("Payment error:", error);
      
      let errorMessage = "Payment failed. Please try again.";
      if (error instanceof Error) {
        if (error.message.includes("User rejected")) {
          errorMessage = "Transaction cancelled by user";
        } else if (error.message.includes("insufficient")) {
          errorMessage = "Insufficient SOL balance";
        } else if (error.message.includes("Network")) {
          errorMessage = "Network error. Please check your connection.";
        } else {
          errorMessage = error.message;
        }
      }

      toast({
        title: "Payment Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {action === "create" ? "Create Market Payment" : "Join Market Payment"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Payment Details</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Market:</span>
                <span className="font-medium">{marketTitle}</span>
              </div>
              <div className="flex justify-between">
                <span>Amount:</span>
                <span className="font-medium">{amount} SOL</span>
              </div>
              <div className="flex justify-between">
                <span>Action:</span>
                <span className="font-medium capitalize">{action} Market</span>
              </div>
            </div>
          </div>

          {!connected ? (
            <div className="text-center text-muted-foreground">
              Please connect your wallet to continue
            </div>
          ) : (
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                {amount} SOL will be sent from your wallet to complete this transaction
              </p>
              
              <Button 
                onClick={handlePayment} 
                disabled={isProcessing || !connected}
                className="w-full"
                size="lg"
              >
                {isProcessing ? "Processing..." : `Pay ${amount} SOL`}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}