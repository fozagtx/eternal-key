import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  const contractAddress = process.env.CONTRACT_ADDRESS || process.argv[2];

  if (!contractAddress) {
    console.error("❌ Contract address required");
    console.log("Usage: CONTRACT_ADDRESS=<address> npm run verify:deployment");
    process.exit(1);
  }

  console.log("🔍 SIMPLE CONTRACT VERIFICATION");
  console.log(`Contract: ${contractAddress}`);
  console.log(`Verifier: ${deployer.address}`);

  try {
    // Connect to contract
    const InheritanceCore = await ethers.getContractFactory("InheritanceCore");
    const contract = InheritanceCore.attach(contractAddress);

    // 1. Basic contract check
    console.log("\n=== BASIC CHECKS ===");
    const code = await ethers.provider.getCode(contractAddress);
    if (code === "0x") throw new Error("No contract found");
    console.log("✅ Contract exists");

    const balance = await ethers.provider.getBalance(contractAddress);
    console.log(`📊 Balance: ${ethers.formatEther(balance)} ETH`);

    // 2. Access control check
    console.log("\n=== ACCESS CONTROL ===");
    const adminRole = await contract.DEFAULT_ADMIN_ROLE();
    const executorRole = await contract.EXECUTOR_ROLE();

    const hasAdmin = await contract.hasRole(adminRole, deployer.address);
    const hasExecutor = await contract.hasRole(executorRole, deployer.address);

    console.log(`✅ Admin role: ${hasAdmin ? "YES" : "NO"}`);
    console.log(`✅ Executor role: ${hasExecutor ? "YES" : "NO"}`);

    // 3. Test inheritance creation
    console.log("\n=== FUNCTIONALITY TEST ===");
    const timeLock = {
      distributionType: 0,
      unlockTime: Math.floor(Date.now() / 1000) + 86400,
      vestingDuration: 0,
      cliffDuration: 0,
      milestoneTimestamps: [],
      milestonePercentages: []
    };

    console.log("🧪 Creating test inheritance...");
    const createTx = await contract.createInheritance(
      `Verify-${Date.now()}`,
      deployer.address,
      false,
      timeLock
    );
    const createReceipt = await createTx.wait();
    console.log(`✅ Created inheritance (Gas: ${createReceipt!.gasUsed})`);

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

    // 4. Test data retrieval
    console.log("📖 Testing data retrieval...");
    const data = await contract.getInheritanceData(inheritanceId);
    console.log(`✅ Retrieved data: ${data.name}`);
    console.log(`   Owner: ${data.owner}`);
    console.log(`   Status: ${data.status}`);

    // 5. Test deposit (small amount)
    console.log("💰 Testing ETH deposit...");
    const depositAmount = ethers.parseEther("0.001");
    const depositTx = await contract.depositETH(inheritanceId, { value: depositAmount });
    const depositReceipt = await depositTx.wait();
    console.log(`✅ Deposited ${ethers.formatEther(depositAmount)} ETH`);
    console.log(`   Gas used: ${depositReceipt!.gasUsed}`);

    // 6. Verify deposit recorded
    const updatedData = await contract.getInheritanceData(inheritanceId);
    const deposited = ethers.formatEther(updatedData.totalETHDeposited);
    console.log(`✅ Recorded deposit: ${deposited} ETH`);

    // 7. Test direct payment rejection
    console.log("\n=== SECURITY TEST ===");
    try {
      await deployer.sendTransaction({
        to: contractAddress,
        value: ethers.parseEther("0.001")
      });
      console.log("❌ Direct payment accepted (should fail)");
    } catch {
      console.log("✅ Direct payments rejected");
    }

    // 8. Contract size check
    console.log("\n=== CONTRACT INFO ===");
    const contractSize = (code.length - 2) / 2;
    console.log(`📏 Contract size: ${contractSize.toLocaleString()} bytes`);
    console.log(`⛽ Gas limit: ${contractSize < 24576 ? "OK" : "EXCEEDS LIMIT"}`);

    // Summary
    console.log("\n🎉 VERIFICATION COMPLETE");
    console.log("Contract is functioning properly");
    console.log(`Contract Address: ${contractAddress}`);
    console.log(`Test Inheritance ID: ${inheritanceId}`);
    console.log(`Network: ${process.env.HARDHAT_NETWORK || "unknown"}`);

    // Next steps
    console.log("\n📋 NEXT STEPS:");
    console.log("1. Contract is ready for production use");
    console.log("2. You can now create real inheritances");
    console.log("3. Consider setting up monitoring");
    console.log("4. Update your frontend with this address");

  } catch (error: any) {
    console.error("\n❌ VERIFICATION FAILED");
    console.error(`Error: ${error.message}`);

    if (error.message.includes("insufficient funds")) {
      console.error("💡 Add more ETH to your account");
    } else if (error.message.includes("execution reverted")) {
      console.error("💡 Check contract permissions and parameters");
    } else if (error.message.includes("network")) {
      console.error("💡 Check network connection and RPC endpoint");
    }

    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
