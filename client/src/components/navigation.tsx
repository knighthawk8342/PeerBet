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
    { path: "/create-market", label: "Create Market", active: location === "/create-market" },
  ];

  const handleWalletConnect = (publicKey: string) => {
    console.log('Wallet connected in navigation:', publicKey);
  };

  return (
    <nav className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <div className="flex-shrink-0">
              <button 
                onClick={() => setLocation("/")} 
                className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
              >
                BetMatch
              </button>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-center space-x-1">
                {navItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => setLocation(item.path)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      item.active
                        ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-sm"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200"
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
                <div className="flex items-center space-x-2 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-xl border border-green-200 dark:border-green-800">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-green-700 dark:text-green-300 font-mono">
                    {publicKey?.slice(0, 6)}...{publicKey?.slice(-6)}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={disconnect}
                  className="text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20 dark:border-red-800 dark:text-red-400"
                >
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => setIsWalletModalOpen(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-sm hover:shadow-md transition-all duration-200"
                size="sm"
              >
                <span className="mr-2">🔗</span>
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
