const { ethers } = require("hardhat");

async function main() {
  const contractAddress = "0x5A6F859b3fB59eaA91F02FDE8833DD47d79B394B";
  const [signer] = await ethers.getSigners();
  const ownerAddress = await signer.getAddress();
  const beneficiaryAddress = "0x0000000000000000000000000000000000000001"; // Example address

  console.log("=== CLAIMING EMPTY EXPIRED SWITCH ===");
  console.log("Contract Address:", contractAddress);
  console.log("Owner Address:", ownerAddress);
  console.log("Beneficiary Address:", beneficiaryAddress);

  const InheritanceCore = await ethers.getContractFactory("InheritanceCore");
  const contract = InheritanceCore.attach(contractAddress);

  try {
    // Check switch status
    const switchData = await contract.getSwitch({ from: ownerAddress });
    console.log("Switch Data:");
    console.log("- Owner:", switchData.owner);
    console.log("- Beneficiary:", switchData.beneficiary);
    console.log("- Balance:", ethers.formatEther(switchData.balance), "STT");
    console.log("- Status:", switchData.status.toString());
    console.log(
      "- Deadline:",
      new Date(Number(switchData.deadline) * 1000).toISOString()
    );

    const isExpired = await contract.isDeadlineExpired({ from: ownerAddress });
    console.log("- Expired:", isExpired);

    if (!isExpired) {
      console.log("❌ Switch not expired - cannot claim yet");
      return;
    }

    if (switchData.balance === 0n) {
      console.log(
        "⚠️  Empty switch (0 balance) - but still need to claim to clear it"
      );
    }

    console.log("\n=== ATTEMPTING CLAIM ===");
    console.log(
      "NOTE: This needs to be called by the beneficiary, not the owner"
    );
    console.log(
      "Since we don't have the beneficiary's private key, this might fail"
    );

    // Try to call claim (this will likely fail since we don't have beneficiary's key)
    try {
      // This is just a simulation - in real scenario, beneficiary would need to call this
      const tx = await contract.claim({ from: beneficiaryAddress });
      console.log("Claim transaction:", tx.hash);

      const receipt = await tx.wait();
      console.log("✅ Claim successful!");
      console.log("- Block:", receipt.blockNumber);

      // Check new status
      const newSwitchData = await contract.getSwitch({ from: ownerAddress });
      console.log("New Status:", newSwitchData.status.toString());
    } catch (claimError) {
      console.log(
        "❌ Claim failed (expected - we don't have beneficiary's private key)"
      );
      console.log("Error:", claimError.message);

      console.log("\n🔥 SOLUTION OPTIONS:");
      console.log("1. Wait for the beneficiary to claim (even if 0 balance)");
      console.log("2. Import beneficiary's private key to claim");
      console.log("3. Deploy a new contract (if this is for testing)");
      console.log("4. Add an admin function to reset expired empty switches");
    }
  } catch (error) {
    console.log("❌ Error:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });
