import { ethers } from "hardhat";
import {
  InheritanceCore,
  EmergencyManager,
  TimingManager,
} from "../typechain-types";

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  console.log("Deploying contracts to network:", network.name);
  console.log("Chain ID:", network.chainId);
  console.log("Deploying contracts with account:", deployer.address);
  console.log(
    "Account balance:",
    ethers.formatEther(await ethers.provider.getBalance(deployer.address)),
  );

  // Deploy InheritanceCore
  console.log("\n🚀 Deploying InheritanceCore...");
  const InheritanceCoreFactory =
    await ethers.getContractFactory("InheritanceCore");
  const inheritanceCore: InheritanceCore =
    await InheritanceCoreFactory.deploy();
  await inheritanceCore.waitForDeployment();

  const inheritanceCoreAddress = await inheritanceCore.getAddress();
  console.log("✅ InheritanceCore deployed to:", inheritanceCoreAddress);

  // Deploy EmergencyManager
  console.log("\n🚀 Deploying EmergencyManager...");
  const EmergencyManagerFactory =
    await ethers.getContractFactory("EmergencyManager");
  const emergencyManager: EmergencyManager =
    await EmergencyManagerFactory.deploy();
  await emergencyManager.waitForDeployment();

  const emergencyManagerAddress = await emergencyManager.getAddress();
  console.log("✅ EmergencyManager deployed to:", emergencyManagerAddress);

  // Deploy TimingManager
  console.log("\n🚀 Deploying TimingManager...");
  const TimingManagerFactory = await ethers.getContractFactory("TimingManager");
  const timingManager: TimingManager = await TimingManagerFactory.deploy();
  await timingManager.waitForDeployment();

  const timingManagerAddress = await timingManager.getAddress();
  console.log("✅ TimingManager deployed to:", timingManagerAddress);

  // Setup initial configuration
  console.log("\n⚙️ Setting up initial configuration...");

  // Grant emergency role to emergency manager
  const EMERGENCY_ROLE = await inheritanceCore.EMERGENCY_ROLE();
  await inheritanceCore.grantRole(EMERGENCY_ROLE, emergencyManagerAddress);
  console.log("✅ Emergency role granted to EmergencyManager");

  // Set timing manager in inheritance core
  await inheritanceCore.setTimingManager(timingManagerAddress);
  console.log("✅ TimingManager linked to InheritanceCore");

  // Deployment summary
  console.log("\n📋 DEPLOYMENT SUMMARY");
  console.log("======================================");
  console.log("Network:", network.name);
  console.log("Chain ID:", network.chainId.toString());
  console.log("Deployer:", deployer.address);
  console.log("InheritanceCore:", inheritanceCoreAddress);
  console.log("EmergencyManager:", emergencyManagerAddress);
  console.log("TimingManager:", timingManagerAddress);
  console.log("======================================");

  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId.toString(),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      InheritanceCore: inheritanceCoreAddress,
      EmergencyManager: emergencyManagerAddress,
      TimingManager: timingManagerAddress,
    },
    transactions: {
      InheritanceCore: inheritanceCore.deploymentTransaction()?.hash,
      EmergencyManager: emergencyManager.deploymentTransaction()?.hash,
      TimingManager: timingManager.deploymentTransaction()?.hash,
    },
  };

  // For Somnia network specifics
  if (network.chainId === 30380n) {
    console.log("\n🌐 Somnia Network Deployment Complete!");
    console.log("Explorer URLs:");
    if (network.name.includes("testnet")) {
      console.log(
        "InheritanceCore:",
        `https://testnet-explorer.somnia.network/address/${inheritanceCoreAddress}`,
      );
      console.log(
        "EmergencyManager:",
        `https://testnet-explorer.somnia.network/address/${emergencyManagerAddress}`,
      );
    } else {
      console.log(
        "InheritanceCore:",
        `https://explorer.somnia.network/address/${inheritanceCoreAddress}`,
      );
      console.log(
        "EmergencyManager:",
        `https://explorer.somnia.network/address/${emergencyManagerAddress}`,
      );
    }

    console.log("\n💡 Next Steps:");
    console.log("1. Verify contracts on Somnia explorer");
    console.log("2. Update frontend configuration with deployed addresses");
    console.log(
      "3. Test inheritance creation with 15-second timing on testnet",
    );
    console.log("4. Use setTestingMode() for rapid development iterations");
    console.log("5. Switch to setProductionMode() before mainnet deployment");
    console.log("6. Set up monitoring and alerts");
  }

  // Gas usage summary
  const inheritanceCoreReceipt = await inheritanceCore
    .deploymentTransaction()
    ?.wait();
  const emergencyManagerReceipt = await emergencyManager
    .deploymentTransaction()
    ?.wait();

  console.log("\n⛽ Gas Usage Summary:");
  console.log(
    "InheritanceCore deployment:",
    inheritanceCoreReceipt?.gasUsed.toString(),
    "gas",
  );
  console.log(
    "EmergencyManager deployment:",
    emergencyManagerReceipt?.gasUsed.toString(),
    "gas",
  );

  const totalGas =
    (inheritanceCoreReceipt?.gasUsed || 0n) +
    (emergencyManagerReceipt?.gasUsed || 0n);
  console.log("Total gas used:", totalGas.toString(), "gas");

  return deploymentInfo;
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then((deploymentInfo) => {
    console.log("\n✨ Deployment completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
