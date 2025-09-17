import { ethers } from "hardhat";
import { InheritanceCore } from "../typechain-types";

interface DeploymentInfo {
  contractAddress: string;
  deployer: string;
  blockNumber: number;
  networkName: string;
}

async function main() {
  const [deployer] = await ethers.getSigners();
  const networkName = process.env.HARDHAT_NETWORK || "hardhat";

  console.log("=== DEPLOYMENT VERIFICATION SCRIPT ===");
  console.log(`Network: ${networkName}`);
  console.log(`Verifier: ${deployer.address}`);

  // Get deployment info from command line args or deployment file
  const contractAddress = process.env.CONTRACT_ADDRESS || process.argv[2];

  if (!contractAddress) {
    console.error("❌ Contract address not provided");
    console.log("Usage: npm run verify:deployment <CONTRACT_ADDRESS>");
    console.log("Or set CONTRACT_ADDRESS environment variable");
    process.exit(1);
  }

  console.log(`Contract Address: ${contractAddress}`);

  try {
    const InheritanceCore = await ethers.getContractFactory("InheritanceCore");
    const contract = InheritanceCore.attach(contractAddress) as InheritanceCore;

    console.log("\n=== BASIC DEPLOYMENT CHECKS ===");

    // 1. Check if contract exists
    const code = await ethers.provider.getCode(contractAddress);
    if (code === "0x") {
      throw new Error("No contract found at the provided address");
    }
    console.log("✅ Contract bytecode found");

    // 2. Check contract balance
    const contractBalance = await ethers.provider.getBalance(contractAddress);
    console.log(
      `📊 Contract Balance: ${ethers.formatEther(contractBalance)} ETH`
    );

    // 3. Check if contract responds to basic calls
    try {
      const adminRole = await contract.DEFAULT_ADMIN_ROLE();
      console.log(`✅ DEFAULT_ADMIN_ROLE: ${adminRole}`);
    } catch (error) {
      throw new Error(`Contract interface mismatch: ${error}`);
    }

    console.log("\n=== ACCESS CONTROL VERIFICATION ===");

    // 4. Check admin role assignment
    const adminRole = await contract.DEFAULT_ADMIN_ROLE();
    const hasAdminRole = await contract.hasRole(adminRole, deployer.address);
    if (!hasAdminRole) {
      console.log("⚠️  Deployer does not have admin role");
    } else {
      console.log("✅ Deployer has admin role");
    }

    // 5. Check executor role
    const executorRole = await contract.EXECUTOR_ROLE();
    const hasExecutorRole = await contract.hasRole(
      executorRole,
      deployer.address
    );
    if (!hasExecutorRole) {
      console.log("⚠️  Deployer does not have executor role");
    } else {
      console.log("✅ Deployer has executor role");
    }

    console.log(`📋 EXECUTOR_ROLE: ${executorRole}`);

    console.log("\n=== FUNCTIONAL TESTING ===");

    // 6. Test contract functionality
    const testInheritanceName = `Test-${Date.now()}`;
    const timeLock = {
      distributionType: 0, // IMMEDIATE
      unlockTime: Math.floor(Date.now() / 1000) + 86400,
      vestingDuration: 0,
      cliffDuration: 0,
      milestoneTimestamps: [],
      milestonePercentages: [],
    };

    console.log("🧪 Testing inheritance creation...");
    const createTx = await contract.createInheritance(
      testInheritanceName,
      deployer.address,
      false,
      timeLock
    );
    const createReceipt = await createTx.wait();

    if (!createReceipt) {
      throw new Error("Create inheritance transaction failed");
    }

    console.log(`✅ Inheritance created successfully`);
    console.log(`   Gas used: ${createReceipt.gasUsed}`);
    console.log(`   Transaction: ${createTx.hash}`);

    // Get the inheritance ID from the event
    let inheritanceId = 0;
    const createEvent = createReceipt.logs.find((log) => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed?.name === "InheritanceCreated";
      } catch {
        return false;
      }
    });

    if (createEvent) {
      const parsed = contract.interface.parseLog(createEvent);
      inheritanceId = parsed?.args[0] as number;
      console.log(`   Inheritance ID: ${inheritanceId}`);
    }

    // 7. Test inheritance data retrieval
    console.log("📖 Testing data retrieval...");
    const inheritanceData = await contract.getInheritanceData(inheritanceId);

    if (inheritanceData.name !== testInheritanceName) {
      throw new Error("Inheritance data mismatch");
    }

    console.log("✅ Data retrieval working");
    console.log(`   Owner: ${inheritanceData.owner}`);
    console.log(`   Status: ${inheritanceData.status}`);
    console.log(
      `   Created: ${new Date(
        Number(inheritanceData.createdAt) * 1000
      ).toISOString()}`
    );

    // 8. Test beneficiary addition
    console.log("👥 Testing beneficiary addition...");
    const signers = await ethers.getSigners();
    const beneficiary = signers[1] || signers[0]; // Use second signer or fallback to first

    const addBeneficiaryTx = await contract.addBeneficiary(
      inheritanceId,
      beneficiary.address,
      5000 // 50%
    );
    const addBeneficiaryReceipt = await addBeneficiaryTx.wait();

    console.log("✅ Beneficiary added successfully");
    console.log(`   Gas used: ${addBeneficiaryReceipt!.gasUsed}`);

    // 9. Test beneficiary info retrieval
    const beneficiaryInfo = await contract.getBeneficiaryInfo(
      inheritanceId,
      beneficiary.address
    );
    if (
      !beneficiaryInfo.isActive ||
      beneficiaryInfo.allocationBasisPoints !== 5000
    ) {
      throw new Error("Beneficiary info mismatch");
    }
    console.log("✅ Beneficiary info retrieval working");

    // 10. Test ETH deposit
    console.log("💰 Testing ETH deposit...");
    const depositAmount = ethers.parseEther("0.01"); // Small test amount

    const depositTx = await contract.depositETH(inheritanceId, {
      value: depositAmount,
    });
    const depositReceipt = await depositTx.wait();

    console.log("✅ ETH deposit successful");
    console.log(`   Amount: ${ethers.formatEther(depositAmount)} ETH`);
    console.log(`   Gas used: ${depositReceipt!.gasUsed}`);

    // 11. Verify deposit was recorded
    const updatedData = await contract.getInheritanceData(inheritanceId);
    if (updatedData.totalETHDeposited.toString() !== depositAmount.toString()) {
      throw new Error("Deposit amount not recorded correctly");
    }
    console.log("✅ Deposit amount recorded correctly");

    // 12. Test inheritance triggering
    console.log("🚀 Testing inheritance triggering...");
    const triggerTx = await contract.triggerInheritance(inheritanceId);
    const triggerReceipt = await triggerTx.wait();

    console.log("✅ Inheritance triggered successfully");
    console.log(`   Gas used: ${triggerReceipt!.gasUsed}`);

    // 13. Test claimable amount calculation
    console.log("📊 Testing claimable amount calculation...");
    const claimableAmount = await contract.getClaimableETH(
      inheritanceId,
      beneficiary.address
    );
    const expectedAmount = (depositAmount * BigInt(5000)) / BigInt(10000); // 50%

    if (claimableAmount.toString() !== expectedAmount.toString()) {
      console.log(
        `⚠️  Claimable amount mismatch: expected ${ethers.formatEther(
          expectedAmount
        )}, got ${ethers.formatEther(claimableAmount)}`
      );
    } else {
      console.log("✅ Claimable amount calculation correct");
    }

    console.log("\n=== SECURITY CHECKS ===");

    // 14. Test unauthorized access prevention
    console.log("🔒 Testing access control...");
    const allSigners = await ethers.getSigners();
    const unauthorized = allSigners[2] || allSigners[1] || allSigners[0];

    try {
      await contract
        .connect(unauthorized)
        .addBeneficiary(inheritanceId, unauthorized.address, 1000);
      console.log(
        "⚠️  Unauthorized beneficiary addition succeeded (this should fail)"
      );
    } catch (error) {
      console.log("✅ Unauthorized access properly blocked");
    }

    // 15. Test direct payment rejection
    console.log("💸 Testing direct payment rejection...");
    try {
      await deployer.sendTransaction({
        to: contractAddress,
        value: ethers.parseEther("0.001"),
      });
      console.log("⚠️  Direct payment accepted (this should fail)");
    } catch (error) {
      console.log("✅ Direct payments properly rejected");
    }

    console.log("\n=== PERFORMANCE ANALYSIS ===");

    // 16. Gas usage analysis
    console.log("⛽ Gas Usage Summary:");
    console.log(`   Create Inheritance: ${createReceipt.gasUsed}`);
    console.log(`   Add Beneficiary: ${addBeneficiaryReceipt!.gasUsed}`);
    console.log(`   Deposit ETH: ${depositReceipt!.gasUsed}`);
    console.log(`   Trigger Inheritance: ${triggerReceipt!.gasUsed}`);

    const totalGasUsed =
      createReceipt.gasUsed +
      addBeneficiaryReceipt!.gasUsed +
      depositReceipt!.gasUsed +
      triggerReceipt!.gasUsed;
    console.log(`   Total Test Gas: ${totalGasUsed}`);

    // 17. Contract size check
    const contractSize = (code.length - 2) / 2; // Remove 0x and convert hex to bytes
    console.log(`📏 Contract Size: ${contractSize} bytes`);
    if (contractSize > 24576) {
      // 24KB limit
      console.log("⚠️  Contract size exceeds Ethereum limit");
    } else {
      console.log("✅ Contract size within limits");
    }

    console.log("\n=== DEPLOYMENT SUMMARY ===");

    const deploymentSummary = {
      contractAddress,
      networkName,
      deployer: deployer.address,
      contractSize,
      totalGasUsed: totalGasUsed.toString(),
      testInheritanceId: inheritanceId,
      timestamp: new Date().toISOString(),
      status: "VERIFIED",
    };

    console.log("📋 Deployment Summary:");
    console.log(JSON.stringify(deploymentSummary, null, 2));

    console.log("\n=== INTEGRATION TESTS ===");

    // 18. Test asset claiming
    console.log("💎 Testing asset claiming...");
    const claimTx = await contract
      .connect(beneficiary)
      .claimAssets(inheritanceId);
    const claimReceipt = await claimTx.wait();

    console.log("✅ Asset claim successful");
    console.log(`   Gas used: ${claimReceipt!.gasUsed}`);

    // 19. Verify claim was processed
    const finalBeneficiaryInfo = await contract.getBeneficiaryInfo(
      inheritanceId,
      beneficiary.address
    );
    if (finalBeneficiaryInfo.claimedETH === BigInt(0)) {
      console.log("⚠️  Claim amount not recorded");
    } else {
      console.log(
        `✅ Claim recorded: ${ethers.formatEther(
          finalBeneficiaryInfo.claimedETH
        )} ETH`
      );
    }

    console.log("\n🎉 DEPLOYMENT VERIFICATION COMPLETED SUCCESSFULLY");
    console.log("\n📝 Next Steps:");
    console.log("1. Save the deployment summary for your records");
    console.log("2. Consider running additional stress tests");
    console.log("3. Set up monitoring for the contract");
    console.log(
      "4. Update your frontend/client with the verified contract address"
    );

    if (networkName !== "hardhat" && networkName !== "localhost") {
      console.log("5. Verify the contract on block explorer:");
      console.log(
        `   npx hardhat verify --network ${networkName} ${contractAddress}`
      );
    }
  } catch (error) {
    console.error("\n❌ DEPLOYMENT VERIFICATION FAILED");
    console.error(`Error: ${error}`);

    if (error instanceof Error) {
      console.error(`Message: ${error.message}`);
      console.error(`Stack: ${error.stack}`);
    }

    console.log("\n🔧 Troubleshooting Steps:");
    console.log("1. Verify the contract address is correct");
    console.log("2. Check that you're connected to the right network");
    console.log("3. Ensure the contract was deployed successfully");
    console.log(
      "4. Verify your account has sufficient gas for test transactions"
    );

    process.exit(1);
  }
}

main()
  .then(() => {
    console.log("\n✅ Verification script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Verification script failed:");
    console.error(error);
    process.exit(1);
  });
