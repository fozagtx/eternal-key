const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying InheritanceCore with account:", deployer.address);
  console.log(
    "Account balance:",
    ethers.formatEther(await deployer.provider.getBalance(deployer.address))
  );

  // Deploy the InheritanceCore contract
  const InheritanceCore = await ethers.getContractFactory("InheritanceCore");

  console.log("\nDeploying InheritanceCore...");
  const inheritanceCore = await InheritanceCore.deploy();

  await inheritanceCore.waitForDeployment();

  console.log(
    "InheritanceCore deployed to:",
    await inheritanceCore.getAddress()
  );

  // Verify the contract has the correct initial state
  const DEFAULT_ADMIN_ROLE = await inheritanceCore.DEFAULT_ADMIN_ROLE();
  const EXECUTOR_ROLE = await inheritanceCore.EXECUTOR_ROLE();

  console.log("\nVerifying initial state...");
  console.log("Default Admin Role:", DEFAULT_ADMIN_ROLE);
  console.log("Executor Role:", EXECUTOR_ROLE);
  console.log(
    "Deployer has admin role:",
    await inheritanceCore.hasRole(DEFAULT_ADMIN_ROLE, deployer.address)
  );
  console.log(
    "Deployer has executor role:",
    await inheritanceCore.hasRole(EXECUTOR_ROLE, deployer.address)
  );

  console.log("\nDeployment completed successfully!");
  console.log("Remember to:");
  console.log("1. Verify the contract on the block explorer");
  console.log("2. Grant additional roles if needed");
  console.log("3. Test the contract functionality");
  console.log("4. Begin migration process if replacing existing contract");

  return inheritanceCore.getAddress();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
