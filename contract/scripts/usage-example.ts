import { ethers } from "hardhat";

async function main() {
  const [owner, beneficiary1, beneficiary2, executor] = await ethers.getSigners();

  // Replace with your deployed contract address
  const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "0xFaD7d4FE0599991aF00E75c08A4bC4405D28DD12";

  console.log("🚀 INHERITANCE CONTRACT USAGE EXAMPLE");
  console.log(`Contract: ${CONTRACT_ADDRESS}`);
  console.log(`Owner: ${owner.address}`);
  console.log(`Beneficiary 1: ${beneficiary1.address}`);
  console.log(`Beneficiary 2: ${beneficiary2.address}`);
  console.log(`Executor: ${executor.address}`);

  try {
    // Connect to deployed contract
    const InheritanceCore = await ethers.getContractFactory("InheritanceCore");
    const contract = InheritanceCore.attach(CONTRACT_ADDRESS);

    console.log("\n=== STEP 1: CREATE INHERITANCE ===");

    // Create inheritance with linear vesting over 30 days
    const timeLock = {
      distributionType: 1, // LINEAR_VESTING
      unlockTime: Math.floor(Date.now() / 1000) + 86400, // 1 day from now
      vestingDuration: 30 * 86400, // 30 days
      cliffDuration: 7 * 86400, // 7 day cliff
      milestoneTimestamps: [],
      milestonePercentages: []
    };

    const createTx = await contract.createInheritance(
      "Family Trust Fund",
      executor.address,
      false, // No confirmation required
      timeLock
    );

    const createReceipt = await createTx.wait();
    console.log(`✅ Inheritance created`);
    console.log(`   Transaction: ${createTx.hash}`);
    console.log(`   Gas used: ${createReceipt!.gasUsed}`);

    // Get inheritance ID from event
    let inheritanceId = 0;
    for (const log of createReceipt!.logs) {
      try {
        const parsed = contract.interface.parseLog(log);
        if (parsed?.name === "InheritanceCreated") {
          inheritanceId = Number(parsed.args[0]);
          break;
        }
      } catch {}
    }

    console.log(`   Inheritance ID: ${inheritanceId}`);

    console.log("\n=== STEP 2: ADD BENEFICIARIES ===");

    // Add first beneficiary (60% allocation)
    const addBen1Tx = await contract.addBeneficiary(
      inheritanceId,
      beneficiary1.address,
      6000 // 60% in basis points
    );
    await addBen1Tx.wait();
    console.log(`✅ Added beneficiary 1: 60% allocation`);

    // Add second beneficiary (40% allocation)
    const addBen2Tx = await contract.addBeneficiary(
      inheritanceId,
      beneficiary2.address,
      4000 // 40% in basis points
    );
    await addBen2Tx.wait();
    console.log(`✅ Added beneficiary 2: 40% allocation`);

    console.log("\n=== STEP 3: DEPOSIT ASSETS ===");

    // Deposit ETH
    const depositAmount = ethers.parseEther("2.0"); // 2 ETH
    const depositTx = await contract.depositETH(inheritanceId, {
      value: depositAmount
    });
    const depositReceipt = await depositTx.wait();

    console.log(`✅ Deposited ${ethers.formatEther(depositAmount)} ETH`);
    console.log(`   Transaction: ${depositTx.hash}`);
    console.log(`   Gas used: ${depositReceipt!.gasUsed}`);

    // Verify deposit
    const inheritanceData = await contract.getInheritanceData(inheritanceId);
    console.log(`   Total deposited: ${ethers.formatEther(inheritanceData.totalETHDeposited)} ETH`);

    console.log("\n=== STEP 4: CHECK BENEFICIARY INFO ===");

    const ben1Info = await contract.getBeneficiaryInfo(inheritanceId, beneficiary1.address);
    const ben2Info = await contract.getBeneficiaryInfo(inheritanceId, beneficiary2.address);

    console.log(`📊 Beneficiary 1:`);
    console.log(`   Address: ${ben1Info.wallet}`);
    console.log(`   Allocation: ${ben1Info.allocationBasisPoints / 100}%`);
    console.log(`   Active: ${ben1Info.isActive}`);

    console.log(`📊 Beneficiary 2:`);
    console.log(`   Address: ${ben2Info.wallet}`);
    console.log(`   Allocation: ${ben2Info.allocationBasisPoints / 100}%`);
    console.log(`   Active: ${ben2Info.isActive}`);

    console.log("\n=== STEP 5: TRIGGER INHERITANCE ===");

    // Trigger inheritance (can be done by owner or executor)
    const triggerTx = await contract.connect(executor).triggerInheritance(inheritanceId);
    const triggerReceipt = await triggerTx.wait();

    console.log(`✅ Inheritance triggered by executor`);
    console.log(`   Transaction: ${triggerTx.hash}`);
    console.log(`   Gas used: ${triggerReceipt!.gasUsed}`);

    // Check updated status
    const updatedData = await contract.getInheritanceData(inheritanceId);
    console.log(`   Status: ${updatedData.status} (1 = TRIGGERED)`);
    console.log(`   Triggered at: ${new Date(Number(updatedData.triggeredAt) * 1000).toISOString()}`);

    console.log("\n=== STEP 6: CHECK CLAIMABLE AMOUNTS ===");

    const claimable1 = await contract.getClaimableETH(inheritanceId, beneficiary1.address);
    const claimable2 = await contract.getClaimableETH(inheritanceId, beneficiary2.address);

    console.log(`💰 Immediately claimable amounts:`);
    console.log(`   Beneficiary 1: ${ethers.formatEther(claimable1)} ETH`);
    console.log(`   Beneficiary 2: ${ethers.formatEther(claimable2)} ETH`);

    if (claimable1 === BigInt(0)) {
      console.log(`   ⏳ Note: Amounts are 0 due to 7-day cliff period`);
      console.log(`   💡 Assets will vest linearly over 30 days after cliff`);
    }

    console.log("\n=== STEP 7: DEMONSTRATE CLAIM (if available) ===");

    if (claimable1 > 0) {
      // Get initial balance
      const initialBalance = await ethers.provider.getBalance(beneficiary1.address);

      // Claim assets
      const claimTx = await contract.connect(beneficiary1).claimAssets(inheritanceId);
      const claimReceipt = await claimTx.wait();

      // Calculate net received (accounting for gas)
      const finalBalance = await ethers.provider.getBalance(beneficiary1.address);
      const gasUsed = claimReceipt!.gasUsed * claimTx.gasPrice!;
      const netReceived = finalBalance - initialBalance + gasUsed;

      console.log(`✅ Beneficiary 1 claimed assets`);
      console.log(`   Net received: ${ethers.formatEther(netReceived)} ETH`);
      console.log(`   Gas cost: ${ethers.formatEther(gasUsed)} ETH`);
    }

    console.log("\n=== FINAL STATUS ===");

    const finalData = await contract.getInheritanceData(inheritanceId);
    const finalBen1 = await contract.getBeneficiaryInfo(inheritanceId, beneficiary1.address);
    const finalBen2 = await contract.getBeneficiaryInfo(inheritanceId, beneficiary2.address);

    console.log(`📈 Inheritance Summary:`);
    console.log(`   Total Deposited: ${ethers.formatEther(finalData.totalETHDeposited)} ETH`);
    console.log(`   Total Claimed: ${ethers.formatEther(finalData.totalETHClaimed)} ETH`);
    console.log(`   Status: ${finalData.status}`);
    console.log(`   Ben1 Claimed: ${ethers.formatEther(finalBen1.claimedETH)} ETH`);
    console.log(`   Ben2 Claimed: ${ethers.formatEther(finalBen2.claimedETH)} ETH`);

    console.log("\n🎉 EXAMPLE COMPLETED SUCCESSFULLY!");
    console.log("\n📚 Key Takeaways:");
    console.log("1. Inheritances must be triggered before claims");
    console.log("2. Vesting schedules control when assets become available");
    console.log("3. Beneficiaries can claim their allocated percentages");
    console.log("4. All operations emit events for tracking");
    console.log("5. Gas costs vary by operation complexity");

    console.log("\n🔧 Production Tips:");
    console.log("1. Use realistic vesting periods (months/years)");
    console.log("2. Set appropriate cliff periods for your use case");
    console.log("3. Consider multi-signature wallets for executors");
    console.log("4. Monitor contract events for activity");
    console.log("5. Test thoroughly before depositing large amounts");

  } catch (error: any) {
    console.error("\n❌ EXAMPLE FAILED");
    console.error(`Error: ${error.message}`);

    if (error.message.includes("Cannot add self as beneficiary")) {
      console.error("💡 Owners cannot be beneficiaries - use different addresses");
    } else if (error.message.includes("Only inheritance owner allowed")) {
      console.error("💡 Only the inheritance owner can perform this action");
    } else if (error.message.includes("Total allocation exceeds 100%")) {
      console.error("💡 Beneficiary allocations must not exceed 100% total");
    } else if (error.message.includes("Inheritance not triggered")) {
      console.error("💡 Inheritance must be triggered before claiming");
    }

    process.exit(1);
  }
}

main()
  .then(() => {
    console.log("\n✅ Usage example completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Unexpected error:", error);
    process.exit(1);
  });
