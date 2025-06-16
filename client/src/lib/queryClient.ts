import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Get current wallet public key from window global state
function getCurrentWalletPublicKey(): string | null {
  if (typeof window !== 'undefined') {
    // Check for Phantom wallet
    if ((window as any).solana?.isConnected && (window as any).solana?.publicKey) {
      return (window as any).solana.publicKey.toString();
    }
    // Check for Solflare wallet
    if ((window as any).solflare?.isConnected && (window as any).solflare?.publicKey) {
      return (window as any).solflare.publicKey.toString();
    }
    // Fallback to global variable if set
    if ((window as any).currentWalletPublicKey) {
      return (window as any).currentWalletPublicKey;
    }
  }
  return null;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const headers: Record<string, string> = {};
  
  if (data) {
    headers["Content-Type"] = "application/json";
  }
  
  const walletPublicKey = getCurrentWalletPublicKey();
  if (walletPublicKey) {
    headers["x-wallet-public-key"] = walletPublicKey;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const headers: Record<string, string> = {};
    
    const walletPublicKey = getCurrentWalletPublicKey();
    if (walletPublicKey) {
      headers["x-wallet-public-key"] = walletPublicKey;
    }

    const res = await fetch(queryKey[0] as string, {
      headers,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
