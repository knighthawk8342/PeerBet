import { Navigation } from "@/components/navigation";
import { StatsCard } from "@/components/ui/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WalletStatus } from "@/components/wallet/WalletStatus";
import { useSolanaWallet } from "@/hooks/useSolanaWallet";

export default function Dashboard() {
  const { publicKey, connected } = useSolanaWallet();

  if (!connected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Connect your wallet to access dashboard</h2>
          <p className="text-gray-600 mb-6">Your Solana wallet serves as your authentication</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Wallet Dashboard</h1>
          <p className="text-gray-600">Connected with {publicKey?.slice(0, 8)}...{publicKey?.slice(-8)}</p>
        </div>

        {/* Wallet Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Wallet Address"
            value={`${publicKey?.slice(0, 6)}...${publicKey?.slice(-6)}`}
            icon="fas fa-wallet"
            color="primary"
          />
          <StatsCard
            title="Connection Status"
            value="Connected"
            icon="fas fa-plug"
            color="success"
          />
          <StatsCard
            title="Network"
            value="Solana"
            icon="fas fa-network-wired"
            color="warning"
          />
          <StatsCard
            title="Authentication"
            value="Active"
            icon="fas fa-shield-alt"
            color="primary"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Welcome Message */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Welcome to BetMatch</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-gray-600">
                    You're successfully authenticated with your Solana wallet. Your wallet address serves as your unique identifier on the platform.
                  </p>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 mb-2">Getting Started</h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Browse available markets on the Markets page</li>
                      <li>• Create your own prediction markets</li>
                      <li>• Challenge other users to 1v1 bets</li>
                      <li>• All transactions are secured by your wallet</li>
                    </ul>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="font-semibold text-green-900 mb-2">Web3 Ready</h3>
                    <p className="text-sm text-green-800">
                      Your connected wallet enables future decentralized features including on-chain settlements, 
                      token rewards, and trustless betting protocols.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Wallet Status Sidebar */}
          <div className="space-y-6">
            <WalletStatus showFullCard={true} />
            
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <button 
                  onClick={() => window.location.href = '/'}
                  className="w-full bg-primary text-white p-3 rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Browse Markets
                </button>
                <button 
                  onClick={() => window.location.href = '/create'}
                  className="w-full bg-white border border-primary text-primary p-3 rounded-lg hover:bg-primary/5 transition-colors"
                >
                  Create Market
                </button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}