import { http } from "wagmi";
import { defineChain } from "viem";
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

// AMC20 network used by the HEWE swap flow (/swap). RPC/chain id/explorer are
// filled in later via .env — the fallback chain id below is a placeholder so
// the app doesn't crash before real values are set.
const amc20ChainId = Number(import.meta.env.VITE_AMC20_CHAIN_ID) || 999999;
const amc20RpcUrl = import.meta.env.VITE_AMC20_RPC_URL;

export const amc20 = defineChain({
  id: amc20ChainId,
  name: "AMC20",
  nativeCurrency: {
    name: import.meta.env.VITE_AMC20_CURRENCY_SYMBOL || "AMC",
    symbol: import.meta.env.VITE_AMC20_CURRENCY_SYMBOL || "AMC",
    decimals: 18,
  },
  rpcUrls: {
    default: { http: [amc20RpcUrl] },
  },
  blockExplorers: import.meta.env.VITE_AMC20_EXPLORER_URL
    ? {
        default: {
          name: "AMC20 Explorer",
          url: import.meta.env.VITE_AMC20_EXPLORER_URL,
        },
      }
    : undefined,
});

export const networks = [bsc, amc20];

// Many custom-chain RPC nodes (like the AMC20 one) don't send CORS headers,
// so browser-initiated calls (readContract, waitForTransactionReceipt, etc.)
// get blocked. Route those through our own backend, which proxies the JSON-RPC
// request server-side where CORS doesn't apply. The wallet extension itself
// (MetaMask "Add Network", tx signing) still talks to the real RPC directly
// via `amc20.rpcUrls`, since that path isn't subject to page-level CORS.
const amc20ProxyUrl = `${import.meta.env.VITE_API_URL}/swap/rpc-proxy`;

export const wagmiAdapter = new WagmiAdapter({
  ssr: false,
  networks,
  projectId,
  transports: {
    [bsc.id]: http("https://bsc-dataseed.binance.org"),
    [amc20.id]: http(amc20ProxyUrl),
  },
});

export const config = wagmiAdapter.wagmiConfig;

