import type { ReactNode } from 'react'
import { createWeb3Modal } from '@web3modal/wagmi/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { config, projectId } from '@/config/wagmi.config'

// 3. Create modal
if (!projectId) {
  console.warn("WalletConnect Project ID is missing. Web3Modal may not function correctly.");
}

createWeb3Modal({
  wagmiConfig: config,
  projectId: projectId || "1b15f85b4e2f0c6f99354a3f49fe7660", // Fallback to a test ID if env is missing
  themeMode: "light",
  themeVariables: {
    "--w3m-z-index": 9999,
  },
  enableAnalytics: false,
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
