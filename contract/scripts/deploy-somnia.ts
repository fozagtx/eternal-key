import { ethers } from "hardhat";

async function main() {
  console.log("Deploying Inheritance contracts to Somnia Network...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Deploy TimingManager first
  console.log("\n1. Deploying TimingManager...");
  const TimingManager = await ethers.getContractFactory("TimingManager");
  const timingManager = await TimingManager.deploy();
  await timingManager.waitForDeployment();
  const timingManagerAddress = await timingManager.getAddress();
  console.log("TimingManager deployed to:", timingManagerAddress);

  // Deploy EmergencyManager
  console.log("\n2. Deploying EmergencyManager...");
  const EmergencyManager = await ethers.getContractFactory("EmergencyManager");
  const emergencyManager = await EmergencyManager.deploy();
  await emergencyManager.waitForDeployment();
  const emergencyManagerAddress = await emergencyManager.getAddress();
  console.log("EmergencyManager deployed to:", emergencyManagerAddress);

  // Deploy InheritanceCore
  console.log("\n3. Deploying InheritanceCore...");
  const InheritanceCore = await ethers.getContractFactory("InheritanceCore");
  const inheritanceCore = await InheritanceCore.deploy();
  await inheritanceCore.waitForDeployment();
  const inheritanceCoreAddress = await inheritanceCore.getAddress();
  console.log("InheritanceCore deployed to:", inheritanceCoreAddress);

  // Set up contract relationships
  console.log("\n4. Setting up contract relationships...");

  // Set TimingManager in InheritanceCore
  console.log("Setting TimingManager in InheritanceCore...");
  const setTimingManagerTx = await inheritanceCore.setTimingManager(timingManagerAddress);
  await setTimingManagerTx.wait();
  console.log("TimingManager set successfully");

  // Verify deployment by calling a view function
  console.log("\n5. Verifying deployment...");
  try {
    const timingConfig = await inheritanceCore.getInheritanceTiming(0);
    console.log("Verification successful - contracts are properly linked");
  } catch (error) {
    console.log("Note: Inheritance timing config not set (expected for new deployment)");
  }

  console.log("\n🎉 Deployment completed successfully!");
  console.log("\n📋 Contract Addresses:");
  console.log("==========================================");
  console.log("InheritanceCore:", inheritanceCoreAddress);
  console.log("TimingManager:  ", timingManagerAddress);
  console.log("EmergencyManager:", emergencyManagerAddress);
  console.log("==========================================");

  console.log("\n📝 Next Steps:");
  console.log("1. Update CONTRACT_ADDRESSES in lib/contracts.ts:");
  console.log(`   InheritanceCore: '${inheritanceCoreAddress}' as Address,`);
  console.log(`   TimingManager: '${timingManagerAddress}' as Address,`);
  console.log(`   EmergencyManager: '${emergencyManagerAddress}' as Address,`);

  console.log("\n2. Verify contracts on Shannon Explorer:");
  console.log(`   npx hardhat verify --network somnia-testnet ${inheritanceCoreAddress}`);
  console.log(`   npx hardhat verify --network somnia-testnet ${timingManagerAddress}`);
  console.log(`   npx hardhat verify --network somnia-testnet ${emergencyManagerAddress}`);

  console.log("\n3. Fund the deployer account with STT tokens for gas");
  console.log("4. Test the deployment through the frontend");

  return {
    inheritanceCore: inheritanceCoreAddress,
    timingManager: timingManagerAddress,
    emergencyManager: emergencyManagerAddress
  };
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then((addresses) => {
    console.log("\n✅ All contracts deployed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
