import { ethers } from "hardhat";
import hre from "hardhat";

async function main() {
  console.log("Checking wallet setup for Somnia deployment...");

  try {
    const [signer] = await ethers.getSigners();
    const address = signer.address;
    const balance = await signer.provider.getBalance(address);

    console.log("\n📋 Wallet Information:");
    console.log("=======================");
    console.log("Address:", address);
    console.log("Network:", hre.network.name);
    console.log("Chain ID:", hre.network.config.chainId);
    console.log("Balance:", ethers.formatEther(balance), "STT");

    if (balance > BigInt(0)) {
      console.log("\n✅ Wallet has STT tokens - ready to deploy!");
    } else {
      console.log("\n❌ Wallet has no STT tokens!");
      console.log("\n🎯 To get STT tokens:");
      console.log("1. Visit: https://testnet.somnia.network/");
      console.log("2. Or join Discord and request tokens in #dev-chat");
      console.log("3. Tag @emma_odia for test tokens");
    }
  } catch (error) {
    console.error("❌ Error checking balance:", error);
    console.log("\n🔧 Make sure:");
    console.log("1. .env.local file exists with PRIVATE_KEY");
    console.log("2. Private key is valid (without 0x prefix)");
    console.log("3. Network configuration is correct");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
