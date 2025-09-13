import { http, createConfig } from 'wagmi'
import { base, mainnet } from 'wagmi/chains'
import { getDefaultConfig } from 'connectkit'

const config = createConfig(
  getDefaultConfig({
    chains: [mainnet, base],
    transports: {
      [mainnet.id]: http(),
      [base.id]: http(),
    },
    walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
    appName: 'Eternal Key',
    appDescription: 'Decentralized Inheritance Governance For The People',
    appUrl: 'https://family.co',
    appIcon: 'https://family.co/logo.png',
  }),
)

export { config }
