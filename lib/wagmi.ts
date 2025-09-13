import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { Chain } from 'wagmi/chains';

// Somnia Testnet configuration
export const somnia: Chain = {
  id: 50312,
  name: 'Somnia Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'STT',
    symbol: 'STT',
  },
  rpcUrls: {
    default: {
      http: ['https://testnet.somnia.network/'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Somnia Explorer',
      url: 'https://testnet.somnia.network/',
    },
  },
  testnet: true,
};

export const config = getDefaultConfig({
  appName: 'Crypto Inheritance System',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  chains: [somnia],
  ssr: true,
});