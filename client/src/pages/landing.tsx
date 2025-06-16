import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { WalletConnectionModal } from "@/components/wallet/WalletConnectionModal";
import { useSolanaWallet } from "@/hooks/useSolanaWallet";

export default function Landing() {
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const { connected, publicKey, disconnect } = useSolanaWallet();

  const handleWalletConnect = (publicKey: string) => {
    console.log('Wallet connected:', publicKey);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-primary">BetMatch</h1>
            <div className="flex items-center gap-3">
              {connected ? (
                <div className="flex items-center gap-3">
                  <div className="text-sm text-gray-600">
                    Connected: {publicKey?.slice(0, 4)}...{publicKey?.slice(-4)}
                  </div>
                  <Button 
                    variant="outline"
                    onClick={disconnect}
                    size="sm"
                  >
                    Disconnect
                  </Button>
                </div>
              ) : (
                <Button 
                  variant="outline"
                  onClick={() => setIsWalletModalOpen(true)}
                  className="mr-2"
                >
                  Connect Wallet
                </Button>
              )}
              <Button 
                onClick={() => window.location.href = '/api/login'}
                className="bg-primary hover:bg-primary/90"
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            1v1 Betting Markets
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Create and join prediction markets with other users. Stake your position on outcomes and win rewards.
          </p>
          
          {/* Crypto Feature Highlight */}
          {connected && (
            <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white p-4 rounded-lg mb-8 max-w-md mx-auto">
              <div className="flex items-center justify-center gap-2 mb-2">
                <i className="fas fa-wallet"></i>
                <span className="font-semibold">Solana Wallet Connected</span>
              </div>
              <p className="text-sm opacity-90">
                Web3 features coming soon - Enhanced security and decentralized betting
              </p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-plus text-primary text-xl"></i>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Create Markets</h3>
                <p className="text-sm text-gray-600">Set up prediction markets on any topic and stake your position</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-handshake text-primary text-xl"></i>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Join & Compete</h3>
                <p className="text-sm text-gray-600">Find markets that match your predictions and compete 1v1</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-trophy text-primary text-xl"></i>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Win Rewards</h3>
                <p className="text-sm text-gray-600">Accurate predictions are rewarded with the total stake minus platform fee</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-wallet text-white text-xl"></i>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Web3 Ready</h3>
                <p className="text-sm text-gray-600">Connect your Solana wallet for enhanced security and future DeFi features</p>
              </CardContent>
            </Card>
          </div>

          <Button 
            size="lg"
            onClick={() => window.location.href = '/api/login'}
            className="bg-primary hover:bg-primary/90 px-8 py-3 text-lg"
          >
            Get Started
          </Button>
        </div>
      </main>

      {/* Wallet Connection Modal */}
      <WalletConnectionModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        onConnect={handleWalletConnect}
      />
    </div>
  );
}
