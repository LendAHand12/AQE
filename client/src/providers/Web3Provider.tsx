import type { ReactNode } from 'react'
import { createWeb3Modal } from '@web3modal/wagmi/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { config, projectId } from '@/config/wagmi.config'

// 3. Create modal
if (!projectId) {
  console.error("VITE_WALLETCONNECT_PROJECT_ID is missing in .env file!");
} else {
  console.log("Web3Modal initialized with Project ID:", projectId.slice(0, 6) + "...");
}

createWeb3Modal({
  wagmiConfig: config,
  projectId: projectId as string,
  themeMode: "light",
  themeVariables: {
    "--w3m-z-index": 9999,
  },
  enableAnalytics: false,
  enableEIP6963: false,
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
