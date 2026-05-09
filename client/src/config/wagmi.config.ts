import { http } from "wagmi";
import { bsc } from "@reown/appkit/networks";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";

// Get projectId from https://cloud.reown.com
export const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;

export const metadata = {
  name: 'AQ Estate',
  description: 'AQ Estate Payment System',
  url: 'https://platform.aqestate.net', // URL đã được whitelist trên Reown Dashboard
  icons: ['https://platform.aqestate.net/logo.png'],
  // redirect: {
  //   native: 'http://localhost:5173', // Redirect về localhost khi dev
  //   universal: 'https://platform.aqestate.net'
  // }
}

export const networks = [bsc];

export const wagmiAdapter = new WagmiAdapter({
  ssr: false,
  networks,
  projectId,
  transports: {
    [bsc.id]: http("https://bsc-dataseed.binance.org"),
  },
});

export const config = wagmiAdapter.wagmiConfig;

