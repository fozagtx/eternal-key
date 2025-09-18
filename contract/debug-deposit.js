const { ethers } = require("hardhat");

async function main() {
  const contractAddress = "0x1ED0dC9B80B9396b3D82BC2723f2539a83b96789";
  const [signer] = await ethers.getSigners();

  console.log("=== DEPOSIT DEBUG ===");
  console.log("Contract Address:", contractAddress);
  console.log("Signer Address:", await signer.getAddress());

  const InheritanceCore = await ethers.getContractFactory("InheritanceCore");
  const contract = InheritanceCore.attach(contractAddress);

  try {
    // Check current switch state
    console.log("\n=== CURRENT SWITCH STATE ===");
    const switchData = await contract.getSwitch();
    console.log("Owner:", switchData.owner);
    console.log("Beneficiary:", switchData.beneficiary);
    console.log("Deadline:", switchData.deadline.toString());
    console.log("Balance:", ethers.formatEther(switchData.balance), "STT");
    console.log("Status:", switchData.status.toString());
    console.log("Deadline Expired:", await contract.isDeadlineExpired());

    // Check if deadline is in the future
    const currentTime = Math.floor(Date.now() / 1000);
    const deadline = Number(switchData.deadline);
    console.log("Current Time:", currentTime);
    console.log("Deadline Time:", deadline);
    console.log("Time until deadline:", deadline - currentTime, "seconds");

    if (deadline <= currentTime) {
      console.log("❌ DEADLINE HAS EXPIRED!");
      console.log("You cannot deposit to an expired switch.");
      console.log("The beneficiary can now claim the funds.");
      return;
    }

    // Test deposit
    console.log("\n=== TESTING DEPOSIT ===");
    const depositAmount = ethers.parseEther("10.01");
    console.log("Deposit Amount:", ethers.formatEther(depositAmount), "STT");

    // Static call first to check for errors
    try {
      await contract.deposit.staticCall({ value: depositAmount });
      console.log("✅ Deposit static call succeeded");
    } catch (error) {
      console.log("❌ Deposit would fail:", error.message);

      // Try to decode the error
      if (error.data) {
        try {
          const decodedError = contract.interface.parseError(error.data);
          console.log("Decoded Error:", decodedError);
        } catch (decodeError) {
          console.log("Could not decode error data:", error.data);
        }
      }
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
