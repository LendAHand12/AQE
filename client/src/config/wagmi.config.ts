import { http } from "wagmi";
import { bsc } from "@reown/appkit/networks";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";

// Get projectId from https://cloud.reown.com
export const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;

export const metadata = {
  name: 'AQ Estate',
  description: 'AQ Estate Payment System',
  url: 'https://aqestate.io', // Force HTTPS url for strict mobile wallets like MetaMask
  icons: ['https://aqestate.io/logo.png']
}

export const networks = [bsc] as const;

export const wagmiAdapter = new WagmiAdapter({
  ssr: false,
  networks,
  projectId,
  transports: {
    [bsc.id]: http("https://bsc-dataseed.binance.org"),
  },
});

export const config = wagmiAdapter.wagmiConfig;

