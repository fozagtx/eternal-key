// Simple wallet generator using Node.js crypto
const crypto = require("crypto");
const { keccak256 } = require("js-sha3");

function generateWallet() {
  // Generate 32 random bytes for private key
  const privateKeyBuffer = crypto.randomBytes(32);
  const privateKey = privateKeyBuffer.toString("hex");

  // Generate public key from private key using elliptic curves
  const secp256k1 = require("secp256k1");
  const publicKeyBuffer = secp256k1.publicKeyCreate(privateKeyBuffer);
  const publicKey = publicKeyBuffer.toString("hex");

  // Generate address from public key (last 20 bytes of keccak256 hash)
  const publicKeyWithoutPrefix = publicKey.slice(2); // Remove 0x04 prefix
  const addressHash = keccak256(Buffer.from(publicKeyWithoutPrefix, "hex"));
  const address = "0x" + addressHash.slice(-40); // Last 20 bytes = 40 hex chars

  return {
    privateKey,
    address,
  };
}

console.log("🔑 Generating a new wallet for development...\n");

try {
  const wallet = generateWallet();

  console.log("📋 Wallet Information:");
  console.log("====================");
  console.log("Address:     ", wallet.address);
  console.log("Private Key: ", wallet.privateKey);

  console.log("\n💡 Instructions:");
  console.log("1. Copy the Private Key to contract/.env:");
  console.log(`   PRIVATE_KEY=${wallet.privateKey}`);
  console.log("\n2. Get STT tokens for this address:");
  console.log(`   Address: ${wallet.address}`);
  console.log("   • Visit: https://testnet.somnia.network/");
  console.log("   • Or join Discord and request tokens in #dev-chat");
  console.log("   • Tag @emma_odia for test tokens");

  console.log("\n⚠️  SECURITY WARNING:");
  console.log("   • This is for DEVELOPMENT/TESTING only");
  console.log("   • Never use this wallet for real funds");
  console.log("   • Keep the private key secure");
} catch (error) {
  console.log("Please install required dependencies:");
  console.log("npm install secp256k1 js-sha3");
}
