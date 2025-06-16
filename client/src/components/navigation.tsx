import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { WalletConnectionModal } from "@/components/wallet/WalletConnectionModal";
import { useSolanaWallet } from "@/hooks/useSolanaWallet";

export function Navigation() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const { connected, publicKey, disconnect } = useSolanaWallet();

  const navItems = [
    { path: "/", label: "Markets", active: location === "/" },
    { path: "/dashboard", label: "Dashboard", active: location === "/dashboard" },
    { path: "/create", label: "Create Market", active: location === "/create" },
  ];

  if ((user as any)?.isAdmin) {
    navItems.push({ path: "/admin", label: "Admin", active: location === "/admin" });
  }

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
            <div className="hidden md:flex items-center space-x-3">
              <div className="text-sm text-gray-600">Balance:</div>
              <div className="font-semibold text-gray-900">
                ${parseFloat((user as any)?.balance || "0").toFixed(2)}
              </div>
            </div>
            
            {/* Wallet Status */}
            <div className="hidden md:flex items-center space-x-2">
              {connected ? (
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-gray-600">
                    {publicKey?.slice(0, 4)}...{publicKey?.slice(-4)}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={disconnect}
                    className="text-xs px-2 py-1 h-6"
                  >
                    Disconnect
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsWalletModalOpen(true)}
                  className="text-xs px-2 py-1 h-6"
                >
                  <i className="fas fa-wallet mr-1"></i>
                  Connect Wallet
                </Button>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.href = '/api/logout'}
            >
              <i className="fas fa-sign-out-alt w-4 h-4 mr-2"></i>
              Logout
            </Button>
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
