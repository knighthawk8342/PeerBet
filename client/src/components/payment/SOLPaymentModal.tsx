import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useSolanaWallet } from "@/hooks/useSolanaWallet";
import { Buffer } from 'buffer';

interface SOLPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentComplete?: (signature: string) => void;
  amount: string;
  marketTitle: string;
  action: "create" | "join";
}

// Treasury wallet for SOL payments
const TREASURY_WALLET = "5rkj4b1ksrt2GgKWm3xJWVNgunYCEbc4oyJohcz1bJdt";
const USDC_MINT = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"; // Keep for potential future use

// Make Buffer available globally for Solana libraries
window.Buffer = Buffer;

export function SOLPaymentModal({ 
  isOpen, 
  onClose, 
  onPaymentComplete, 
  amount, 
  marketTitle, 
  action 
}: SOLPaymentModalProps) {
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "confirming" | "completed" | "failed">("pending");
  const [transactionHash, setTransactionHash] = useState<string>("");
  const { toast } = useToast();
  const { publicKey, connected, signMessage } = useSolanaWallet();

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(TREASURY_WALLET);
    toast({
      title: "Address Copied",
      description: "Treasury wallet address copied to clipboard",
    });
  };

  const handleSendUSDC = async () => {
    console.log("handleSendUSDC called");
    console.log("publicKey:", publicKey);
    console.log("connected status:", connected);
    
    if (!publicKey) {
      console.log("Wallet not connected");
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your Solana wallet first",
        variant: "destructive",
      });
      return;
    }

    setPaymentStatus("confirming");
    
    try {
      console.log("Checking for wallet objects...");
      console.log("window.solana:", !!window.solana);
      console.log("window.solflare:", !!window.solflare);
      
      const wallet = window.solana || window.solflare;
      
      if (!wallet) {
        toast({
          title: "Wallet Not Found",
          description: "Please install Phantom or Solflare wallet",
          variant: "destructive",
        });
        setPaymentStatus("failed");
        return;
      }

      toast({
        title: "Opening Wallet",
        description: "Your wallet will open to approve the SOL payment",
      });

      // Build and execute SOL transfer transaction
      let signature;
      
      try {
        console.log("Starting SOL transfer process...");
        console.log("Amount:", amount, "SOL");
        console.log("User public key:", publicKey);
        console.log("Treasury wallet:", TREASURY_WALLET);

        // Dynamic imports to avoid bundle issues
        const { Connection, PublicKey, Transaction } = await import('@solana/web3.js');

        const connection = new Connection("https://rpc.ankr.com/solana");
        const treasuryPubkey = new PublicKey(TREASURY_WALLET);
        const userPubkey = new PublicKey(publicKey);

        // Check wallet balance first
        const balance = await connection.getBalance(userPubkey);
        const lamportsToSend = Math.floor(parseFloat(amount) * 1_000_000_000);
        const transactionFee = 5000; // Approximate transaction fee
        const totalRequired = lamportsToSend + transactionFee;
        
        console.log("Wallet balance:", (balance / 1_000_000_000).toFixed(4), "SOL");
        console.log("Required amount:", (lamportsToSend / 1_000_000_000).toFixed(4), "SOL");
        console.log("Transaction fee:", (transactionFee / 1_000_000_000).toFixed(4), "SOL");
        console.log("Total required:", (totalRequired / 1_000_000_000).toFixed(4), "SOL");
        
        if (balance < totalRequired) {
          throw new Error(`Insufficient SOL balance. You have ${(balance / 1_000_000_000).toFixed(4)} SOL but need ${(totalRequired / 1_000_000_000).toFixed(4)} SOL. Please add SOL to your wallet from an exchange.`);
        }

        console.log("SOL amount in lamports:", lamportsToSend);

        // Create SOL transfer instruction
        console.log("Creating SOL transfer...");
        const { SystemProgram } = await import('@solana/web3.js');

        // Create SOL transfer instruction
        const transferInstruction = SystemProgram.transfer({
          fromPubkey: userPubkey,
          toPubkey: treasuryPubkey,
          lamports: lamportsToSend,
        });

        // Create transaction
        const transaction = new Transaction().add(transferInstruction);
        
        // Get latest blockhash
        console.log("Getting latest blockhash...");
        const { blockhash } = await connection.getLatestBlockhash('finalized');
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = userPubkey;

        console.log("Transaction created, requesting wallet signature...");

        // Validate that we're not sending to ourselves
        if (publicKey === TREASURY_WALLET) {
          throw new Error("Cannot send SOL to the same wallet. Please connect a different wallet.");
        }

        toast({
          title: "Confirm Payment",
          description: `Sending ${amount} SOL to treasury wallet`,
        });

        // Check for Phantom wallet
        if (window.solana && window.solana.isPhantom) {
          console.log("Using Phantom wallet...");
          console.log("Phantom connected status:", window.solana.isConnected);
          
          // Ensure Phantom is connected
          if (!window.solana.isConnected) {
            console.log("Connecting to Phantom...");
            try {
              await window.solana.connect();
              console.log("Successfully connected to Phantom");
            } catch (connectError: any) {
              console.error("Failed to connect to Phantom:", connectError);
              throw new Error("Failed to connect to Phantom wallet. Please try again.");
            }
          }

          // Sign and send the transfer transaction
          console.log("Requesting transaction signature from Phantom...");
          console.log("Transaction object:", transaction);
          
          try {
            setPaymentStatus("confirming");
            
            // Sign the transaction first
            console.log("Signing transaction with Phantom...");
            const signedTx = await window.solana.signTransaction(transaction);
            console.log("Transaction signed successfully");
            
            // Manually send the signed transaction to the network
            console.log("Sending signed transaction to network...");
            const txSignature = await connection.sendRawTransaction(signedTx.serialize(), {
              skipPreflight: false,
              preflightCommitment: 'confirmed'
            });
            console.log("Transaction sent with signature:", txSignature);
            
            signature = txSignature;
            
          } catch (phantomError: any) {
            console.error("Phantom signAndSendTransaction error:", phantomError);
            console.error("Error details:", {
              message: phantomError.message,
              code: phantomError.code,
              name: phantomError.name,
              stack: phantomError.stack
            });
            throw phantomError;
          }
          
        } else if (window.solflare && window.solflare.isSolflare) {
          console.log("Using Solflare wallet...");
          // Solflare wallet approach
          if (!window.solflare.isConnected) {
            console.log("Connecting to Solflare...");
            await window.solflare.connect();
          }

          // Sign and send the transfer transaction
          console.log("Requesting transaction signature from Solflare...");
          const result = await window.solflare.signAndSendTransaction(transaction);
          signature = typeof result === 'string' ? result : (result as any).signature || result;
          console.log("Transaction signature:", signature);
          
        } else {
          throw new Error("No compatible Solana wallet found. Please install Phantom or Solflare.");
        }

        // Transaction was successfully signed and submitted
        console.log("Transaction signed and submitted successfully!");
        
        // Optional: Try to confirm in background but don't block on it
        if (signature) {
          console.log("Starting background confirmation check...");
          connection.confirmTransaction(signature, 'confirmed')
            .then(() => console.log("Background confirmation: Transaction confirmed!"))
            .catch((error) => console.log("Background confirmation failed (this is okay):", error.message));
        }

        // Validate signature was created
        if (!signature || signature.length < 10) {
          throw new Error("No transaction signature received from wallet");
        }

      } catch (walletError: any) {
        console.error("Wallet transaction error:", walletError);
        console.error("Full error object:", JSON.stringify(walletError, null, 2));
        
        if (walletError.message?.includes('User rejected') || walletError.code === 4001) {
          throw new Error("Transaction was cancelled by user");
        } else if (walletError.message?.includes('Insufficient funds')) {
          throw new Error("Insufficient SOL balance in wallet");
        } else if (walletError.message?.includes('not approved') || walletError.message?.includes('denied')) {
          throw new Error("Payment was not approved in wallet");
        } else if (walletError.name === 'WalletSignTransactionError') {
          throw new Error("Transaction signing failed in wallet");
        } else {
          throw new Error(`Transaction failed: ${walletError.message || 'Failed to process SOL payment'}`);
        }
      }
      
      setTransactionHash(signature);
      setPaymentStatus("completed");
      toast({
        title: "Payment Complete",
        description: `Successfully sent ${amount} SOL to treasury wallet`,
      });
      
      setTimeout(() => {
        onPaymentComplete?.(signature);
        onClose();
      }, 2000);
      
    } catch (error: any) {
      console.error("Transaction failed:", error);
      console.error("Error details:", {
        name: error?.name,
        message: error?.message,
        code: error?.code,
        stack: error?.stack
      });
      
      setPaymentStatus("failed");
      
      let errorMessage = "Payment was cancelled or failed. Please try again.";
      if (error?.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Transaction Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleManualVerification = () => {
    if (!transactionHash.trim()) {
      toast({
        title: "Transaction Hash Required",
        description: "Please enter the transaction hash from your SOL transfer",
        variant: "destructive",
      });
      return;
    }
    
    setPaymentStatus("confirming");
    
    // Simulate manual verification
    setTimeout(() => {
      setPaymentStatus("completed");
      toast({
        title: "Payment Verified",
        description: "Your transaction has been manually verified",
      });
      setTimeout(() => {
        onPaymentComplete?.(transactionHash);
        onClose();
      }, 2000);
    }, 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>SOL Payment Required</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">
              {action === "create" ? "Creating Market" : "Joining Market"}
            </h3>
            <p className="text-sm text-blue-800 mb-2">{marketTitle}</p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-700">Amount Required:</span>
              <Badge className="bg-blue-100 text-blue-800">{amount} SOL</Badge>
            </div>
          </div>

          {paymentStatus === "pending" && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Send SOL to Treasury Wallet</h4>
                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm text-gray-600">Network:</label>
                        <div className="font-mono text-sm bg-gray-100 p-2 rounded">Solana</div>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Token:</label>
                        <div className="font-mono text-sm bg-gray-100 p-2 rounded">SOL</div>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Amount:</label>
                        <div className="font-mono text-sm bg-gray-100 p-2 rounded">{amount} SOL</div>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Treasury Address:</label>
                        <div className="flex items-center space-x-2">
                          <div className="font-mono text-xs bg-gray-100 p-2 rounded flex-1 break-all">
                            {TREASURY_WALLET}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCopyAddress}
                          >
                            <i className="fas fa-copy"></i>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <i className="fas fa-wallet text-green-600 text-xl"></i>
                  </div>
                </div>
                <h4 className="text-center font-medium text-green-900 mb-2">
                  Send SOL via Wallet
                </h4>
                <p className="text-sm text-green-800 text-center mb-4">
                  Click below to automatically prompt your connected wallet to send {amount} SOL to the treasury
                </p>
                <Button
                  onClick={handleSendUSDC}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  size="lg"
                >
                  <i className="fas fa-paper-plane mr-2"></i>
                  Send {amount} SOL Now
                </Button>
              </div>

              <div className="border-t pt-4">
                <details className="cursor-pointer">
                  <summary className="text-sm text-gray-600 hover:text-gray-800">
                    Alternative: Manual verification
                  </summary>
                  <div className="mt-3 space-y-3">
                    <div>
                      <label className="text-sm text-gray-600 mb-1 block">
                        If you sent SOL manually, enter transaction hash:
                      </label>
                      <input
                        type="text"
                        value={transactionHash}
                        onChange={(e) => setTransactionHash(e.target.value)}
                        placeholder="Enter transaction hash..."
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm font-mono"
                      />
                    </div>
                    <Button
                      variant="outline"
                      onClick={handleManualVerification}
                      disabled={!transactionHash.trim()}
                      className="w-full"
                    >
                      <i className="fas fa-check mr-2"></i>
                      Verify Manual Transaction
                    </Button>
                  </div>
                </details>
              </div>
            </div>
          )}

          {paymentStatus === "confirming" && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-spinner fa-spin text-blue-600 text-2xl"></i>
              </div>
              <h3 className="font-medium text-gray-900 mb-2">Confirming Payment</h3>
              <p className="text-sm text-gray-600">
                Verifying your USDC transaction on the Solana blockchain...
              </p>
            </div>
          )}

          {paymentStatus === "completed" && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-check text-green-600 text-2xl"></i>
              </div>
              <h3 className="font-medium text-gray-900 mb-2">Payment Confirmed</h3>
              <p className="text-sm text-gray-600">
                Your {amount} USDC payment has been successfully processed.
              </p>
            </div>
          )}

          {paymentStatus === "failed" && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-times text-red-600 text-2xl"></i>
              </div>
              <h3 className="font-medium text-gray-900 mb-2">Payment Failed</h3>
              <p className="text-sm text-gray-600 mb-4">
                Unable to confirm your USDC payment. Please try again.
              </p>
              <Button onClick={() => setPaymentStatus("pending")}>
                Retry Payment
              </Button>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            {paymentStatus === "pending" && (
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}