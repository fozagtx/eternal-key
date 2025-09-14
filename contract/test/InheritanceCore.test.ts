import { expect } from "chai";
import { ethers } from "hardhat";
import {
  InheritanceCore,
  EmergencyManager,
  TimingManager,
} from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("InheritanceCore", function () {
  let inheritanceCore: InheritanceCore;
  let emergencyManager: EmergencyManager;
  let timingManager: TimingManager;
  let owner: HardhatEthersSigner;
  let executor: HardhatEthersSigner;
  let beneficiary1: HardhatEthersSigner;
  let beneficiary2: HardhatEthersSigner;
  let otherAccount: HardhatEthersSigner;

  const BASIS_POINTS = 10000;
  const FIFTEEN_SECONDS = 15;
  const THIRTY_SECONDS = 30;
  const ONE_WEEK = 7 * 24 * 60 * 60; // 7 days in seconds

  beforeEach(async function () {
    [owner, executor, beneficiary1, beneficiary2, otherAccount] =
      await ethers.getSigners();

    const InheritanceCoreFactory = await ethers.getContractFactory(
      "InheritanceCore"
    );
    inheritanceCore = await InheritanceCoreFactory.deploy();
    await inheritanceCore.waitForDeployment();

    const EmergencyManagerFactory = await ethers.getContractFactory(
      "EmergencyManager"
    );
    emergencyManager = await EmergencyManagerFactory.deploy();
    await emergencyManager.waitForDeployment();
  });

  describe("Inheritance Creation", function () {
    it("Should create an inheritance with basic parameters", async function () {
      const name = "Test Inheritance";
      const unlockTime = Math.floor(Date.now() / 1000) + THIRTY_SECONDS;

      const timeLock = {
        distributionType: 0, // IMMEDIATE
        unlockTime: unlockTime,
        vestingDuration: 0,
        cliffDuration: 0,
        milestoneTimestamps: [],
        milestonePercentages: [],
      };

      const tx = await inheritanceCore.createInheritance(
        name,
        executor.address,
        false,
        timeLock
      );

      await expect(tx)
        .to.emit(inheritanceCore, "InheritanceCreated")
        .withArgs(0, owner.address, name, await time.latest());

      const inheritanceData = await inheritanceCore.getInheritanceData(0);
      expect(inheritanceData.owner).to.equal(owner.address);
      expect(inheritanceData.name).to.equal(name);
      expect(inheritanceData.executor).to.equal(executor.address);
      expect(inheritanceData.status).to.equal(0); // ACTIVE
    });

    it("Should reject inheritance creation with empty name", async function () {
      const timeLock = {
        distributionType: 0,
        unlockTime: Math.floor(Date.now() / 1000) + ONE_WEEK,
        vestingDuration: 0,
        cliffDuration: 0,
        milestoneTimestamps: [],
        milestonePercentages: [],
      };

      await expect(
        inheritanceCore.createInheritance("", executor.address, false, timeLock)
      ).to.be.revertedWith("Name cannot be empty");
    });

    it("Should reject inheritance creation with invalid executor", async function () {
      const timeLock = {
        distributionType: 0,
        unlockTime: Math.floor(Date.now() / 1000) + ONE_WEEK,
        vestingDuration: 0,
        cliffDuration: 0,
        milestoneTimestamps: [],
        milestonePercentages: [],
      };

      await expect(
        inheritanceCore.createInheritance(
          "Test",
          ethers.ZeroAddress,
          false,
          timeLock
        )
      ).to.be.revertedWith("Invalid executor address");
    });
  });

  describe("Beneficiary Management", function () {
    let inheritanceId: number;

    beforeEach(async function () {
      const timeLock = {
        distributionType: 0,
        unlockTime: Math.floor(Date.now() / 1000) + ONE_WEEK,
        vestingDuration: 0,
        cliffDuration: 0,
        milestoneTimestamps: [],
        milestonePercentages: [],
      };

      await inheritanceCore.createInheritance(
        "Test",
        executor.address,
        false,
        timeLock
      );
      inheritanceId = 0;
    });

    it("Should add beneficiaries with valid allocations", async function () {
      await expect(
        inheritanceCore.addBeneficiary(
          inheritanceId,
          beneficiary1.address,
          6000
        ) // 60%
      ).to.emit(inheritanceCore, "BeneficiaryAdded");

      await expect(
        inheritanceCore.addBeneficiary(
          inheritanceId,
          beneficiary2.address,
          4000
        ) // 40%
      ).to.emit(inheritanceCore, "BeneficiaryAdded");

      const ben1 = await inheritanceCore.getBeneficiaryInfo(
        inheritanceId,
        beneficiary1.address
      );
      expect(ben1.allocationBasisPoints).to.equal(6000);
      expect(ben1.isActive).to.be.true;

      const ben2 = await inheritanceCore.getBeneficiaryInfo(
        inheritanceId,
        beneficiary2.address
      );
      expect(ben2.allocationBasisPoints).to.equal(4000);
      expect(ben2.isActive).to.be.true;
    });

    it("Should reject allocation exceeding 100%", async function () {
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
        ) // Would total 110%
      ).to.be.revertedWithCustomError(inheritanceCore, "InvalidBasisPoints");
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
      ).to.be.revertedWithCustomError(
        inheritanceCore,
        "BeneficiaryAlreadyExists"
      );
    });

    it("Should reject owner as beneficiary", async function () {
      await expect(
        inheritanceCore.addBeneficiary(inheritanceId, owner.address, 5000)
      ).to.be.revertedWith("Owner cannot be beneficiary");
    });

    it("Should reject zero allocation", async function () {
      await expect(
        inheritanceCore.addBeneficiary(inheritanceId, beneficiary1.address, 0)
      ).to.be.revertedWithCustomError(inheritanceCore, "InvalidBasisPoints");
    });
  });

  describe("Asset Deposits", function () {
    let inheritanceId: number;

    beforeEach(async function () {
      const timeLock = {
        distributionType: 0,
        unlockTime: Math.floor(Date.now() / 1000) + ONE_WEEK,
        vestingDuration: 0,
        cliffDuration: 0,
        milestoneTimestamps: [],
        milestonePercentages: [],
      };

      await inheritanceCore.createInheritance(
        "Test",
        executor.address,
        false,
        timeLock
      );
      inheritanceId = 0;
    });

    it("Should deposit ETH successfully", async function () {
      const depositAmount = ethers.parseEther("1.0");

      const tx = await inheritanceCore.depositETH(inheritanceId, {
        value: depositAmount,
      });
      await expect(tx)
        .to.emit(inheritanceCore, "AssetDeposited")
        .withArgs(inheritanceId, 0, ethers.ZeroAddress, depositAmount, []);

      const contractBalance = await ethers.provider.getBalance(
        inheritanceCore.target
      );
      expect(contractBalance).to.equal(depositAmount);

      const inheritanceData = await inheritanceCore.getInheritanceData(
        inheritanceId
      );
      expect(inheritanceData.totalETHDeposited).to.equal(depositAmount);
    });

    it("Should reject zero ETH deposit", async function () {
      await expect(
        inheritanceCore.depositETH(inheritanceId, { value: 0 })
      ).to.be.revertedWith("Must deposit positive amount");
    });

    it("Should reject direct ETH transfer", async function () {
      await expect(
        owner.sendTransaction({
          to: inheritanceCore.target,
          value: ethers.parseEther("1.0"),
        })
      ).to.be.revertedWith("Use depositETH function");
    });
  });

  describe("Inheritance Triggering", function () {
    let inheritanceId: number;

    beforeEach(async function () {
      const timeLock = {
        distributionType: 0,
        unlockTime: Math.floor(Date.now() / 1000) + ONE_WEEK,
        vestingDuration: 0,
        cliffDuration: 0,
        milestoneTimestamps: [],
        milestonePercentages: [],
      };

      await inheritanceCore.createInheritance(
        "Test",
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
      await inheritanceCore.depositETH(inheritanceId, {
        value: ethers.parseEther("1.0"),
      });
    });

    it("Should allow owner to trigger inheritance", async function () {
      await expect(inheritanceCore.triggerInheritance(inheritanceId))
        .to.emit(inheritanceCore, "InheritanceTriggered")
        .withArgs(inheritanceId, owner.address, await time.latest());

      const inheritanceData = await inheritanceCore.getInheritanceData(
        inheritanceId
      );
      expect(inheritanceData.status).to.equal(1); // TRIGGERED
      expect(inheritanceData.triggeredAt).to.be.gt(0);
    });

    it("Should allow executor to trigger inheritance", async function () {
      await expect(
        inheritanceCore.connect(executor).triggerInheritance(inheritanceId)
      ).to.emit(inheritanceCore, "InheritanceTriggered");
    });

    it("Should reject unauthorized trigger", async function () {
      await expect(
        inheritanceCore.connect(otherAccount).triggerInheritance(inheritanceId)
      ).to.be.revertedWith("Unauthorized to trigger inheritance");
    });

    it("Should reject trigger without beneficiaries", async function () {
      const timeLock = {
        distributionType: 0,
        unlockTime: Math.floor(Date.now() / 1000) + ONE_WEEK,
        vestingDuration: 0,
        cliffDuration: 0,
        milestoneTimestamps: [],
        milestonePercentages: [],
      };

      await inheritanceCore.createInheritance(
        "Empty",
        executor.address,
        false,
        timeLock
      );
      const emptyInheritanceId = 1;

      await expect(
        inheritanceCore.triggerInheritance(emptyInheritanceId)
      ).to.be.revertedWith("No beneficiaries added");
    });
  });

  describe("Asset Claims", function () {
    let inheritanceId: number;
    const depositAmount = ethers.parseEther("2.0");

    beforeEach(async function () {
      const timeLock = {
        distributionType: 0, // IMMEDIATE
        unlockTime: Math.floor(Date.now() / 1000) + ONE_WEEK,
        vestingDuration: 0,
        cliffDuration: 0,
        milestoneTimestamps: [],
        milestonePercentages: [],
      };

      await inheritanceCore.createInheritance(
        "Test",
        executor.address,
        false,
        timeLock
      );
      inheritanceId = 0;

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
      await inheritanceCore.depositETH(inheritanceId, { value: depositAmount });
      await inheritanceCore.triggerInheritance(inheritanceId);
    });

    it("Should allow beneficiaries to claim their ETH share", async function () {
      const ben1InitialBalance = await ethers.provider.getBalance(
        beneficiary1.address
      );
      const expectedAmount = (depositAmount * 6000n) / 10000n; // 60% of 2 ETH = 1.2 ETH

      const claimableBefore = await inheritanceCore.getClaimableETH(
        inheritanceId,
        beneficiary1.address
      );
      expect(claimableBefore).to.equal(expectedAmount);

      await expect(
        inheritanceCore.connect(beneficiary1).claimAssets(inheritanceId)
      )
        .to.emit(inheritanceCore, "AssetClaimed")
        .withArgs(
          inheritanceId,
          beneficiary1.address,
          0,
          ethers.ZeroAddress,
          expectedAmount,
          [],
          await time.latest()
        );

      const ben1FinalBalance = await ethers.provider.getBalance(
        beneficiary1.address
      );
      expect(ben1FinalBalance).to.be.gt(ben1InitialBalance);

      const claimableAfter = await inheritanceCore.getClaimableETH(
        inheritanceId,
        beneficiary1.address
      );
      expect(claimableAfter).to.equal(0);
    });

    it("Should prevent non-beneficiaries from claiming", async function () {
      await expect(
        inheritanceCore.connect(otherAccount).claimAssets(inheritanceId)
      ).to.be.revertedWithCustomError(inheritanceCore, "BeneficiaryNotFound");
    });

    it("Should prevent claims before inheritance is triggered", async function () {
      const timeLock = {
        distributionType: 0,
        unlockTime: Math.floor(Date.now() / 1000) + ONE_WEEK,
        vestingDuration: 0,
        cliffDuration: 0,
        milestoneTimestamps: [],
        milestonePercentages: [],
      };

      await inheritanceCore.createInheritance(
        "Test2",
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
      await inheritanceCore.depositETH(newInheritanceId, {
        value: ethers.parseEther("1.0"),
      });

      await expect(
        inheritanceCore.connect(beneficiary1).claimAssets(newInheritanceId)
      ).to.be.revertedWithCustomError(
        inheritanceCore,
        "InheritanceNotTriggered"
      );
    });

    it("Should complete inheritance when all assets claimed", async function () {
      await inheritanceCore.connect(beneficiary1).claimAssets(inheritanceId);

      await expect(
        inheritanceCore.connect(beneficiary2).claimAssets(inheritanceId)
      ).to.emit(inheritanceCore, "InheritanceCompleted");

      const inheritanceData = await inheritanceCore.getInheritanceData(
        inheritanceId
      );
      expect(inheritanceData.status).to.equal(2); // COMPLETED
    });
  });

  describe("Linear Vesting", function () {
    let inheritanceId: number;
    const depositAmount = ethers.parseEther("1.0");
    const vestingDuration = 100 * ONE_DAY; // 100 days

    beforeEach(async function () {
      const currentTime = await time.latest();
      const timeLock = {
        distributionType: 1, // LINEAR_VESTING
        unlockTime: currentTime + ONE_DAY,
        vestingDuration: vestingDuration,
        cliffDuration: 10 * ONE_DAY, // 10 day cliff
        milestoneTimestamps: [],
        milestonePercentages: [],
      };

      await inheritanceCore.createInheritance(
        "Vesting Test",
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
      await inheritanceCore.depositETH(inheritanceId, { value: depositAmount });
      await inheritanceCore.triggerInheritance(inheritanceId);
    });

    it("Should return zero claimable amount during cliff period", async function () {
      const claimable = await inheritanceCore.getClaimableETH(
        inheritanceId,
        beneficiary1.address
      );
      expect(claimable).to.equal(0);
    });

    it("Should return partial amount after cliff but before vesting end", async function () {
      // Move past cliff period
      await time.increase(15 * ONE_DAY);

      const claimable = await inheritanceCore.getClaimableETH(
        inheritanceId,
        beneficiary1.address
      );
      expect(claimable).to.be.gt(0);
      expect(claimable).to.be.lt(depositAmount);
    });

    it("Should return full amount after vesting period", async function () {
      // Move past entire vesting period
      await time.increase(vestingDuration + ONE_DAY);

      const claimable = await inheritanceCore.getClaimableETH(
        inheritanceId,
        beneficiary1.address
      );
      expect(claimable).to.equal(depositAmount);
    });
  });

  describe("Gas Usage", function () {
    it("Should create inheritance within reasonable gas limits", async function () {
      const timeLock = {
        distributionType: 0,
        unlockTime: Math.floor(Date.now() / 1000) + ONE_WEEK,
        vestingDuration: 0,
        cliffDuration: 0,
        milestoneTimestamps: [],
        milestonePercentages: [],
      };

      const tx = await inheritanceCore.createInheritance(
        "Gas Test",
        executor.address,
        false,
        timeLock
      );
      const receipt = await tx.wait();

      console.log(
        `Inheritance creation gas used: ${receipt?.gasUsed.toString()}`
      );
      expect(receipt?.gasUsed).to.be.lt(500000); // Should be well under 500k gas
    });

    it("Should add beneficiary within reasonable gas limits", async function () {
      const timeLock = {
        distributionType: 0,
        unlockTime: Math.floor(Date.now() / 1000) + ONE_WEEK,
        vestingDuration: 0,
        cliffDuration: 0,
        milestoneTimestamps: [],
        milestonePercentages: [],
      };

      await inheritanceCore.createInheritance(
        "Gas Test",
        executor.address,
        false,
        timeLock
      );

      const tx = await inheritanceCore.addBeneficiary(
        0,
        beneficiary1.address,
        5000
      );
      const receipt = await tx.wait();

      console.log(`Add beneficiary gas used: ${receipt?.gasUsed.toString()}`);
      expect(receipt?.gasUsed).to.be.lt(200000);
    });
  });
});
