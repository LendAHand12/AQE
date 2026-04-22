import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { bsc } from '@reown/appkit/networks'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'

// 1. Get projectId at https://cloud.reown.com
// Using a placeholder - User should replace this in .env
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID 

// 2. Set up Wagmi adapter
const networks = [bsc]
const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks
})

// 3. Configure AppKit
createAppKit({
  adapters: [wagmiAdapter],
  networks: [bsc],
  projectId,
  metadata: {
    name: 'AQ Estate',
    description: 'AQ Estate Pre-Registration System',
    url: 'https://aqestate.io',
    icons: ['https://aqestate.io/logo.png']
  },
  features: {
    analytics: true
  }
})

const queryClient = new QueryClient()

export function Web3Provider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}

// USDT Constants
export const USDT_CONFIG = {
  address: '0x55d398326f99059fF775485246999027B3197955' as `0x${string}`,
  abi: [
    {
      constant: false,
      inputs: [
        { name: '_to', type: 'address' },
        { name: '_value', type: 'uint256' }
      ],
      name: 'transfer',
      outputs: [{ name: '', type: 'bool' }],
      type: 'function'
    },
    {
      constant: true,
      inputs: [{ name: '_owner', type: 'address' }],
      name: 'balanceOf',
      outputs: [{ name: 'balance', type: 'uint256' }],
      type: 'function'
    },
    {
      constant: true,
      inputs: [],
      name: 'decimals',
      outputs: [{ name: '', type: 'uint8' }],
      type: 'function'
    }
  ]
}
