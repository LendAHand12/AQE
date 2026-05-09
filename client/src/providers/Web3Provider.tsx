import type { ReactNode } from 'react'
import { createAppKit } from '@reown/appkit/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { config, projectId, networks, wagmiAdapter, metadata } from '@/config/wagmi.config'

// 3. Create modal
if (!projectId) {
  console.error("VITE_WALLETCONNECT_PROJECT_ID is missing in .env file!");
} else {
  console.log("AppKit initialized with Project ID:", projectId.slice(0, 6) + "...");
}

// --- PATCH FOR SAFEPAL BUG ---
// SafePal extension throws an unhandled rejection for 'isDefaultWallet' method.
// We intercept provider requests to silently return false for this method.
if (typeof window !== 'undefined') {
  const patchProvider = (provider: any) => {
    if (provider && typeof provider.request === 'function' && !provider.__patchedIsDefaultWallet) {
      try {
        const originalRequest = provider.request.bind(provider);
        Object.defineProperty(provider, 'request', {
          value: async (args: any) => {
            if (args && args.method === 'isDefaultWallet') {
              return false;
            }
            return originalRequest(args);
          },
          writable: true,
          configurable: true
        });
        provider.__patchedIsDefaultWallet = true;
      } catch (e) {
        console.warn("[Web3Provider] Skip patching read-only provider:", provider);
      }
    }
  };

  if ((window as any).ethereum) patchProvider((window as any).ethereum);
  if ((window as any).safepalProvider) patchProvider((window as any).safepalProvider);

  window.addEventListener('eip6963:announceProvider', (event: any) => {
    if (event.detail && event.detail.provider) {
      patchProvider(event.detail.provider);
    }
  });
}
// -----------------------------

createAppKit({
  adapters: [wagmiAdapter],
  networks: networks as any,
  metadata,
  projectId: projectId as string,
  themeMode: "light",
  themeVariables: {
    "--w3m-z-index": 9999,
  },
  // --- UNIVERSAL CONNECTION SETTINGS ---
  allWallets: 'SHOW', // Hiển thị nút "All Wallets"
  includeWalletIds: [], // Để trống để lấy tất cả ví mặc định
  featuredWalletIds: [
    '0b415a746fb9ee99cce155c2ceca0c6f6061b1dbca2d722b3ba16381d0562150', // SafePal
    'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
    '4622a2b2d6ad1dc655889c016e7e0eb2af024769e8d9c1599977df9a66a473a3', // Trust Wallet
  ],
  features: {
    analytics: false,
    email: false,
    socials: [],
    allWallets: true,
  },
  enableEIP6963: true,      // Hỗ trợ các ví extension chuẩn mới
  enableInjected: true,     // Hỗ trợ các ví extension truyền thống
  enableWalletConnect: true, // Hỗ trợ QR Code WalletConnect
  enableCoinbase: true,     // Hỗ trợ ví Coinbase
  // -------------------------------------
})

const queryClient = new QueryClient()

export function Web3Provider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}
