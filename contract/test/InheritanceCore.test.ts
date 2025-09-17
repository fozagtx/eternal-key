import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { InheritanceCore } from "../typechain-types";
import { time } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("InheritanceCore", function () {
  let inheritanceCore: InheritanceCore;
  let owner: SignerWithAddress;
  let executor: SignerWithAddress;
  let beneficiary1: SignerWithAddress;
  let beneficiary2: SignerWithAddress;
  let nonBeneficiary: SignerWithAddress;
  let admin: SignerWithAddress;

  const DISTRIBUTION_TYPES = {
    IMMEDIATE: 0,
    LINEAR_VESTING: 1,
    CLIFF_VESTING: 2,
    MILESTONE_BASED: 3,
  };

  const INHERITANCE_STATUS = {
    ACTIVE: 0,
    TRIGGERED: 1,
    COMPLETED: 2,
    DISPUTED: 3,
    FROZEN: 4,
  };

  const ASSET_TYPES = {
    STT: 0,
    ERC20: 1,
    ERC721: 2,
  };

  beforeEach(async function () {
    [owner, executor, beneficiary1, beneficiary2, nonBeneficiary, admin] =
      await ethers.getSigners();

    const InheritanceCore = await ethers.getContractFactory("InheritanceCore");
    inheritanceCore = await InheritanceCore.deploy();
    await inheritanceCore.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct admin role", async function () {
      const adminRole = await inheritanceCore.DEFAULT_ADMIN_ROLE();
      expect(await inheritanceCore.hasRole(adminRole, owner.address)).to.be
        .true;
    });

    it("Should set the correct executor role", async function () {
      const executorRole = await inheritanceCore.EXECUTOR_ROLE();
      expect(await inheritanceCore.hasRole(executorRole, owner.address)).to.be
        .true;
    });

    it("Should not accept direct STT transfers", async function () {
      await expect(
        owner.sendTransaction({
          to: await inheritanceCore.getAddress(),
          value: ethers.parseEther("1"),
        })
      ).to.be.revertedWith(
        "Direct STT payments not accepted - use depositSTT function"
      );
    });
  });

  describe("Creating Inheritances", function () {
    it("Should create a new inheritance", async function () {
      const timeLock = {
        distributionType: DISTRIBUTION_TYPES.IMMEDIATE,
        unlockTime: Math.floor(Date.now() / 1000) + 86400,
        vestingDuration: 0,
        cliffDuration: 0,
        milestoneTimestamps: [],
        milestonePercentages: [],
      };

      await expect(
        inheritanceCore.createInheritance(
          "Test Inheritance",
          executor.address,
          false,
          timeLock
        )
      )
        .to.emit(inheritanceCore, "InheritanceCreated")
        .withArgs(0, owner.address, "Test Inheritance", await time.latest());
    });

    it("Should reject empty name", async function () {
      const timeLock = {
        distributionType: DISTRIBUTION_TYPES.IMMEDIATE,
        unlockTime: Math.floor(Date.now() / 1000) + 86400,
        vestingDuration: 0,
        cliffDuration: 0,
        milestoneTimestamps: [],
        milestonePercentages: [],
      };

      await expect(
        inheritanceCore.createInheritance("", executor.address, false, timeLock)
      ).to.be.revertedWith("Name cannot be empty");
    });

    it("Should reject invalid executor address", async function () {
      const timeLock = {
        distributionType: DISTRIBUTION_TYPES.IMMEDIATE,
        unlockTime: Math.floor(Date.now() / 1000) + 86400,
        vestingDuration: 0,
        cliffDuration: 0,
        milestoneTimestamps: [],
        milestonePercentages: [],
      };

      await expect(
        inheritanceCore.createInheritance(
          "Test Inheritance",
          ethers.ZeroAddress,
          false,
          timeLock
        )
      ).to.be.revertedWith("Invalid executor address");
    });

    it("Should return correct inheritance data", async function () {
      const timeLock = {
        distributionType: DISTRIBUTION_TYPES.IMMEDIATE,
        unlockTime: Math.floor(Date.now() / 1000) + 86400,
        vestingDuration: 0,
        cliffDuration: 0,
        milestoneTimestamps: [],
        milestonePercentages: [],
      };

      await inheritanceCore.createInheritance(
        "Test Inheritance",
        executor.address,
        false,
        timeLock
      );

      const data = await inheritanceCore.getInheritanceData(0);
      expect(data.owner).to.equal(owner.address);
      expect(data.name).to.equal("Test Inheritance");
      expect(data.status).to.equal(INHERITANCE_STATUS.ACTIVE);
      expect(data.executor).to.equal(executor.address);
      expect(data.requiresConfirmation).to.be.false;
    });
  });

  describe("Adding Beneficiaries", function () {
    let inheritanceId: number;

    beforeEach(async function () {
      const timeLock = {
        distributionType: DISTRIBUTION_TYPES.IMMEDIATE,
        unlockTime: Math.floor(Date.now() / 1000) + 86400,
        vestingDuration: 0,
        cliffDuration: 0,
        milestoneTimestamps: [],
        milestonePercentages: [],
      };

      await inheritanceCore.createInheritance(
        "Test Inheritance",
        executor.address,
        false,
        timeLock
      );
      inheritanceId = 0;
    });

    it("Should add a beneficiary successfully", async function () {
      const tx = await inheritanceCore.addBeneficiary(
        inheritanceId,
        beneficiary1.address,
        5000
      );
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt!.blockNumber);

      expect(tx)
        .to.emit(inheritanceCore, "BeneficiaryAdded")
        .withArgs(inheritanceId, beneficiary1.address, 5000, block!.timestamp);
    });

    it("Should reject invalid beneficiary address", async function () {
      await expect(
        inheritanceCore.addBeneficiary(inheritanceId, ethers.ZeroAddress, 5000)
      ).to.be.revertedWith("Invalid beneficiary address");
    });

    it("Should reject owner as beneficiary", async function () {
      await expect(
        inheritanceCore.addBeneficiary(inheritanceId, owner.address, 5000)
      ).to.be.revertedWith("Cannot add self as beneficiary");
    });

    it("Should reject invalid allocation", async function () {
      await expect(
        inheritanceCore.addBeneficiary(inheritanceId, beneficiary1.address, 0)
      ).to.be.revertedWith("Invalid allocation");

      await expect(
        inheritanceCore.addBeneficiary(
          inheritanceId,
          beneficiary1.address,
          10001
        )
      ).to.be.revertedWith("Invalid allocation");
    });

    it("Should reject duplicate beneficiary", async function () {
      await inheritanceCore.addBeneficiary(
        inheritanceId,
        beneficiary1.address,
        5000
      );

      await expect(
        inheritanceCore.addBeneficiary(
          inheritanceId,
          beneficiary1.address,
          3000
        )
      ).to.be.revertedWith("Beneficiary already exists");
    });

    it("Should reject total allocation exceeding 100%", async function () {
      await inheritanceCore.addBeneficiary(
        inheritanceId,
        beneficiary1.address,
        6000
      );

      await expect(
        inheritanceCore.addBeneficiary(
          inheritanceId,
          beneficiary2.address,
          5000
        )
      ).to.be.revertedWith("Total allocation exceeds 100%");
    });

    it("Should allow multiple beneficiaries with valid total allocation", async function () {
      await inheritanceCore.addBeneficiary(
        inheritanceId,
        beneficiary1.address,
        6000
      );
      await inheritanceCore.addBeneficiary(
        inheritanceId,
        beneficiary2.address,
        4000
      );

      const data = await inheritanceCore.getInheritanceData(inheritanceId);
      expect(data.totalBeneficiaries).to.equal(2);
    });

    it("Should return correct beneficiary info", async function () {
      await inheritanceCore.addBeneficiary(
        inheritanceId,
        beneficiary1.address,
        6000
      );

      const info = await inheritanceCore.getBeneficiaryInfo(
        inheritanceId,
        beneficiary1.address
      );
      expect(info.wallet).to.equal(beneficiary1.address);
      expect(info.allocationBasisPoints).to.equal(6000);
      expect(info.isActive).to.be.true;
      expect(info.claimedSTT).to.equal(0);
    });
  });

  describe("STT Deposits", function () {
    let inheritanceId: number;

    beforeEach(async function () {
      const timeLock = {
        distributionType: DISTRIBUTION_TYPES.IMMEDIATE,
        unlockTime: Math.floor(Date.now() / 1000) + 86400,
        vestingDuration: 0,
        cliffDuration: 0,
        milestoneTimestamps: [],
        milestonePercentages: [],
      };

      await inheritanceCore.createInheritance(
        "Test Inheritance",
        executor.address,
        false,
        timeLock
      );
      inheritanceId = 0;
    });

    it("Should deposit STT successfully", async function () {
      const depositAmount = ethers.parseEther("5");

      const tx = await inheritanceCore.depositSTT(inheritanceId, {
        value: depositAmount,
      });
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt!.blockNumber);

      expect(tx)
        .to.emit(inheritanceCore, "AssetDeposited")
        .withArgs(
          inheritanceId,
          ASSET_TYPES.STT,
          ethers.ZeroAddress,
          depositAmount,
          [],
          block!.timestamp
        );
    });

    it("Should reject zero deposit", async function () {
      await expect(
        inheritanceCore.depositSTT(inheritanceId, { value: 0 })
      ).to.be.revertedWith("Deposit amount must be positive");
    });

    it("Should reject deposits from non-owner", async function () {
      await expect(
        inheritanceCore
          .connect(beneficiary1)
          .depositSTT(inheritanceId, { value: ethers.parseEther("1") })
      ).to.be.revertedWith("Only inheritance owner allowed");
    });

    it("Should update total deposited amount", async function () {
      const depositAmount = ethers.parseEther("5");
      await inheritanceCore.depositSTT(inheritanceId, { value: depositAmount });

      const data = await inheritanceCore.getInheritanceData(inheritanceId);
      expect(data.totalSTTDeposited).to.equal(depositAmount);
    });

    it("Should add multiple deposits correctly", async function () {
      const firstDeposit = ethers.parseEther("3");
      const secondDeposit = ethers.parseEther("2");

      await inheritanceCore.depositSTT(inheritanceId, { value: firstDeposit });
      await inheritanceCore.depositSTT(inheritanceId, { value: secondDeposit });

      const data = await inheritanceCore.getInheritanceData(inheritanceId);
      expect(data.totalSTTDeposited).to.equal(firstDeposit + secondDeposit);
    });
  });

  describe("Triggering Inheritances", function () {
    let inheritanceId: number;

    beforeEach(async function () {
      const timeLock = {
        distributionType: DISTRIBUTION_TYPES.IMMEDIATE,
        unlockTime: Math.floor(Date.now() / 1000) + 86400,
        vestingDuration: 0,
        cliffDuration: 0,
        milestoneTimestamps: [],
        milestonePercentages: [],
      };

      await inheritanceCore.createInheritance(
        "Test Inheritance",
        executor.address,
        false,
        timeLock
      );
      inheritanceId = 0;

      await inheritanceCore.addBeneficiary(
        inheritanceId,
        beneficiary1.address,
        10000
      );
    });

    it("Should allow owner to trigger inheritance", async function () {
      const tx = await inheritanceCore.triggerInheritance(inheritanceId);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt!.blockNumber);

      expect(tx)
        .to.emit(inheritanceCore, "InheritanceTriggered")
        .withArgs(inheritanceId, owner.address, block!.timestamp);
    });

    it("Should allow executor to trigger inheritance", async function () {
      const tx = await inheritanceCore
        .connect(executor)
        .triggerInheritance(inheritanceId);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt!.blockNumber);

      expect(tx)
        .to.emit(inheritanceCore, "InheritanceTriggered")
        .withArgs(inheritanceId, executor.address, block!.timestamp);
    });

    it("Should reject unauthorized trigger attempts", async function () {
      await expect(
        inheritanceCore.connect(beneficiary1).triggerInheritance(inheritanceId)
      ).to.be.revertedWith("Unauthorized to trigger inheritance");
    });

    it("Should reject trigger without beneficiaries", async function () {
      const timeLock = {
        distributionType: DISTRIBUTION_TYPES.IMMEDIATE,
        unlockTime: Math.floor(Date.now() / 1000) + 86400,
        vestingDuration: 0,
        cliffDuration: 0,
        milestoneTimestamps: [],
        milestonePercentages: [],
      };

      await inheritanceCore.createInheritance(
        "Empty Inheritance",
        executor.address,
        false,
        timeLock
      );

      await expect(inheritanceCore.triggerInheritance(1)).to.be.revertedWith(
        "No beneficiaries added"
      );
    });

    it("Should update inheritance status to triggered", async function () {
      await inheritanceCore.triggerInheritance(inheritanceId);

      const data = await inheritanceCore.getInheritanceData(inheritanceId);
      expect(data.status).to.equal(INHERITANCE_STATUS.TRIGGERED);
      expect(data.triggeredAt).to.be.greaterThan(0);
    });
  });

  describe("Asset Claims", function () {
    let inheritanceId: number;
    const depositAmount = ethers.parseEther("10");

    beforeEach(async function () {
      const timeLock = {
        distributionType: DISTRIBUTION_TYPES.IMMEDIATE,
        unlockTime: Math.floor(Date.now() / 1000),
        vestingDuration: 0,
        cliffDuration: 0,
        milestoneTimestamps: [],
        milestonePercentages: [],
      };

      await inheritanceCore.createInheritance(
        "Test Inheritance",
        executor.address,
        false,
        timeLock
      );
      inheritanceId = 0;

      await inheritanceCore.addBeneficiary(
        inheritanceId,
        beneficiary1.address,
        6000
      );
      await inheritanceCore.addBeneficiary(
        inheritanceId,
        beneficiary2.address,
        4000
      );
      await inheritanceCore.depositSTT(inheritanceId, { value: depositAmount });
      await inheritanceCore.triggerInheritance(inheritanceId);
    });

    it("Should allow beneficiary to claim assets", async function () {
      const expectedAmount = (depositAmount * 6000n) / 10000n;

      const tx = await inheritanceCore
        .connect(beneficiary1)
        .claimAssets(inheritanceId);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt!.blockNumber);

      expect(tx)
        .to.emit(inheritanceCore, "AssetClaimed")
        .withArgs(
          inheritanceId,
          beneficiary1.address,
          ASSET_TYPES.STT,
          ethers.ZeroAddress,
          expectedAmount,
          [],
          block!.timestamp
        );
    });

    it("Should reject claims from non-beneficiaries", async function () {
      await expect(
        inheritanceCore.connect(nonBeneficiary).claimAssets(inheritanceId)
      ).to.be.revertedWith("Not a valid beneficiary");
    });

    it("Should reject claims before inheritance is triggered", async function () {
      const timeLock = {
        distributionType: DISTRIBUTION_TYPES.IMMEDIATE,
        unlockTime: Math.floor(Date.now() / 1000),
        vestingDuration: 0,
        cliffDuration: 0,
        milestoneTimestamps: [],
        milestonePercentages: [],
      };

      await inheritanceCore.createInheritance(
        "Untriggered Inheritance",
        executor.address,
        false,
        timeLock
      );
      const newInheritanceId = 1;

      await inheritanceCore.addBeneficiary(
        newInheritanceId,
        beneficiary1.address,
        10000
      );
      await inheritanceCore.depositSTT(newInheritanceId, {
        value: depositAmount,
      });

      await expect(
        inheritanceCore.connect(beneficiary1).claimAssets(newInheritanceId)
      ).to.be.revertedWith("Inheritance not triggered");
    });

    it("Should distribute assets correctly among beneficiaries", async function () {
      const beneficiary1InitialBalance = await ethers.provider.getBalance(
        beneficiary1.address
      );
      const beneficiary2InitialBalance = await ethers.provider.getBalance(
        beneficiary2.address
      );

      const tx1 = await inheritanceCore
        .connect(beneficiary1)
        .claimAssets(inheritanceId);
      const receipt1 = await tx1.wait();
      const gasUsed1 = receipt1!.gasUsed * tx1.gasPrice!;

      const tx2 = await inheritanceCore
        .connect(beneficiary2)
        .claimAssets(inheritanceId);
      const receipt2 = await tx2.wait();
      const gasUsed2 = receipt2!.gasUsed * tx2.gasPrice!;

      const beneficiary1FinalBalance = await ethers.provider.getBalance(
        beneficiary1.address
      );
      const beneficiary2FinalBalance = await ethers.provider.getBalance(
        beneficiary2.address
      );

      const beneficiary1Received =
        beneficiary1FinalBalance - beneficiary1InitialBalance + gasUsed1;
      const beneficiary2Received =
        beneficiary2FinalBalance - beneficiary2InitialBalance + gasUsed2;

      const expectedBeneficiary1Amount = (depositAmount * 6000n) / 10000n;
      const expectedBeneficiary2Amount = (depositAmount * 4000n) / 10000n;

      expect(beneficiary1Received).to.equal(expectedBeneficiary1Amount);
      expect(beneficiary2Received).to.equal(expectedBeneficiary2Amount);
    });

    it("Should prevent double claiming", async function () {
      await inheritanceCore.connect(beneficiary1).claimAssets(inheritanceId);

      // Second claim should not emit AssetClaimed event with 0 amount
      const claimableBefore = await inheritanceCore.getClaimableSTT(
        inheritanceId,
        beneficiary1.address
      );
      expect(claimableBefore).to.equal(0);

      // Second claim transaction should succeed but not transfer any assets
      const tx = await inheritanceCore
        .connect(beneficiary1)
        .claimAssets(inheritanceId);
      const receipt = await tx.wait();

      // Check that no AssetClaimed event was emitted (since claimable amount is 0)
      const assetClaimedEvents = receipt!.logs.filter((log) => {
        try {
          const parsed = inheritanceCore.interface.parseLog(log);
          return parsed?.name === "AssetClaimed";
        } catch {
          return false;
        }
      });

      expect(assetClaimedEvents.length).to.equal(0);
    });

    it("Should update inheritance status to completed when all assets claimed", async function () {
      await inheritanceCore.connect(beneficiary1).claimAssets(inheritanceId);

      await expect(
        inheritanceCore.connect(beneficiary2).claimAssets(inheritanceId)
      ).to.emit(inheritanceCore, "InheritanceCompleted");

      const data = await inheritanceCore.getInheritanceData(inheritanceId);
      expect(data.status).to.equal(INHERITANCE_STATUS.COMPLETED);
    });

    it("Should return correct claimable amount", async function () {
      const claimableAmount = await inheritanceCore.getClaimableSTT(
        inheritanceId,
        beneficiary1.address
      );
      const expectedAmount = (depositAmount * 6000n) / 10000n;
      expect(claimableAmount).to.equal(expectedAmount);
    });

    it("Should return zero claimable for non-beneficiary", async function () {
      const claimableAmount = await inheritanceCore.getClaimableSTT(
        inheritanceId,
        nonBeneficiary.address
      );
      expect(claimableAmount).to.equal(0);
    });
  });

  describe("Vesting", function () {
    let inheritanceId: number;
    const depositAmount = ethers.parseEther("10");

    beforeEach(async function () {
      const timeLock = {
        distributionType: DISTRIBUTION_TYPES.LINEAR_VESTING,
        unlockTime: Math.floor(Date.now() / 1000),
        vestingDuration: 86400, // 1 day
        cliffDuration: 3600, // 1 hour
        milestoneTimestamps: [],
        milestonePercentages: [],
      };

      await inheritanceCore.createInheritance(
        "Vesting Inheritance",
        executor.address,
        false,
        timeLock
      );
      inheritanceId = 0;

      await inheritanceCore.addBeneficiary(
        inheritanceId,
        beneficiary1.address,
        10000
      );
      await inheritanceCore.depositSTT(inheritanceId, { value: depositAmount });
      await inheritanceCore.triggerInheritance(inheritanceId);
    });

    it("Should return zero claimable amount during cliff period", async function () {
      const claimableAmount = await inheritanceCore.getClaimableSTT(
        inheritanceId,
        beneficiary1.address
      );
      expect(claimableAmount).to.equal(0);
    });

    it("Should calculate partial vesting correctly", async function () {
      // Fast forward past cliff but not full vesting
      await time.increase(7200); // 2 hours

      const claimableAmount = await inheritanceCore.getClaimableSTT(
        inheritanceId,
        beneficiary1.address
      );
      expect(claimableAmount).to.be.greaterThan(0);
      expect(claimableAmount).to.be.lessThan(depositAmount);
    });

    it("Should allow full claim after vesting period", async function () {
      // Fast forward past full vesting period
      await time.increase(86400 + 3600); // 1 day + 1 hour

      const claimableAmount = await inheritanceCore.getClaimableSTT(
        inheritanceId,
        beneficiary1.address
      );
      expect(claimableAmount).to.equal(depositAmount);
    });
  });

  describe("Access Control", function () {
    it("Should grant admin role to deployer", async function () {
      const adminRole = await inheritanceCore.DEFAULT_ADMIN_ROLE();
      expect(await inheritanceCore.hasRole(adminRole, owner.address)).to.be
        .true;
    });

    it("Should grant executor role to deployer", async function () {
      const executorRole = await inheritanceCore.EXECUTOR_ROLE();
      expect(await inheritanceCore.hasRole(executorRole, owner.address)).to.be
        .true;
    });

    it("Should allow admin to grant roles", async function () {
      const executorRole = await inheritanceCore.EXECUTOR_ROLE();

      await inheritanceCore.grantRole(executorRole, admin.address);
      expect(await inheritanceCore.hasRole(executorRole, admin.address)).to.be
        .true;
    });
  });

  describe("Edge Cases", function () {
    let inheritanceId: number;

    beforeEach(async function () {
      const timeLock = {
        distributionType: DISTRIBUTION_TYPES.IMMEDIATE,
        unlockTime: Math.floor(Date.now() / 1000),
        vestingDuration: 0,
        cliffDuration: 0,
        milestoneTimestamps: [],
        milestonePercentages: [],
      };

      await inheritanceCore.createInheritance(
        "Test Inheritance",
        executor.address,
        false,
        timeLock
      );
      inheritanceId = 0;
    });

    it("Should handle inheritance with no deposits", async function () {
      await inheritanceCore.addBeneficiary(
        inheritanceId,
        beneficiary1.address,
        10000
      );
      await inheritanceCore.triggerInheritance(inheritanceId);

      const claimableAmount = await inheritanceCore.getClaimableSTT(
        inheritanceId,
        beneficiary1.address
      );
      expect(claimableAmount).to.equal(0);
    });

    it("Should revert when querying non-existent inheritance", async function () {
      await expect(inheritanceCore.getInheritanceData(999)).to.be.revertedWith(
        "Inheritance does not exist"
      );
    });

    it("Should handle multiple small deposits correctly", async function () {
      const smallDeposit = ethers.parseEther("0.1");

      for (let i = 0; i < 10; i++) {
        await inheritanceCore.depositSTT(inheritanceId, {
          value: smallDeposit,
        });
      }

      const data = await inheritanceCore.getInheritanceData(inheritanceId);
      expect(data.totalSTTDeposited).to.equal(smallDeposit * 10n);
    });
  });

  describe("Gas Optimization", function () {
    it("Should use reasonable gas for common operations", async function () {
      const timeLock = {
        distributionType: DISTRIBUTION_TYPES.IMMEDIATE,
        unlockTime: Math.floor(Date.now() / 1000),
        vestingDuration: 0,
        cliffDuration: 0,
        milestoneTimestamps: [],
        milestonePercentages: [],
      };

      // Test inheritance creation gas usage
      const createTx = await inheritanceCore.createInheritance(
        "Gas Test",
        executor.address,
        false,
        timeLock
      );
      const createReceipt = await createTx.wait();
      expect(createReceipt!.gasUsed).to.be.lessThan(200000);

      // Test beneficiary addition gas usage
      const addBeneficiaryTx = await inheritanceCore.addBeneficiary(
        0,
        beneficiary1.address,
        10000
      );
      const addBeneficiaryReceipt = await addBeneficiaryTx.wait();
      expect(addBeneficiaryReceipt!.gasUsed).to.be.lessThan(200000);

      // Test deposit gas usage
      const depositTx = await inheritanceCore.depositSTT(0, {
        value: ethers.parseEther("1"),
      });
      const depositReceipt = await depositTx.wait();
      expect(depositReceipt!.gasUsed).to.be.lessThan(150000);
    });
  });
});
