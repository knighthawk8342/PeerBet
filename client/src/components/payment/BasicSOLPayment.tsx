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
      
      // Try multiple RPC endpoints for better reliability
      const rpcEndpoints = [
        "https://solana-mainnet.g.alchemy.com/v2/demo",
        "https://api.mainnet-beta.solana.com",
        "https://rpc.ankr.com/solana"
      ];
      
      let connection;
      let workingRpc = null;
      
      // Find a working RPC endpoint
      for (const rpc of rpcEndpoints) {
        try {
          const testConnection = new Connection(rpc, {
            commitment: 'confirmed',
            confirmTransactionInitialTimeout: 30000,
          });
          // Test the connection
          await testConnection.getLatestBlockhash('confirmed');
          connection = testConnection;
          workingRpc = rpc;
          console.log(`Using RPC: ${rpc}`);
          break;
        } catch (rpcError) {
          console.log(`RPC ${rpc} failed, trying next...`);
          continue;
        }
      }
      
      if (!connection || !workingRpc) {
        throw new Error("All Solana RPC endpoints are currently unavailable. Please try again later.");
      }
      
      const fromPubkey = new PublicKey(publicKey);
      const toPubkey = new PublicKey(TREASURY_WALLET);
      const lamports = Math.floor(parseFloat(amount) * 1_000_000_000);

      // Create transfer instruction
      const transferInstruction = SystemProgram.transfer({
        fromPubkey,
        toPubkey,
        lamports,
      });

      // Create transaction and get recent blockhash
      const transaction = new Transaction().add(transferInstruction);
      
      try {
        const blockHashInfo = await connection.getLatestBlockhash('confirmed');
        transaction.recentBlockhash = blockHashInfo.blockhash;
        transaction.feePayer = fromPubkey;
        console.log(`Got blockhash from ${workingRpc}`);
      } catch (blockError) {
        console.error("Failed to get blockhash:", blockError);
        throw new Error("Unable to prepare transaction. Please try again in a few moments.");
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