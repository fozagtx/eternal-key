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
    // Somnia network configurations per official docs
    "somnia-testnet": {
      url: "https://dream-rpc.somnia.network/", // Official RPC endpoint with trailing slash
      chainId: 50312,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      // Remove fixed gasPrice to use network's suggested gas price
      gas: 8000000,
      timeout: 60000,
    },
    "somnia-mainnet": {
      url: "https://dream-rpc.somnia.network/", // Official RPC endpoint with trailing slash
      chainId: 50312, // Note: Mainnet may have different chain ID when launched
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 1000000000, // 1 gwei
      gas: 8000000,
      timeout: 60000,
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
