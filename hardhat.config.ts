import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {},
    somnia: {
      url: "https://testnet.somnia.network/",
      chainId: 50312,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
  etherscan: {
    apiKey: {
      somnia: process.env.SOMNIA_API_KEY || "dummy-key",
    },
    customChains: [
      {
        network: "somnia",
        chainId: 50312,
        urls: {
          apiURL: "https://testnet.somnia.network/api",
          browserURL: "https://testnet.somnia.network/",
        },
      },
    ],
  },
  sourcify: {
    enabled: false,
  },
};

export default config;
