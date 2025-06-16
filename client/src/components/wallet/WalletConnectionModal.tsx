import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useSolanaWallet } from "@/hooks/useSolanaWallet";

interface WalletConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect?: (publicKey: string) => void;
}

export function WalletConnectionModal({ isOpen, onClose, onConnect }: WalletConnectionModalProps) {
  const { connect, connecting, getAvailableWallets } = useSolanaWallet();
  const { toast } = useToast();
  const [selectedWallet, setSelectedWallet] = useState<'phantom' | 'solflare' | null>(null);

  const handleConnect = async (walletType: 'phantom' | 'solflare') => {
    try {
      const publicKey = await connect(walletType);
      if (publicKey) {
        toast({
          title: "Wallet Connected",
          description: `Successfully connected to ${walletType === 'phantom' ? 'Phantom' : 'Solflare'} wallet`,
        });
        onConnect?.(publicKey);
        onClose();
      }
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect wallet",
        variant: "destructive",
      });
    }
  };

  const availableWallets = getAvailableWallets();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect Solana Wallet</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            Choose a wallet to connect to the platform:
          </div>

          {availableWallets.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-wallet text-gray-400 text-xl"></i>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Wallets Found</h3>
              <p className="text-gray-600 mb-4">
                Please install a Solana wallet extension to continue.
              </p>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  onClick={() => window.open('https://phantom.app/', '_blank')}
                  className="w-full"
                >
                  <i className="fas fa-download mr-2"></i>
                  Install Phantom Wallet
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.open('https://solflare.com/', '_blank')}
                  className="w-full"
                >
                  <i className="fas fa-download mr-2"></i>
                  Install Solflare Wallet
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {availableWallets.map((wallet) => (
                <Button
                  key={wallet.id}
                  variant="outline"
                  onClick={() => handleConnect(wallet.id)}
                  disabled={connecting}
                  className="w-full flex items-center justify-start p-4 h-auto"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center mr-3">
                    <i className="fas fa-wallet text-white text-sm"></i>
                  </div>
                  <div className="text-left">
                    <div className="font-medium">{wallet.name}</div>
                    <div className="text-sm text-gray-500">
                      {wallet.id === 'phantom' ? 'The friendly crypto wallet built for DeFi & NFTs' : 'Solana wallet for everyone'}
                    </div>
                  </div>
                  {connecting && <i className="fas fa-spinner fa-spin ml-auto"></i>}
                </Button>
              ))}
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <i className="fas fa-info-circle mr-1"></i>
              Wallet connection enables secure authentication and future web3 features.
            </p>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}