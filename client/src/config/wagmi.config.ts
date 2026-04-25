import { createConfig, http } from "wagmi";
import { bsc } from "wagmi/chains";
import { walletConnect, injected } from "wagmi/connectors";

// Get projectId from https://cloud.reown.com
export const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;

// 2. Create wagmiConfig
const metadata = {
  name: 'AQ Estate',
  description: 'AQ Estate Payment System',
  url: window.location.origin, // origin must match your domain & subdomain
  icons: ['https://aqestate.io/logo.png']
}

const chains = [bsc] as const;
const connectors = [
  injected(),
  walletConnect({ projectId, metadata }),
];

export const config = createConfig({
  chains,
  connectors,
  transports: {
    [bsc.id]: http(),
  },
});

