const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("InheritanceCore - Real Contract Tests", function () {
  let inheritanceCore;
  let owner;
  let executor;
  let beneficiary1;
  let beneficiary2;
  let addrs;

  // Test constants
  const IMMEDIATE_DISTRIBUTION = 0;
  const LINEAR_VESTING = 1;
  const CLIFF_VESTING = 2;
  const MILESTONE_BASED = 3;

  const STT_ASSET = 0;
  const ERC20_ASSET = 1;
  const ERC721_ASSET = 2;

  const ACTIVE = 0;
  const TRIGGERED = 1;
  const COMPLETED = 2;

  beforeEach(async function () {
    [owner, executor, beneficiary1, beneficiary2, ...addrs] =
      await ethers.getSigners();

    // Deploy InheritanceCore
    const InheritanceCore = await ethers.getContractFactory("InheritanceCore");
    inheritanceCore = await InheritanceCore.deploy();

    console.log("✅ InheritanceCore deployed successfully for testing");
  });

  describe("Core Functionality Tests", function () {
    it("Should deploy with correct initial state", async function () {
      const DEFAULT_ADMIN_ROLE = await inheritanceCore.DEFAULT_ADMIN_ROLE();
      const EXECUTOR_ROLE = await inheritanceCore.EXECUTOR_ROLE();

      expect(await inheritanceCore.hasRole(DEFAULT_ADMIN_ROLE, owner.address))
        .to.be.true;
      expect(await inheritanceCore.hasRole(EXECUTOR_ROLE, owner.address)).to.be
        .true;

      console.log("✅ Contract deployed with correct roles");
    });

    it("Should create inheritance with STT deposit", async function () {
      const timeLock = {
        distributionType: IMMEDIATE_DISTRIBUTION,
        unlockTime: (await time.latest()) + 60, // 1 minute from now
        vestingDuration: 0,
        cliffDuration: 0,
        milestoneTimestamps: [],
        milestonePercentages: [],
      };

      // Create inheritance
      const tx = await inheritanceCore.createInheritance(
        executor.address,
        false,
        timeLock
      );

      const receipt = await tx.wait();
      const inheritanceId = 0; // First inheritance

      // Verify inheritance was created
      const inheritanceData = await inheritanceCore.getInheritanceData(
        inheritanceId
      );
      expect(inheritanceData.owner).to.equal(owner.address);
      expect(inheritanceData.executor).to.equal(executor.address);
      expect(inheritanceData.status).to.equal(ACTIVE);

      console.log("✅ Inheritance created successfully");
      console.log(`   - Inheritance ID: ${inheritanceId}`);
      console.log(`   - Owner: ${inheritanceData.owner}`);
      console.log(`   - Executor: ${inheritanceData.executor}`);
    });

    it("Should add beneficiaries to inheritance", async function () {
      const timeLock = {
        distributionType: IMMEDIATE_DISTRIBUTION,
        unlockTime: (await time.latest()) + 60,
        vestingDuration: 0,
        cliffDuration: 0,
        milestoneTimestamps: [],
        milestonePercentages: [],
      };

      // Create inheritance
      await inheritanceCore.createInheritance(
        executor.address,
        false,
        timeLock
      );
      const inheritanceId = 0;

      // Add beneficiaries
      await inheritanceCore.addBeneficiary(
        inheritanceId,
        beneficiary1.address,
        5000
      ); // 50%
      await inheritanceCore.addBeneficiary(
        inheritanceId,
        beneficiary2.address,
        5000
      ); // 50%

      // Verify beneficiaries
      const ben1 = await inheritanceCore.getBeneficiaryInfo(
        inheritanceId,
        beneficiary1.address
      );
      const ben2 = await inheritanceCore.getBeneficiaryInfo(
        inheritanceId,
        beneficiary2.address
      );

      expect(ben1.isActive).to.be.true;
      expect(ben1.allocationBasisPoints).to.equal(5000);
      expect(ben2.isActive).to.be.true;
      expect(ben2.allocationBasisPoints).to.equal(5000);

      console.log("✅ Beneficiaries added successfully");
      console.log(
        `   - Beneficiary 1: ${ben1.wallet} (${ben1.allocationBasisPoints} basis points)`
      );
      console.log(
        `   - Beneficiary 2: ${ben2.wallet} (${ben2.allocationBasisPoints} basis points)`
      );
    });

    it("Should deposit STT and track balances", async function () {
      const timeLock = {
        distributionType: IMMEDIATE_DISTRIBUTION,
        unlockTime: (await time.latest()) + 60,
        vestingDuration: 0,
        cliffDuration: 0,
        milestoneTimestamps: [],
        milestonePercentages: [],
      };

      // Create inheritance and add beneficiary
      await inheritanceCore.createInheritance(
        executor.address,
        false,
        timeLock
      );
      const inheritanceId = 0;
      await inheritanceCore.addBeneficiary(
        inheritanceId,
        beneficiary1.address,
        10000
      ); // 100%

      // Deposit STT (native ETH in testnet)
      const depositAmount = ethers.parseEther("1.0");
      await inheritanceCore.depositSTT(inheritanceId, { value: depositAmount });

      // Verify deposit
      const inheritanceData = await inheritanceCore.getInheritanceData(
        inheritanceId
      );
      expect(inheritanceData.totalSTTDeposited).to.equal(depositAmount);

      console.log("✅ STT deposited successfully");
      console.log(
        `   - Amount deposited: ${ethers.formatEther(depositAmount)} STT`
      );
      console.log(
        `   - Contract balance: ${ethers.formatEther(
          inheritanceData.totalSTTDeposited
        )} STT`
      );
    });

    it("Should trigger inheritance and allow claims", async function () {
      const timeLock = {
        distributionType: IMMEDIATE_DISTRIBUTION,
        unlockTime: (await time.latest()) + 5, // 5 seconds
        vestingDuration: 0,
        cliffDuration: 0,
        milestoneTimestamps: [],
        milestonePercentages: [],
      };

      // Setup inheritance
      await inheritanceCore.createInheritance(
        executor.address,
        false,
        timeLock
      );
      const inheritanceId = 0;
      await inheritanceCore.addBeneficiary(
        inheritanceId,
        beneficiary1.address,
        10000
      );

      const depositAmount = ethers.parseEther("1.0");
      await inheritanceCore.depositSTT(inheritanceId, { value: depositAmount });

      // Trigger inheritance
      await inheritanceCore.triggerInheritance(inheritanceId);

      // Wait for unlock time
      await time.increase(10);

      // Check claimable amount
      const claimableAmount = await inheritanceCore.getClaimableSTT(
        inheritanceId,
        beneficiary1.address
      );
      expect(claimableAmount).to.equal(depositAmount);

      console.log("✅ Inheritance triggered and ready for claims");
      console.log(
        `   - Claimable amount: ${ethers.formatEther(claimableAmount)} STT`
      );

      // Record beneficiary balance before claim
      const balanceBefore = await ethers.provider.getBalance(
        beneficiary1.address
      );

      // Claim assets
      const claimTx = await inheritanceCore
        .connect(beneficiary1)
        .claimAssets(inheritanceId);
      await claimTx.wait();

      // Verify claim
      const balanceAfter = await ethers.provider.getBalance(
        beneficiary1.address
      );
      const balanceIncrease = balanceAfter - balanceBefore;

      // Account for gas costs - the increase should be close to deposit amount minus gas
      expect(balanceIncrease).to.be.greaterThan(ethers.parseEther("0.9")); // Allow for gas costs

      console.log("✅ Assets claimed successfully");
      console.log(
        `   - Balance increase: ${ethers.formatEther(balanceIncrease)} STT`
      );
    });

    it("Should handle multiple beneficiaries correctly", async function () {
      const timeLock = {
        distributionType: IMMEDIATE_DISTRIBUTION,
        unlockTime: (await time.latest()) + 5,
        vestingDuration: 0,
        cliffDuration: 0,
        milestoneTimestamps: [],
        milestonePercentages: [],
      };

      // Setup inheritance with multiple beneficiaries
      await inheritanceCore.createInheritance(
        executor.address,
        false,
        timeLock
      );
      const inheritanceId = 0;

      await inheritanceCore.addBeneficiary(
        inheritanceId,
        beneficiary1.address,
        6000
      ); // 60%
      await inheritanceCore.addBeneficiary(
        inheritanceId,
        beneficiary2.address,
        4000
      ); // 40%

      const depositAmount = ethers.parseEther("10.0");
      await inheritanceCore.depositSTT(inheritanceId, { value: depositAmount });

      // Trigger and wait
      await inheritanceCore.triggerInheritance(inheritanceId);
      await time.increase(10);

      // Check claimable amounts
      const claimable1 = await inheritanceCore.getClaimableSTT(
        inheritanceId,
        beneficiary1.address
      );
      const claimable2 = await inheritanceCore.getClaimableSTT(
        inheritanceId,
        beneficiary2.address
      );

      expect(claimable1).to.equal(ethers.parseEther("6.0")); // 60%
      expect(claimable2).to.equal(ethers.parseEther("4.0")); // 40%

      console.log("✅ Multiple beneficiaries handled correctly");
      console.log(
        `   - Beneficiary 1 claimable: ${ethers.formatEther(
          claimable1
        )} STT (60%)`
      );
      console.log(
        `   - Beneficiary 2 claimable: ${ethers.formatEther(
          claimable2
        )} STT (40%)`
      );
    });

    it("Should enforce access controls", async function () {
      const timeLock = {
        distributionType: IMMEDIATE_DISTRIBUTION,
        unlockTime: (await time.latest()) + 60,
        vestingDuration: 0,
        cliffDuration: 0,
        milestoneTimestamps: [],
        milestonePercentages: [],
      };

      await inheritanceCore.createInheritance(
        executor.address,
        false,
        timeLock
      );
      const inheritanceId = 0;

      // Non-owner should not be able to add beneficiaries
      await expect(
        inheritanceCore
          .connect(beneficiary1)
          .addBeneficiary(inheritanceId, beneficiary2.address, 5000)
      ).to.be.revertedWith("Only inheritance owner allowed");

      // Non-owner should not be able to deposit STT
      await expect(
        inheritanceCore
          .connect(beneficiary1)
          .depositSTT(inheritanceId, { value: ethers.parseEther("1.0") })
      ).to.be.revertedWith("Only inheritance owner allowed");

      console.log("✅ Access controls working correctly");
    });

    it("Should validate allocations don't exceed 100%", async function () {
      const timeLock = {
        distributionType: IMMEDIATE_DISTRIBUTION,
        unlockTime: (await time.latest()) + 60,
        vestingDuration: 0,
        cliffDuration: 0,
        milestoneTimestamps: [],
        milestonePercentages: [],
      };

      await inheritanceCore.createInheritance(
        executor.address,
        false,
        timeLock
      );
      const inheritanceId = 0;

      // Add beneficiaries up to 100%
      await inheritanceCore.addBeneficiary(
        inheritanceId,
        beneficiary1.address,
        6000
      ); // 60%
      await inheritanceCore.addBeneficiary(
        inheritanceId,
        beneficiary2.address,
        4000
      ); // 40%

      // Adding another beneficiary should fail
      await expect(
        inheritanceCore.addBeneficiary(inheritanceId, addrs[0].address, 1000) // Would be 110%
      ).to.be.reverted;

      console.log("✅ Allocation validation working correctly");
    });
  });

  describe("Edge Cases and Error Handling", function () {
    it("Should reject invalid parameters", async function () {
      const timeLock = {
        distributionType: IMMEDIATE_DISTRIBUTION,
        unlockTime: (await time.latest()) + 60,
        vestingDuration: 0,
        cliffDuration: 0,
        milestoneTimestamps: [],
        milestonePercentages: [],
      };

      // Should reject zero address executor
      await expect(
        inheritanceCore.createInheritance(ethers.ZeroAddress, false, timeLock)
      ).to.be.revertedWith("Invalid executor address");

      console.log("✅ Parameter validation working correctly");
    });

    it("Should handle inheritance status transitions", async function () {
      const timeLock = {
        distributionType: IMMEDIATE_DISTRIBUTION,
        unlockTime: (await time.latest()) + 5,
        vestingDuration: 0,
        cliffDuration: 0,
        milestoneTimestamps: [],
        milestonePercentages: [],
      };

      await inheritanceCore.createInheritance(
        executor.address,
        false,
        timeLock
      );
      const inheritanceId = 0;
      await inheritanceCore.addBeneficiary(
        inheritanceId,
        beneficiary1.address,
        10000
      );
      await inheritanceCore.depositSTT(inheritanceId, {
        value: ethers.parseEther("1.0"),
      });

      // Check initial status
      let data = await inheritanceCore.getInheritanceData(inheritanceId);
      expect(data.status).to.equal(ACTIVE);

      // Trigger inheritance
      await inheritanceCore.triggerInheritance(inheritanceId);
      data = await inheritanceCore.getInheritanceData(inheritanceId);
      expect(data.status).to.equal(TRIGGERED);

      console.log("✅ Status transitions working correctly");
      console.log(`   - Initial status: ACTIVE (${ACTIVE})`);
      console.log(`   - After trigger: TRIGGERED (${TRIGGERED})`);
    });
  });
});
