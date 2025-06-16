import { useState, useEffect } from 'react';

interface SolanaWallet {
  isPhantom?: boolean;
  isSolflare?: boolean;
  isConnected?: boolean;
  connect: (options?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: { toString: () => string } }>;
  disconnect: () => Promise<void>;
  signMessage: (message: Uint8Array) => Promise<{ signature: Uint8Array }>;
  signTransaction: (transaction: any) => Promise<any>;
  signAndSendTransaction: (transaction: any) => Promise<string>;
}

interface WalletState {
  connected: boolean;
  connecting: boolean;
  publicKey: string | null;
  wallet: SolanaWallet | null;
}

declare global {
  interface Window {
    solana?: SolanaWallet;
    solflare?: SolanaWallet;
  }
}

export function useSolanaWallet() {
  const [walletState, setWalletState] = useState<WalletState>({
    connected: false,
    connecting: false,
    publicKey: null,
    wallet: null,
  });

  useEffect(() => {
    // Check if wallet is already connected
    const checkConnection = async () => {
      if (window.solana) {
        try {
          const response = await window.solana.connect({ onlyIfTrusted: true });
          if (response.publicKey) {
            setWalletState({
              connected: true,
              connecting: false,
              publicKey: response.publicKey.toString(),
              wallet: window.solana,
            });
          }
        } catch (error) {
          console.log('Wallet not connected');
        }
      }
    };

    checkConnection();
  }, []);

  const connect = async (walletType: 'phantom' | 'solflare' = 'phantom') => {
    if (walletState.connecting) return;

    setWalletState(prev => ({ ...prev, connecting: true }));

    try {
      let wallet: SolanaWallet | undefined;

      if (walletType === 'phantom') {
        if (!window.solana) {
          throw new Error('Phantom wallet not found. Please install Phantom wallet extension.');
        }
        wallet = window.solana;
      } else if (walletType === 'solflare') {
        if (!window.solflare) {
          throw new Error('Solflare wallet not found. Please install Solflare wallet extension.');
        }
        wallet = window.solflare;
      }

      if (!wallet) {
        throw new Error('No wallet found');
      }

      const response = await wallet.connect();
      const publicKeyString = response.publicKey.toString();
      
      setWalletState({
        connected: true,
        connecting: false,
        publicKey: publicKeyString,
        wallet,
      });

      return publicKeyString;
    } catch (error) {
      setWalletState(prev => ({ ...prev, connecting: false }));
      throw error;
    }
  };

  const disconnect = async () => {
    if (walletState.wallet) {
      try {
        await walletState.wallet.disconnect();
      } catch (error) {
        console.error('Error disconnecting wallet:', error);
      }
    }

    setWalletState({
      connected: false,
      connecting: false,
      publicKey: null,
      wallet: null,
    });
  };

  const signMessage = async (message: string) => {
    if (!walletState.wallet || !walletState.connected) {
      throw new Error('Wallet not connected');
    }

    const encodedMessage = new TextEncoder().encode(message);
    const signedMessage = await walletState.wallet.signMessage(encodedMessage);
    
    return signedMessage;
  };

  const getAvailableWallets = () => {
    const wallets = [];
    if (window.solana?.isPhantom) {
      wallets.push({ name: 'Phantom', id: 'phantom' as const });
    }
    if (window.solflare) {
      wallets.push({ name: 'Solflare', id: 'solflare' as const });
    }
    return wallets;
  };

  return {
    ...walletState,
    connect,
    disconnect,
    signMessage,
    getAvailableWallets,
  };
}