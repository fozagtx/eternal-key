import { http, createConfig } from "wagmi";
import { base, mainnet, hardhat, localhost } from "wagmi/chains";
import { getDefaultConfig } from "connectkit";

// Custom Somnia chain configuration - updated per official docs
const somnia = {
  id: 50312, // Updated chain ID
  name: "Somnia Network",
  nativeCurrency: {
    decimals: 18,
    name: "STT", // Somnia Test Tokens for testnet
    symbol: "STT",
  },
  rpcUrls: {
    default: { http: ["https://dream-rpc.somnia.network"] }, // Updated RPC endpoint
  },
  blockExplorers: {
    default: {
      name: "Shannon Explorer",
      url: "https://shannon-explorer.somnia.network", // Updated explorer
    },
  },
} as const;

// Development chains for testing
const devChains =
  process.env.NODE_ENV === "development" ? [hardhat, localhost] : [];

const config = createConfig(
  getDefaultConfig({
    chains: [mainnet, base, somnia, ...devChains],
    transports: {
      [mainnet.id]: http(),
      [base.id]: http(),
      [somnia.id]: http(),
      ...(process.env.NODE_ENV === "development"
        ? {
            [hardhat.id]: http("http://127.0.0.1:8545"),
            [localhost.id]: http("http://127.0.0.1:8545"),
          }
        : {}),
    },
    walletConnectProjectId:
      process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "",
    appName: "Eternal Key",
    appDescription: "Decentralized Inheritance Governance For The People",
    appUrl: "https://family.co",
    appIcon: "https://family.co/logo.png",
  }),
);

export { config };
