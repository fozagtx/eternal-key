import { expect } from "chai";
import { ethers } from "hardhat";
import { InheritanceCore, TimingManager } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("TimingManager", function () {
  let inheritanceCore: InheritanceCore;
  let timingManager: TimingManager;
  let owner: HardhatEthersSigner;
  let executor: HardhatEthersSigner;
  let beneficiary: HardhatEthersSigner;
  let otherAccount: HardhatEthersSigner;

  const FIFTEEN_SECONDS = 15;
  const THIRTY_SECONDS = 30;
  const ONE_MINUTE = 60;

  beforeEach(async function () {
    [owner, executor, beneficiary, otherAccount] = await ethers.getSigners();

    const InheritanceCoreFactory =
      await ethers.getContractFactory("InheritanceCore");
    inheritanceCore = await InheritanceCoreFactory.deploy();
    await inheritanceCore.waitForDeployment();

    const TimingManagerFactory =
      await ethers.getContractFactory("TimingManager");
    timingManager = await TimingManagerFactory.deploy();
    await timingManager.waitForDeployment();

    // Set timing manager in inheritance core
    await inheritanceCore.setTimingManager(await timingManager.getAddress());
  });

  describe("Global Timing Configuration", function () {
    it("Should have default testing values", async function () {
      const globalConfig = await timingManager.getGlobalTiming();

      expect(globalConfig.minVestingDuration).to.equal(FIFTEEN_SECONDS);
      expect(globalConfig.defaultExecutionDelay).to.equal(FIFTEEN_SECONDS);
      expect(globalConfig.defaultCliffDuration).to.equal(FIFTEEN_SECONDS);
      expect(globalConfig.isConfigurable).to.be.true;
    });

    it("Should allow admin to update global timing", async function () {
      await expect(
        timingManager.updateGlobalTiming(
          THIRTY_SECONDS,
          THIRTY_SECONDS,
          THIRTY_SECONDS,
        ),
      )
        .to.emit(timingManager, "GlobalTimingUpdated")
        .withArgs(
          THIRTY_SECONDS,
          THIRTY_SECONDS,
          THIRTY_SECONDS,
          owner.address,
        );

      const globalConfig = await timingManager.getGlobalTiming();
      expect(globalConfig.minVestingDuration).to.equal(THIRTY_SECONDS);
      expect(globalConfig.defaultExecutionDelay).to.equal(THIRTY_SECONDS);
      expect(globalConfig.defaultCliffDuration).to.equal(THIRTY_SECONDS);
    });

    it("Should reject non-admin global timing updates", async function () {
      await expect(
        timingManager
          .connect(otherAccount)
          .updateGlobalTiming(THIRTY_SECONDS, THIRTY_SECONDS, THIRTY_SECONDS),
      ).to.be.revertedWith("Not authorized");
    });
  });

  describe("Inheritance-Specific Timing", function () {
    let inheritanceId: number;

    beforeEach(async function () {
      const timeLock = {
        distributionType: 0, // IMMEDIATE
        unlockTime: Math.floor(Date.now() / 1000) + THIRTY_SECONDS,
        vestingDuration: 0,
        cliffDuration: 0,
        milestoneTimestamps: [],
        milestonePercentages: [],
      };

      await inheritanceCore.createInheritance(
        "Test",
        executor.address,
        false,
        timeLock,
      );
      inheritanceId = 0;
    });

    it("Should use global timing by default", async function () {
      const inheritanceConfig =
        await timingManager.getInheritanceTiming(inheritanceId);
      const globalConfig = await timingManager.getGlobalTiming();

      expect(inheritanceConfig.minVestingDuration).to.equal(
        globalConfig.minVestingDuration,
      );
      expect(inheritanceConfig.defaultExecutionDelay).to.equal(
        globalConfig.defaultExecutionDelay,
      );
    });

    it("Should allow owner to set testing mode", async function () {
      await expect(inheritanceCore.setTestingMode(inheritanceId))
        .to.emit(timingManager, "TimingConfigUpdated")
        .withArgs(
          inheritanceId,
          FIFTEEN_SECONDS,
          FIFTEEN_SECONDS,
          FIFTEEN_SECONDS,
          owner.address,
        );

      const config = await timingManager.getInheritanceTiming(inheritanceId);
      expect(config.minVestingDuration).to.equal(FIFTEEN_SECONDS);
      expect(config.defaultExecutionDelay).to.equal(FIFTEEN_SECONDS);
      expect(config.defaultCliffDuration).to.equal(FIFTEEN_SECONDS);
    });

    it("Should allow owner to set production mode", async function () {
      await expect(inheritanceCore.setProductionMode(inheritanceId)).to.emit(
        timingManager,
        "TimingConfigUpdated",
      );

      const config = await timingManager.getInheritanceTiming(inheritanceId);
      expect(config.minVestingDuration).to.equal(24 * 60 * 60); // 1 day
      expect(config.defaultExecutionDelay).to.equal(7 * 24 * 60 * 60); // 7 days
      expect(config.defaultCliffDuration).to.equal(30 * 24 * 60 * 60); // 30 days
    });

    it("Should allow owner to set custom timing", async function () {
      const customVesting = 45; // 45 seconds
      const customDelay = 60; // 1 minute
      const customCliff = 30; // 30 seconds

      await expect(
        inheritanceCore.setCustomTiming(
          inheritanceId,
          customVesting,
          customDelay,
          customCliff,
        ),
      )
        .to.emit(timingManager, "TimingConfigUpdated")
        .withArgs(
          inheritanceId,
          customVesting,
          customDelay,
          customCliff,
          owner.address,
        );

      const config = await timingManager.getInheritanceTiming(inheritanceId);
      expect(config.minVestingDuration).to.equal(customVesting);
      expect(config.defaultExecutionDelay).to.equal(customDelay);
      expect(config.defaultCliffDuration).to.equal(customCliff);
    });

    it("Should reject unauthorized timing updates", async function () {
      await expect(
        inheritanceCore.connect(otherAccount).setTestingMode(inheritanceId),
      ).to.be.revertedWith("Not inheritance owner");
    });

    it("Should validate minimum timing values", async function () {
      await expect(
        timingManager.updateInheritanceTiming(inheritanceId, 0, 1, 1), // 0 seconds vesting
      ).to.be.revertedWith("Min vesting too short");
    });
  });

  describe("Batch Operations", function () {
    let inheritanceIds: number[];

    beforeEach(async function () {
      const timeLock = {
        distributionType: 0,
        unlockTime: Math.floor(Date.now() / 1000) + THIRTY_SECONDS,
        vestingDuration: 0,
        cliffDuration: 0,
        milestoneTimestamps: [],
        milestonePercentages: [],
      };

      // Create multiple inheritances
      for (let i = 0; i < 3; i++) {
        await inheritanceCore.createInheritance(
          `Test ${i}`,
          executor.address,
          false,
          timeLock,
        );
      }
      inheritanceIds = [0, 1, 2];
    });

    it("Should update timing for multiple inheritances", async function () {
      await timingManager.batchUpdateTiming(
        inheritanceIds,
        THIRTY_SECONDS,
        ONE_MINUTE,
        THIRTY_SECONDS,
      );

      for (const id of inheritanceIds) {
        const config = await timingManager.getInheritanceTiming(id);
        expect(config.minVestingDuration).to.equal(THIRTY_SECONDS);
        expect(config.defaultExecutionDelay).to.equal(ONE_MINUTE);
        expect(config.defaultCliffDuration).to.equal(THIRTY_SECONDS);
      }
    });
  });

  describe("Integration with InheritanceCore", function () {
    let inheritanceId: number;

    beforeEach(async function () {
      const timeLock = {
        distributionType: 1, // LINEAR_VESTING
        unlockTime: Math.floor(Date.now() / 1000) + THIRTY_SECONDS,
        vestingDuration: ONE_MINUTE, // 1 minute vesting
        cliffDuration: FIFTEEN_SECONDS, // 15 second cliff
        milestoneTimestamps: [],
        milestonePercentages: [],
      };

      await inheritanceCore.createInheritance(
        "Vesting Test",
        executor.address,
        false,
        timeLock,
      );
      inheritanceId = 0;
    });

    it("Should get inheritance timing through core contract", async function () {
      const config = await inheritanceCore.getInheritanceTiming(inheritanceId);
      expect(config.minVestingDuration).to.equal(FIFTEEN_SECONDS);
      expect(config.isConfigurable).to.be.true;
    });

    it("Should validate timing during inheritance creation", async function () {
      // Should fail with very short vesting duration
      const invalidTimeLock = {
        distributionType: 1,
        unlockTime: Math.floor(Date.now() / 1000) + THIRTY_SECONDS,
        vestingDuration: 5, // Too short
        cliffDuration: 0,
        milestoneTimestamps: [],
        milestonePercentages: [],
      };

      await expect(
        inheritanceCore.createInheritance(
          "Invalid",
          executor.address,
          false,
          invalidTimeLock,
        ),
      ).to.be.revertedWithCustomError(inheritanceCore, "InvalidTimeLock");
    });
  });

  describe("Quick Testing Scenarios", function () {
    it("Should allow rapid testing with 15-second intervals", async function () {
      const timeLock = {
        distributionType: 1, // LINEAR_VESTING
        unlockTime: (await time.latest()) + FIFTEEN_SECONDS,
        vestingDuration: THIRTY_SECONDS,
        cliffDuration: FIFTEEN_SECONDS,
        milestoneTimestamps: [],
        milestonePercentages: [],
      };

      await inheritanceCore.createInheritance(
        "Quick Test",
        executor.address,
        false,
        timeLock,
      );
      const inheritanceId = 0;

      await inheritanceCore.addBeneficiary(
        inheritanceId,
        beneficiary.address,
        10000,
      );
      await inheritanceCore.depositETH(inheritanceId, {
        value: ethers.parseEther("1.0"),
      });
      await inheritanceCore.triggerInheritance(inheritanceId);

      // Initially no assets claimable (cliff period)
      let claimable = await inheritanceCore.getClaimableETH(
        inheritanceId,
        beneficiary.address,
      );
      expect(claimable).to.equal(0);

      // Move past cliff period
      await time.increase(FIFTEEN_SECONDS + 1);

      // Should have some claimable amount
      claimable = await inheritanceCore.getClaimableETH(
        inheritanceId,
        beneficiary.address,
      );
      expect(claimable).to.be.gt(0);
      expect(claimable).to.be.lt(ethers.parseEther("1.0"));

      // Move past entire vesting period
      await time.increase(THIRTY_SECONDS);

      // Should have full amount claimable
      claimable = await inheritanceCore.getClaimableETH(
        inheritanceId,
        beneficiary.address,
      );
      expect(claimable).to.equal(ethers.parseEther("1.0"));

      console.log("✅ Quick testing scenario completed in under 1 minute!");
    });
  });
});
