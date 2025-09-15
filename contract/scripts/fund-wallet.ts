import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  console.log("🎯 Funding Instructions for Somnia Testnet");
  console.log("==========================================");
  console.log("Network:", network.name);
  console.log("Chain ID:", network.chainId.toString());
  console.log("Wallet Address:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Current Balance:", ethers.formatEther(balance), "STT");

  if (balance === 0n) {
    console.log("\n❌ Wallet has no STT tokens!");
    console.log("\n🎯 To get STT tokens:");
    console.log("1. Visit the official faucet: https://testnet.somnia.network/");
    console.log("2. Enter your wallet address:", deployer.address);
    console.log("3. Request STT tokens");
    console.log("4. Wait for confirmation");

    console.log("\n🔄 Alternative methods:");
    console.log("• Join Somnia Discord and request tokens in #dev-chat");
    console.log("• Tag @emma_odia for test tokens");
    console.log("• Check if wallet address is correct in MetaMask");

    console.log("\n📝 Network details to add to MetaMask:");
    console.log("• Network Name: Somnia Testnet");
    console.log("• RPC URL: https://dream-rpc.somnia.network/");
    console.log("• Chain ID: 50312");
    console.log("• Symbol: STT");
    console.log("• Explorer: https://shannon-explorer.somnia.network/");

    console.log("\n⏳ After funding, run:");
    console.log("bun hardhat run scripts/fund-wallet.ts --network somnia-testnet");
    console.log("bun hardhat run scripts/deploy.ts --network somnia-testnet");
  } else {
    console.log("\n✅ Wallet is funded! Ready to deploy contracts.");
    console.log("Run: bun hardhat run scripts/deploy.ts --network somnia-testnet");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
