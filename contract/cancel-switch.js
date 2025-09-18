const { ethers } = require("hardhat");

async function main() {
  const contractAddress = "0x1ED0dC9B80B9396b3D82BC2723f2539a83b96789";
  const [signer] = await ethers.getSigners();

  console.log("=== CANCELING EXPIRED SWITCH ===");
  console.log("Contract Address:", contractAddress);
  console.log("Signer Address:", await signer.getAddress());

  const InheritanceCore = await ethers.getContractFactory("InheritanceCore");
  const contract = InheritanceCore.attach(contractAddress);

  try {
    // Check current state
    const switchData = await contract.getSwitch();
    console.log(
      "Current balance:",
      ethers.formatEther(switchData.balance),
      "STT"
    );
    console.log("Status:", switchData.status.toString());
    console.log("Deadline expired:", await contract.isDeadlineExpired());

    // Cancel the switch
    console.log("\nCanceling switch...");
    const tx = await contract.cancel();
    console.log("Transaction sent:", tx.hash);

    const receipt = await tx.wait();
    console.log("✅ Switch canceled successfully!");
    console.log("Block:", receipt.blockNumber);
    console.log("Gas used:", receipt.gasUsed.toString());

    // Check new state
    const newSwitchData = await contract.getSwitch();
    console.log("\nNew switch state:");
    console.log("Owner:", newSwitchData.owner);
    console.log("Status:", newSwitchData.status.toString());
  } catch (error) {
    console.log("❌ Error:", error.message);
    if (error.reason) {
      console.log("Reason:", error.reason);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });
