import { ethers } from "hardhat";

async function main() {
  console.log("🔑 Generating a new wallet for development...\n");

  // Create a new random wallet
  const wallet = ethers.Wallet.createRandom();

  console.log("📋 Wallet Information:");
  console.log("====================");
  console.log("Address:     ", wallet.address);
  console.log("Private Key: ", wallet.privateKey.substring(2)); // Remove 0x prefix
  console.log("Mnemonic:    ", wallet.mnemonic?.phrase);

  console.log("\n💡 Instructions:");
  console.log("1. Copy the Private Key (without 0x) to contract/.env:");
  console.log(`   PRIVATE_KEY=${wallet.privateKey.substring(2)}`);
  console.log("\n2. Add this address to your MetaMask or wallet app:");
  console.log(`   ${wallet.address}`);
  console.log("\n3. Get STT tokens for this address:");
  console.log("   • Visit: https://testnet.somnia.network/");
  console.log("   • Or join Discord and request tokens in #dev-chat");
  console.log("   • Tag @emma_odia for test tokens");

  console.log("\n⚠️  SECURITY WARNING:");
  console.log("   • This is for DEVELOPMENT/TESTING only");
  console.log("   • Never use this wallet for real funds");
  console.log("   • Keep the private key secure");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
