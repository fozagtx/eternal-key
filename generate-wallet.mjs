// Simple wallet generator
import { randomBytes } from "crypto";

function generateWallet() {
  // Generate 32 random bytes for private key
  const privateKey = randomBytes(32).toString("hex");

  // For simplicity, we'll generate a mock address
  // In production, you'd derive this properly from the private key
  const mockAddress = "0x" + randomBytes(20).toString("hex");

  return { privateKey, mockAddress };
}

console.log("🔑 Generating a new wallet for development...\n");

const wallet = generateWallet();

console.log("📋 New Wallet Generated:");
console.log("=======================");
console.log("Private Key:", wallet.privateKey);
console.log("Mock Address:", wallet.mockAddress);

console.log("\n💡 Next Steps:");
console.log("1. Add to contract/.env:");
console.log(`   PRIVATE_KEY=${wallet.privateKey}`);
console.log("\n2. Import this private key into MetaMask:");
console.log("   • MetaMask → Import Account → Private Key");
console.log(`   • Paste: ${wallet.privateKey}`);
console.log("\n3. Switch to Somnia Testnet in MetaMask");
console.log("\n4. Get STT tokens:");
console.log("   • Visit: https://testnet.somnia.network/");
console.log("   • Connect your wallet and request tokens");
