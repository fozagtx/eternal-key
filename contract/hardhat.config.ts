import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import "dotenv/config";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    "somnia-testnet": {
      url: "https://testnet.somnia.network",
      chainId: 30380,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    "somnia-mainnet": {
      url: "https://rpc.somnia.network",
      chainId: 30380,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
  etherscan: {
    apiKey: {
      "somnia-testnet": "placeholder",
      "somnia-mainnet": "placeholder",
    },
    customChains: [
      {
        network: "somnia-testnet",
        chainId: 30380,
        urls: {
          apiURL: "https://testnet-explorer.somnia.network/api",
          browserURL: "https://testnet-explorer.somnia.network",
        },
      },
      {
        network: "somnia-mainnet",
        chainId: 30380,
        urls: {
          apiURL: "https://explorer.somnia.network/api",
          browserURL: "https://explorer.somnia.network",
        },
      },
    ],
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  typechain: {
    outDir: "./typechain-types",
    target: "ethers-v6",
  },
};

export default config;
