import { ethers } from "hardhat";
import { writeFileSync } from "fs";
import { join } from "path";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("=== INHERITANCE CONTRACT DEPLOYMENT ===");
  console.log(`Network: ${process.env.HARDHAT_NETWORK || "hardhat"}`);
  console.log(`Deployer: ${deployer.address}`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Balance: ${ethers.formatEther(balance)} STT`);

  if (balance === 0n) {
    throw new Error("Insufficient STT balance for deployment");
  }

  console.log("\nDeploying InheritanceCore contract...");

  try {
    const InheritanceCore = await ethers.getContractFactory("InheritanceCore");

    console.log("Estimating deployment gas...");

    const contract = await InheritanceCore.deploy();

    console.log("Waiting for deployment confirmation...");
    await contract.waitForDeployment();

    const contractAddress = await contract.getAddress();
    const deploymentTx = contract.deploymentTransaction();

    if (!deploymentTx) {
      throw new Error("Deployment transaction not found");
    }

    console.log("\n=== DEPLOYMENT SUCCESSFUL ===");
    console.log(`Contract Address: ${contractAddress}`);
    console.log(`Transaction Hash: ${deploymentTx.hash}`);
    console.log(`Block Number: ${deploymentTx.blockNumber}`);
    console.log(`Gas Used: ${deploymentTx.gasLimit}`);

    // Wait for additional confirmations
    console.log("\nWaiting for confirmations...");
    const receipt = await deploymentTx.wait(3);

    if (!receipt) {
      throw new Error("Transaction receipt not found");
    }

    console.log(`Confirmed in block: ${receipt.blockNumber}`);
    console.log(`Actual gas used: ${receipt.gasUsed}`);

    // Verify contract is deployed correctly
    console.log("\nVerifying deployment...");
    const code = await ethers.provider.getCode(contractAddress);
    if (code === "0x") {
      throw new Error("Contract deployment failed - no bytecode found");
    }

    // Test basic contract functionality
    console.log("Testing contract functionality...");
    const hasAdminRole = await contract.hasRole(
      await contract.DEFAULT_ADMIN_ROLE(),
      deployer.address
    );

    if (!hasAdminRole) {
      throw new Error("Contract admin role not properly assigned");
    }

    console.log("✅ Contract functionality verified");

    // Save deployment information
    const deploymentInfo = {
      network: process.env.HARDHAT_NETWORK || "hardhat",
      contractName: "InheritanceCore",
      contractAddress: contractAddress,
      deployer: deployer.address,
      deploymentTxHash: deploymentTx.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      timestamp: new Date().toISOString(),
      constructorArgs: [],
    };

    const outputPath = join(__dirname, "../deployments.json");
    let deployments = [];

    try {
      const existingData = require(outputPath);
      deployments = Array.isArray(existingData) ? existingData : [existingData];
    } catch {
      // File doesn't exist or is invalid, start fresh
    }

    deployments.push(deploymentInfo);
    writeFileSync(outputPath, JSON.stringify(deployments, null, 2));

    console.log(`\n📝 Deployment info saved to: ${outputPath}`);

    // Contract verification instructions
    console.log("\n=== VERIFICATION INSTRUCTIONS ===");
    console.log("To verify the contract on block explorer, run:");
    console.log(
      `npx hardhat verify --network ${process.env.HARDHAT_NETWORK} ${contractAddress}`
    );

    console.log("\n=== USAGE INSTRUCTIONS ===");
    console.log("1. Create inheritance:");
    console.log(
      `   contract.createInheritance(name, executor, requiresConfirmation, timeLock)`
    );
    console.log("2. Add beneficiaries:");
    console.log(
      `   contract.addBeneficiary(inheritanceId, beneficiary, allocationBasisPoints)`
    );
    console.log("3. Deposit assets:");
    console.log(`   contract.depositSTT(inheritanceId, { value: amount })`);
    console.log("4. Trigger inheritance:");
    console.log(`   contract.triggerInheritance(inheritanceId)`);
    console.log("5. Claim assets:");
    console.log(`   contract.claimAssets(inheritanceId)`);

    return {
      contractAddress,
      deploymentTxHash: deploymentTx.hash,
      blockNumber: receipt.blockNumber,
    };
  } catch (error) {
    console.error("\n❌ DEPLOYMENT FAILED");
    console.error(`Error: ${error}`);

    if (error instanceof Error) {
      console.error(`Message: ${error.message}`);

      if (error.message.includes("insufficient funds")) {
        console.error("\n💡 Solution: Add more STT to your account");
      } else if (error.message.includes("gas")) {
        console.error("\n💡 Solution: Increase gas limit or gas price");
      } else if (error.message.includes("nonce")) {
        console.error(
          "\n💡 Solution: Wait for pending transactions to complete"
        );
      }
    }

    throw error;
  }
}

main()
  .then((result) => {
    console.log("\n🎉 DEPLOYMENT COMPLETED SUCCESSFULLY");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 DEPLOYMENT SCRIPT FAILED");
    console.error(error);
    process.exit(1);
  });
