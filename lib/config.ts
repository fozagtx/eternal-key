import { http, createConfig } from "wagmi";
import { base, mainnet } from "wagmi/chains";
import { getDefaultConfig } from "connectkit";

// Custom Somnia chain configuration
const somnia = {
  id: 50312,
  name: "Somnia Network",
  nativeCurrency: {
    decimals: 18,
    name: "STT",
    symbol: "STT",
  },
  rpcUrls: {
    default: { http: ["https://dream-rpc.somnia.network"] },
  },
  blockExplorers: {
    default: {
      name: "Shannon Explorer",
      url: "https://shannon-explorer.somnia.network",
    },
  },
  testnet: true,
} as const;

const config = createConfig(
  getDefaultConfig({
    chains: [somnia, mainnet, base],
    transports: {
      [somnia.id]: http("https://dream-rpc.somnia.network"),
      [mainnet.id]: http(),
      [base.id]: http(),
    },
    walletConnectProjectId:
      process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "dummy-project-id",
    appName: "Eternal Key",
    appDescription: "Decentralized Inheritance Governance",
    appUrl: "https://localhost:3002",
    appIcon: "https://family.co/logo.png",
  }),
);

export { config };
