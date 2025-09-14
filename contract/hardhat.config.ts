import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import "dotenv/config";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28", // Updated to Somnia recommended version
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
    // Updated Somnia network configurations per official docs
    "somnia-testnet": {
      url: "https://dream-rpc.somnia.network", // Updated RPC endpoint
      chainId: 50312, // Updated chain ID
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: "auto",
      gas: "auto",
    },
    "somnia-mainnet": {
      url: "https://dream-rpc.somnia.network", // Updated RPC endpoint
      chainId: 50312, // Updated chain ID
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: "auto",
      gas: "auto",
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
        chainId: 50312, // Updated chain ID
        urls: {
          apiURL: "https://shannon-explorer.somnia.network/api", // Updated explorer API
          browserURL: "https://shannon-explorer.somnia.network", // Updated explorer URL
        },
      },
      {
        network: "somnia-mainnet",
        chainId: 50312, // Updated chain ID
        urls: {
          apiURL: "https://shannon-explorer.somnia.network/api", // Updated explorer API
          browserURL: "https://shannon-explorer.somnia.network", // Updated explorer URL
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
