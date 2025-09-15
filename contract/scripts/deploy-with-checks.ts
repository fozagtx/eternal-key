import { ethers } from "hardhat";
import {
  InheritanceCore,
  EmergencyManager,
  TimingManager,
} from "../typechain-types";

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  console.log("🚀 Somnia Testnet Deployment with Pre-checks");
  console.log("=============================================");
  console.log("Network:", network.name);
  console.log("Chain ID:", network.chainId.toString());
  console.log("Deployer:", deployer.address);

  // Check balance first
  const balance = await ethers.provider.getBalance(deployer.address);
  const balanceInSTT = ethers.formatEther(balance);
  console.log("Account balance:", balanceInSTT, "STT");

  if (balance === 0n) {
    console.log("\n❌ Deployment failed: Account has no STT tokens!");
    console.log("\n🎯 Please fund your wallet first:");
    console.log("1. Visit: https://testnet.somnia.network/");
    console.log("2. Enter wallet address:", deployer.address);
    console.log("3. Request STT tokens");
    console.log("4. Run: bun hardhat run scripts/fund-wallet.ts --network somnia-testnet");
    console.log("5. Then retry deployment");
    process.exit(1);
  }

  // Check if balance is sufficient (at least 0.1 STT recommended)
  const minBalance = ethers.parseEther("0.1");
  if (balance < minBalance) {
    console.log(`\n⚠️  Low balance warning: ${balanceInSTT} STT`);
    console.log("Recommended: At least 0.1 STT for deployment");
    console.log("Continuing anyway...");
  } else {
    console.log("✅ Sufficient balance for deployment");
  }

  try {
    // Test network connectivity
    console.log("\n🔍 Testing network connectivity...");
    const blockNumber = await ethers.provider.getBlockNumber();
    console.log("✅ Connected to block:", blockNumber);

    // Deploy InheritanceCore
    console.log("\n🚀 Deploying InheritanceCore...");
    const InheritanceCoreFactory = await ethers.getContractFactory("InheritanceCore");
    const inheritanceCore: InheritanceCore = await InheritanceCoreFactory.deploy();

    console.log("⏳ Waiting for deployment confirmation...");
    await inheritanceCore.waitForDeployment();

    const inheritanceCoreAddress = await inheritanceCore.getAddress();
    console.log("✅ InheritanceCore deployed to:", inheritanceCoreAddress);

    // Deploy EmergencyManager
    console.log("\n🚀 Deploying EmergencyManager...");
    const EmergencyManagerFactory = await ethers.getContractFactory("EmergencyManager");
    const emergencyManager: EmergencyManager = await EmergencyManagerFactory.deploy();

    console.log("⏳ Waiting for deployment confirmation...");
    await emergencyManager.waitForDeployment();

    const emergencyManagerAddress = await emergencyManager.getAddress();
    console.log("✅ EmergencyManager deployed to:", emergencyManagerAddress);

    // Deploy TimingManager
    console.log("\n🚀 Deploying TimingManager...");
    const TimingManagerFactory = await ethers.getContractFactory("TimingManager");
    const timingManager: TimingManager = await TimingManagerFactory.deploy();

    console.log("⏳ Waiting for deployment confirmation...");
    await timingManager.waitForDeployment();

    const timingManagerAddress = await timingManager.getAddress();
    console.log("✅ TimingManager deployed to:", timingManagerAddress);

    // Setup initial configuration
    console.log("\n⚙️ Setting up initial configuration...");

    // Grant emergency role to emergency manager
    const EMERGENCY_ROLE = await inheritanceCore.EMERGENCY_ROLE();
    const tx1 = await inheritanceCore.grantRole(EMERGENCY_ROLE, emergencyManagerAddress);
    await tx1.wait();
    console.log("✅ Emergency role granted to EmergencyManager");

    // Set timing manager in inheritance core
    const tx2 = await inheritanceCore.setTimingManager(timingManagerAddress);
    await tx2.wait();
    console.log("✅ TimingManager linked to InheritanceCore");

    // Final balance check
    const finalBalance = await ethers.provider.getBalance(deployer.address);
    const gasUsed = balance - finalBalance;
    console.log("\n⛽ Gas Usage Summary:");
    console.log("Initial balance:", ethers.formatEther(balance), "STT");
    console.log("Final balance:", ethers.formatEther(finalBalance), "STT");
    console.log("Total gas cost:", ethers.formatEther(gasUsed), "STT");

    // Deployment summary
    console.log("\n🎉 DEPLOYMENT SUCCESSFUL!");
    console.log("======================================");
    console.log("Network:", network.name);
    console.log("Chain ID:", network.chainId.toString());
    console.log("Deployer:", deployer.address);
    console.log("InheritanceCore:", inheritanceCoreAddress);
    console.log("EmergencyManager:", emergencyManagerAddress);
    console.log("TimingManager:", timingManagerAddress);

    console.log("\n🌐 Explorer URLs:");
    console.log("InheritanceCore:");
    console.log(`  https://shannon-explorer.somnia.network/address/${inheritanceCoreAddress}`);
    console.log("EmergencyManager:");
    console.log(`  https://shannon-explorer.somnia.network/address/${emergencyManagerAddress}`);
    console.log("TimingManager:");
    console.log(`  https://shannon-explorer.somnia.network/address/${timingManagerAddress}`);

    console.log("\n💡 Next Steps:");
    console.log("1. Verify contracts on explorer");
    console.log("2. Update frontend configuration with addresses above");
    console.log("3. Test contract functionality");

    // Return deployment info
    return {
      network: network.name,
      chainId: network.chainId.toString(),
      deployer: deployer.address,
      contracts: {
        InheritanceCore: inheritanceCoreAddress,
        EmergencyManager: emergencyManagerAddress,
        TimingManager: timingManagerAddress,
      },
      gasUsed: ethers.formatEther(gasUsed),
    };

  } catch (error: any) {
    console.error("\n❌ Deployment failed:");

    if (error.code === 'NETWORK_ERROR') {
      console.error("Network connection failed. Check RPC URL and internet connection.");
    } else if (error.message.includes('insufficient funds')) {
      console.error("Insufficient funds for gas. Please fund your wallet:");
      console.error("Visit: https://testnet.somnia.network/");
      console.error("Address:", deployer.address);
    } else if (error.message.includes('account does not exist')) {
      console.error("Account does not exist on the network.");
      console.error("Please ensure your wallet is funded with STT tokens.");
    } else {
      console.error("Error details:", error.message);
    }

    console.error("\n🔧 Troubleshooting:");
    console.error("1. Check wallet has STT tokens");
    console.error("2. Verify network configuration");
    console.error("3. Try again in a few minutes");

    process.exit(1);
  }
}

main()
  .then((result) => {
    if (result) {
      console.log("\n✨ Deployment completed successfully!");
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error("Unexpected error:", error);
    process.exit(1);
  });
