import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { WalletConnectionModal } from "@/components/wallet/WalletConnectionModal";
import { useSolanaWallet } from "@/hooks/useSolanaWallet";

export function Navigation() {
  const [location, setLocation] = useLocation();
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const { connected, publicKey, disconnect } = useSolanaWallet();

  const navItems = [
    { path: "/", label: "Markets", active: location === "/" },
    { path: "/dashboard", label: "Dashboard", active: location === "/dashboard" },
    { path: "/create", label: "Create Market", active: location === "/create" },
  ];

  const handleWalletConnect = (publicKey: string) => {
    console.log('Wallet connected in navigation:', publicKey);
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <div className="flex-shrink-0">
              <button onClick={() => setLocation("/")} className="text-2xl font-bold text-primary">
                BetMatch
              </button>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                {navItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => setLocation(item.path)}
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      item.active
                        ? "text-primary border-b-2 border-primary"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {/* Wallet Status */}
            {connected ? (
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600 font-mono">
                  {publicKey?.slice(0, 6)}...{publicKey?.slice(-6)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={disconnect}
                  className="text-xs"
                >
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsWalletModalOpen(true)}
              >
                <i className="fas fa-wallet mr-2"></i>
                Connect Wallet
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Wallet Connection Modal */}
      <WalletConnectionModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        onConnect={handleWalletConnect}
      />
    </nav>
  );
}
