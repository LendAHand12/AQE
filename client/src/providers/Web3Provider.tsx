import type { ReactNode } from 'react'
import { createWeb3Modal } from '@web3modal/wagmi/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { config, projectId } from '@/config/wagmi.config'

// 3. Create modal
createWeb3Modal({
  wagmiConfig: config,
  projectId: projectId || "",
  themeMode: "light",
  themeVariables: {
    "--w3m-z-index": 9999,
  },
  enableAnalytics: false, // Optional - defaults to your Cloud configuration
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
