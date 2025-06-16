import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WalletConnectionModal } from "./WalletConnectionModal";
import { useSolanaWallet } from "@/hooks/useSolanaWallet";
import { useToast } from "@/hooks/use-toast";

interface WalletStatusProps {
  showFullCard?: boolean;
  className?: string;
}

export function WalletStatus({ showFullCard = false, className = "" }: WalletStatusProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { connected, connecting, publicKey, disconnect, signMessage } = useSolanaWallet();
  const { toast } = useToast();

  const handleConnect = (publicKey: string) => {
    toast({
      title: "Wallet Connected",
      description: "Your Solana wallet has been successfully connected.",
    });
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      toast({
        title: "Wallet Disconnected",
        description: "Your Solana wallet has been disconnected.",
      });
    } catch (error) {
      toast({
        title: "Disconnect Failed",
        description: "Failed to disconnect wallet. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSignMessage = async () => {
    try {
      const message = `Verify wallet ownership for BetMatch platform at ${new Date().toISOString()}`;
      await signMessage(message);
      toast({
        title: "Message Signed",
        description: "Wallet signature verified successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Signature Failed",
        description: error.message || "Failed to sign message.",
        variant: "destructive",
      });
    }
  };

  if (!showFullCard) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {connected ? (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">
              {publicKey?.slice(0, 6)}...{publicKey?.slice(-4)}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDisconnect}
              className="text-xs px-2 py-1 h-auto"
            >
              Disconnect
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            disabled={connecting}
            className="text-xs"
          >
            <i className="fas fa-wallet mr-1"></i>
            {connecting ? "Connecting..." : "Connect Wallet"}
          </Button>
        )}
        
        <WalletConnectionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onConnect={handleConnect}
        />
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <i className="fas fa-wallet text-primary"></i>
          Solana Wallet
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {connected ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Status:</span>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                Connected
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Address:</span>
              <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                {publicKey?.slice(0, 8)}...{publicKey?.slice(-8)}
              </code>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignMessage}
                className="w-full text-xs"
              >
                <i className="fas fa-signature mr-2"></i>
                Sign Message
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisconnect}
                className="w-full text-xs"
              >
                <i className="fas fa-unlink mr-2"></i>
                Disconnect Wallet
              </Button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-800">
                <i className="fas fa-info-circle mr-1"></i>
                Web3 features and decentralized betting coming soon. Your wallet is ready for future upgrades.
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto">
              <i className="fas fa-wallet text-gray-400 text-2xl"></i>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-1">Connect Your Solana Wallet</h3>
              <p className="text-sm text-gray-600">
                Connect your Solana wallet to enable future web3 features and enhanced security.
              </p>
            </div>

            <Button
              onClick={() => setIsModalOpen(true)}
              disabled={connecting}
              className="w-full"
            >
              <i className="fas fa-wallet mr-2"></i>
              {connecting ? "Connecting..." : "Connect Wallet"}
            </Button>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-xs text-yellow-800">
                <i className="fas fa-exclamation-triangle mr-1"></i>
                Wallet connection is optional. You can use the platform without connecting a wallet.
              </p>
            </div>
          </div>
        )}

        <WalletConnectionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onConnect={handleConnect}
        />
      </CardContent>
    </Card>
  );
}