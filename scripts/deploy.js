const hre = require("hardhat");

async function main() {
  console.log("Deploying InheritanceSystem to Somnia Testnet...");

  // Get the ContractFactory and Signers here.
  const [deployer] = await hre.ethers.getSigners();
  
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

  // Deploy the contract
  const InheritanceSystem = await hre.ethers.getContractFactory("InheritanceSystem");
  const inheritanceSystem = await InheritanceSystem.deploy();

  await inheritanceSystem.waitForDeployment();

  const contractAddress = await inheritanceSystem.getAddress();
  
  console.log("InheritanceSystem deployed to:", contractAddress);
  console.log("Transaction hash:", inheritanceSystem.deploymentTransaction().hash);
  
  // Save the contract address and ABI
  const fs = require('fs');
  const contractData = {
    address: contractAddress,
    network: "somnia",
    chainId: 50312,
    abi: InheritanceSystem.interface.format('json')
  };
  
  // Create lib directory if it doesn't exist
  if (!fs.existsSync('lib')) {
    fs.mkdirSync('lib');
  }
  
  fs.writeFileSync(
    'lib/contract-address.json',
    JSON.stringify(contractData, null, 2)
  );
  
  console.log("Contract data saved to lib/contract-address.json");
  
  // Wait for a few block confirmations before verification
  console.log("Waiting for block confirmations...");
  await inheritanceSystem.deploymentTransaction().wait(5);
  
  // Verify the contract on the block explorer
  try {
    console.log("Verifying contract on block explorer...");
    await hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: [],
    });
    console.log("Contract verified successfully!");
  } catch (error) {
    console.log("Contract verification failed:", error.message);
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });