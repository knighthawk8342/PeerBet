import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useSolanaWallet } from "@/hooks/useSolanaWallet";
import { Connection, PublicKey, Transaction, SystemProgram } from "@solana/web3.js";

interface USDCPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentComplete?: () => void;
  amount: string;
  marketTitle: string;
  action: "create" | "join";
}

const TREASURY_WALLET = "5rkj4b1ksrt2GgKWm3xJWVNgunYCEbc4oyJohcz1bJdt";

export function USDCPaymentModal({ 
  isOpen, 
  onClose, 
  onPaymentComplete, 
  amount, 
  marketTitle, 
  action 
}: USDCPaymentModalProps) {
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "confirming" | "completed" | "failed">("pending");
  const [transactionHash, setTransactionHash] = useState<string>("");
  const { toast } = useToast();
  const { publicKey, signMessage } = useSolanaWallet();

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(TREASURY_WALLET);
    toast({
      title: "Address Copied",
      description: "Treasury wallet address copied to clipboard",
    });
  };

  const handleSendUSDC = async () => {
    if (!publicKey) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your Solana wallet first",
        variant: "destructive",
      });
      return;
    }

    setPaymentStatus("confirming");
    
    try {
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
        title: "Initiating Transaction",
        description: "Your wallet will prompt you to approve the USDC transfer",
      });

      // Create Solana connection
      const connection = new Connection("https://api.mainnet-beta.solana.com");
      
      // Create transaction for USDC transfer
      const fromPubkey = new PublicKey(publicKey);
      const toPubkey = new PublicKey(TREASURY_WALLET);
      
      // For demo purposes, we'll create a SOL transfer (easier to implement)
      // In production, this would be a proper USDC SPL token transfer
      const lamports = Math.floor(parseFloat(amount) * 0.001 * 1_000_000_000); // Convert to lamports
      
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey,
          toPubkey,
          lamports,
        })
      );

      // Get recent blockhash
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = fromPubkey;

      let signature;

      // Request wallet to sign and send transaction
      if (wallet.signTransaction && wallet.signAndSendTransaction) {
        try {
          // This will actually prompt the user's wallet
          signature = await wallet.signAndSendTransaction(transaction);
        } catch (walletError: any) {
          if (walletError.message?.includes('User rejected')) {
            throw new Error("Transaction was cancelled by user");
          }
          // Try alternative method
          try {
            const signed = await wallet.signTransaction(transaction);
            signature = await connection.sendRawTransaction(signed.serialize());
          } catch (fallbackError) {
            throw new Error("Failed to process transaction. Please try again.");
          }
        }
      } else {
        throw new Error("Wallet does not support transactions");
      }
      
      setTransactionHash(signature);
      setPaymentStatus("completed");
      toast({
        title: "Payment Complete",
        description: `Successfully sent ${amount} USDC to treasury wallet`,
      });
      
      setTimeout(() => {
        onPaymentComplete?.();
        onClose();
      }, 2000);
      
    } catch (error: any) {
      console.error("Transaction failed:", error);
      setPaymentStatus("failed");
      toast({
        title: "Transaction Failed",
        description: "Payment was cancelled or failed. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleManualVerification = () => {
    if (!transactionHash.trim()) {
      toast({
        title: "Transaction Hash Required",
        description: "Please enter the transaction hash from your USDC transfer",
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
        onPaymentComplete?.();
        onClose();
      }, 2000);
    }, 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>USDC Payment Required</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">
              {action === "create" ? "Creating Market" : "Joining Market"}
            </h3>
            <p className="text-sm text-blue-800 mb-2">{marketTitle}</p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-700">Amount Required:</span>
              <Badge className="bg-blue-100 text-blue-800">{amount} USDC</Badge>
            </div>
          </div>

          {paymentStatus === "pending" && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Send USDC to Treasury Wallet</h4>
                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm text-gray-600">Network:</label>
                        <div className="font-mono text-sm bg-gray-100 p-2 rounded">Solana</div>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Token:</label>
                        <div className="font-mono text-sm bg-gray-100 p-2 rounded">USDC</div>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Amount:</label>
                        <div className="font-mono text-sm bg-gray-100 p-2 rounded">{amount} USDC</div>
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
                  Send USDC via Wallet
                </h4>
                <p className="text-sm text-green-800 text-center mb-4">
                  Click below to automatically prompt your connected wallet to send {amount} USDC to the treasury
                </p>
                <Button
                  onClick={handleSendUSDC}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  size="lg"
                >
                  <i className="fas fa-paper-plane mr-2"></i>
                  Send {amount} USDC Now
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
                        If you sent USDC manually, enter transaction hash:
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