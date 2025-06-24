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

      // Import Solana web3 components dynamically to avoid Buffer issues
      const solanaWeb3 = await import('@solana/web3.js');
      const { PublicKey, Transaction, SystemProgram, Connection } = solanaWeb3;
      
      // Use QuickNode free mainnet RPC
      const connection = new Connection("https://api.mainnet-beta.solana.com", {
        commitment: 'confirmed',
        confirmTransactionInitialTimeout: 60000,
      });
      
      const fromPubkey = new PublicKey(publicKey);
      const toPubkey = new PublicKey(TREASURY_WALLET);
      const lamports = Math.floor(parseFloat(amount) * 1_000_000_000);

      // Create transfer instruction
      const transferInstruction = SystemProgram.transfer({
        fromPubkey,
        toPubkey,
        lamports,
      });

      // Create transaction and get recent blockhash with retry logic
      const transaction = new Transaction().add(transferInstruction);
      
      let retries = 3;
      let blockhash;
      
      while (retries > 0) {
        try {
          const blockHashInfo = await connection.getLatestBlockhash('confirmed');
          blockhash = blockHashInfo.blockhash;
          transaction.recentBlockhash = blockhash;
          transaction.feePayer = fromPubkey;
          break;
        } catch (blockError) {
          console.error(`Failed to get blockhash (attempt ${4 - retries}):`, blockError);
          retries--;
          if (retries === 0) {
            throw new Error("Unable to connect to Solana network. Please check your internet connection and try again.");
          }
          // Wait 1 second before retry
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      console.log("Requesting Phantom signature...");
      
      // Sign transaction with Phantom
      const signedTransaction = await window.solana.signTransaction(transaction);
      console.log("Transaction signed successfully");

      // Send transaction
      const signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
        maxRetries: 3,
        skipPreflight: false,
      });
      
      console.log("Transaction sent with signature:", signature);

      // Wait for confirmation
      const confirmation = await connection.confirmTransaction(signature, 'confirmed');
      console.log("Transaction confirmed:", confirmation);

      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${confirmation.value.err}`);
      }

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