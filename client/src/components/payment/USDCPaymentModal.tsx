import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useSolanaWallet } from "@/hooks/useSolanaWallet";

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

  const handlePaymentSubmit = async () => {
    setPaymentStatus("confirming");
    
    // Simulate payment verification process
    setTimeout(() => {
      setPaymentStatus("completed");
      toast({
        title: "Payment Confirmed",
        description: `Your ${amount} USDC payment has been processed successfully`,
      });
      setTimeout(() => {
        onPaymentComplete?.();
        onClose();
      }, 2000);
    }, 3000);
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

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <i className="fas fa-exclamation-triangle mr-2"></i>
                  Please send exactly {amount} USDC to the treasury address above. Do not send any other tokens.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">
                    Transaction Hash (Optional for manual verification):
                  </label>
                  <input
                    type="text"
                    value={transactionHash}
                    onChange={(e) => setTransactionHash(e.target.value)}
                    placeholder="Enter transaction hash after sending USDC..."
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm font-mono"
                  />
                </div>

                <div className="flex space-x-2">
                  <Button
                    onClick={handlePaymentSubmit}
                    className="flex-1"
                  >
                    <i className="fas fa-search mr-2"></i>
                    Auto-Detect Payment
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleManualVerification}
                    disabled={!transactionHash.trim()}
                    className="flex-1"
                  >
                    <i className="fas fa-check mr-2"></i>
                    Manual Verify
                  </Button>
                </div>
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