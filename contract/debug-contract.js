const { ethers } = require("hardhat");

async function main() {
  const contractAddress = "0x1ED0dC9B80B9396b3D82BC2723f2539a83b96789"; // Latest deployment
  const [signer] = await ethers.getSigners();

  console.log("=== CONTRACT DEBUG ===");
  console.log("Contract Address:", contractAddress);
  console.log("Signer Address:", await signer.getAddress());
  console.log("Network:", await ethers.provider.getNetwork());

  // Check if contract exists
  const code = await ethers.provider.getCode(contractAddress);
  console.log("Contract Code Length:", code.length);
  console.log("Contract Exists:", code !== "0x");

  if (code === "0x") {
    console.log("❌ CONTRACT NOT DEPLOYED AT THIS ADDRESS!");
    return;
  }

  // Try to interact with the contract
  const InheritanceCore = await ethers.getContractFactory("InheritanceCore");
  const contract = InheritanceCore.attach(contractAddress);

  try {
    // Test a read function first
    console.log("\n=== TESTING READ FUNCTIONS ===");

    const switchData = await contract.getSwitch({ from: signer.address });
    console.log("Switch Data:", switchData);
  } catch (error) {
    console.log("❌ Read Error:", error.message);

    // Check if it's an ABI mismatch
    if (error.message.includes("execution reverted")) {
      console.log("Contract may not have getSwitch function - ABI mismatch?");
    }
  }

  try {
    console.log("\n=== TESTING INITIALIZE FUNCTION ===");

    // Test args - using dynamic values
    const beneficiary = "0x0000000000000000000000000000000000000001"; // Example address
    const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
    const sender = await signer.getAddress(); // Dynamic sender address

    console.log("Args:");
    console.log("- Beneficiary:", beneficiary);
    console.log(
      "- Deadline:",
      deadline,
      "(timestamp:",
      new Date(deadline * 1000).toISOString(),
      ")"
    );
    console.log("- Sender:", sender);
    console.log("- Current Time:", Math.floor(Date.now() / 1000));
    console.log(
      "- Deadline is in future:",
      deadline > Math.floor(Date.now() / 1000)
    );

    // Try static call first (doesn't execute, just simulates)
    const result = await contract.initialize.staticCall(beneficiary, deadline);
    console.log("✅ Static call succeeded:", result);

    // If static call works, the issue is likely gas or state
    console.log("\n=== CHECKING STATE ===");

    // Check if switch already exists
    try {
      const existingSwitch = await contract.getSwitch();
      console.log("Existing switch:", existingSwitch);
      if (
        existingSwitch.owner !== "0x0000000000000000000000000000000000000000"
      ) {
        console.log("❌ SWITCH ALREADY EXISTS - owner:", existingSwitch.owner);
        console.log("You must call cancel() first!");
      }
    } catch (e) {
      console.log("No existing switch found");
    }
  } catch (error) {
    console.log("❌ Initialize Error:", error);

    // Decode the error if possible
    if (error.data) {
      try {
        const decodedError = contract.interface.parseError(error.data);
        console.log("Decoded Error:", decodedError);
      } catch (decodeError) {
        console.log("Could not decode error data:", error.data);
      }
    }

    if (error.reason) {
      console.log("Error Reason:", error.reason);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });
