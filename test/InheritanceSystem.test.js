const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("InheritanceSystem", function () {
  let inheritanceSystem;
  let owner, beneficiary, otherAccount;
  const ONE_DAY = 24 * 60 * 60; // 1 day in seconds
  const INITIAL_DEPOSIT = ethers.parseEther("1.0");

  beforeEach(async function () {
    [owner, beneficiary, otherAccount] = await ethers.getSigners();
    
    const InheritanceSystem = await ethers.getContractFactory("InheritanceSystem");
    inheritanceSystem = await InheritanceSystem.deploy();
    await inheritanceSystem.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      expect(await inheritanceSystem.getAddress()).to.be.properAddress;
    });

    it("Should set the correct owner", async function () {
      expect(await inheritanceSystem.owner()).to.equal(owner.address);
    });
  });

  describe("Creating Inheritance", function () {
    it("Should create inheritance successfully", async function () {
      const deadmanDuration = 7 * ONE_DAY; // 7 days
      const message = "This is for you";

      await expect(
        inheritanceSystem.createInheritance(
          beneficiary.address,
          deadmanDuration,
          message,
          { value: INITIAL_DEPOSIT }
        )
      )
        .to.emit(inheritanceSystem, "InheritanceCreated")
        .withArgs(owner.address, beneficiary.address, deadmanDuration, message)
        .and.to.emit(inheritanceSystem, "FundsDeposited")
        .withArgs(owner.address, INITIAL_DEPOSIT, INITIAL_DEPOSIT);

      const inheritance = await inheritanceSystem.getInheritanceDetails(owner.address);
      expect(inheritance.beneficiary).to.equal(beneficiary.address);
      expect(inheritance.amount).to.equal(INITIAL_DEPOSIT);
      expect(inheritance.deadmanDuration).to.equal(deadmanDuration);
      expect(inheritance.message).to.equal(message);
      expect(inheritance.exists).to.be.true;
      expect(inheritance.executed).to.be.false;
    });

    it("Should reject invalid beneficiary addresses", async function () {
      await expect(
        inheritanceSystem.createInheritance(
          ethers.ZeroAddress,
          7 * ONE_DAY,
          "test"
        )
      ).to.be.revertedWith("Invalid beneficiary address");

      await expect(
        inheritanceSystem.createInheritance(
          owner.address,
          7 * ONE_DAY,
          "test"
        )
      ).to.be.revertedWith("Cannot set self as beneficiary");
    });

    it("Should reject invalid deadman switch durations", async function () {
      await expect(
        inheritanceSystem.createInheritance(
          beneficiary.address,
          ONE_DAY - 1, // Less than minimum
          "test"
        )
      ).to.be.revertedWith("Invalid deadman switch duration");

      await expect(
        inheritanceSystem.createInheritance(
          beneficiary.address,
          365 * ONE_DAY + 1, // More than maximum
          "test"
        )
      ).to.be.revertedWith("Invalid deadman switch duration");
    });

    it("Should prevent creating multiple inheritances", async function () {
      await inheritanceSystem.createInheritance(
        beneficiary.address,
        7 * ONE_DAY,
        "test",
        { value: INITIAL_DEPOSIT }
      );

      await expect(
        inheritanceSystem.createInheritance(
          beneficiary.address,
          7 * ONE_DAY,
          "test2"
        )
      ).to.be.revertedWith("Inheritance already exists");
    });
  });

  describe("Managing Funds", function () {
    beforeEach(async function () {
      await inheritanceSystem.createInheritance(
        beneficiary.address,
        7 * ONE_DAY,
        "test",
        { value: INITIAL_DEPOSIT }
      );
    });

    it("Should allow depositing additional funds", async function () {
      const additionalDeposit = ethers.parseEther("0.5");
      
      await expect(
        inheritanceSystem.depositFunds({ value: additionalDeposit })
      )
        .to.emit(inheritanceSystem, "FundsDeposited")
        .withArgs(owner.address, additionalDeposit, INITIAL_DEPOSIT + additionalDeposit);

      const inheritance = await inheritanceSystem.getInheritanceDetails(owner.address);
      expect(inheritance.amount).to.equal(INITIAL_DEPOSIT + additionalDeposit);
    });

    it("Should allow owner to withdraw funds", async function () {
      const withdrawAmount = ethers.parseEther("0.5");
      
      await expect(
        inheritanceSystem.withdrawFunds(withdrawAmount)
      )
        .to.emit(inheritanceSystem, "FundsWithdrawn")
        .withArgs(owner.address, withdrawAmount, INITIAL_DEPOSIT - withdrawAmount);

      const inheritance = await inheritanceSystem.getInheritanceDetails(owner.address);
      expect(inheritance.amount).to.equal(INITIAL_DEPOSIT - withdrawAmount);
    });

    it("Should reject withdrawal of more than available balance", async function () {
      const withdrawAmount = ethers.parseEther("2.0"); // More than deposited
      
      await expect(
        inheritanceSystem.withdrawFunds(withdrawAmount)
      ).to.be.revertedWith("Insufficient balance");
    });
  });

  describe("Check-in System", function () {
    beforeEach(async function () {
      await inheritanceSystem.createInheritance(
        beneficiary.address,
        7 * ONE_DAY,
        "test",
        { value: INITIAL_DEPOSIT }
      );
    });

    it("Should allow owner to check in", async function () {
      await expect(inheritanceSystem.checkIn())
        .to.emit(inheritanceSystem, "CheckInPerformed")
        .withArgs(owner.address, await time.latest() + 1);
    });

    it("Should update last check-in time", async function () {
      const inheritanceBefore = await inheritanceSystem.getInheritanceDetails(owner.address);
      
      await time.increase(ONE_DAY);
      await inheritanceSystem.checkIn();
      
      const inheritanceAfter = await inheritanceSystem.getInheritanceDetails(owner.address);
      expect(inheritanceAfter.lastCheckIn).to.be.greaterThan(inheritanceBefore.lastCheckIn);
    });
  });

  describe("Deadman Switch", function () {
    beforeEach(async function () {
      await inheritanceSystem.createInheritance(
        beneficiary.address,
        7 * ONE_DAY,
        "test",
        { value: INITIAL_DEPOSIT }
      );
    });

    it("Should not be triggered initially", async function () {
      expect(await inheritanceSystem.isDeadmanSwitchTriggered(owner.address)).to.be.false;
    });

    it("Should be triggered after deadman duration", async function () {
      await time.increase(7 * ONE_DAY + 1);
      expect(await inheritanceSystem.isDeadmanSwitchTriggered(owner.address)).to.be.true;
    });

    it("Should reset when owner checks in", async function () {
      await time.increase(6 * ONE_DAY); // Almost triggered
      await inheritanceSystem.checkIn();
      
      expect(await inheritanceSystem.isDeadmanSwitchTriggered(owner.address)).to.be.false;
      
      // Should not be triggered until another 7 days
      await time.increase(6 * ONE_DAY);
      expect(await inheritanceSystem.isDeadmanSwitchTriggered(owner.address)).to.be.false;
    });

    it("Should return correct time until trigger", async function () {
      const timeUntil = await inheritanceSystem.getTimeUntilTrigger(owner.address);
      expect(timeUntil).to.be.approximately(7 * ONE_DAY, 5); // Allow 5 seconds tolerance
      
      await time.increase(ONE_DAY);
      const timeUntilAfter = await inheritanceSystem.getTimeUntilTrigger(owner.address);
      expect(timeUntilAfter).to.be.approximately(6 * ONE_DAY, 5);
    });
  });

  describe("Inheritance Execution", function () {
    beforeEach(async function () {
      await inheritanceSystem.createInheritance(
        beneficiary.address,
        7 * ONE_DAY,
        "This is your inheritance",
        { value: INITIAL_DEPOSIT }
      );
    });

    it("Should allow beneficiary to execute inheritance after deadman switch", async function () {
      await time.increase(7 * ONE_DAY + 1);
      
      const beneficiaryBalanceBefore = await ethers.provider.getBalance(beneficiary.address);
      
      await expect(
        inheritanceSystem.connect(beneficiary).executeInheritance(owner.address)
      )
        .to.emit(inheritanceSystem, "InheritanceExecuted")
        .withArgs(owner.address, beneficiary.address, INITIAL_DEPOSIT, "This is your inheritance");
      
      const beneficiaryBalanceAfter = await ethers.provider.getBalance(beneficiary.address);
      expect(beneficiaryBalanceAfter).to.be.greaterThan(beneficiaryBalanceBefore);
      
      const inheritance = await inheritanceSystem.getInheritanceDetails(owner.address);
      expect(inheritance.executed).to.be.true;
      expect(inheritance.amount).to.equal(0);
    });

    it("Should reject execution before deadman switch triggers", async function () {
      await expect(
        inheritanceSystem.connect(beneficiary).executeInheritance(owner.address)
      ).to.be.revertedWith("Deadman switch not triggered");
    });

    it("Should reject execution by non-beneficiary", async function () {
      await time.increase(7 * ONE_DAY + 1);
      
      await expect(
        inheritanceSystem.connect(otherAccount).executeInheritance(owner.address)
      ).to.be.revertedWith("Only beneficiary can execute");
    });

    it("Should prevent double execution", async function () {
      await time.increase(7 * ONE_DAY + 1);
      
      await inheritanceSystem.connect(beneficiary).executeInheritance(owner.address);
      
      await expect(
        inheritanceSystem.connect(beneficiary).executeInheritance(owner.address)
      ).to.be.revertedWith("Inheritance already executed");
    });
  });

  describe("Updating Inheritance", function () {
    beforeEach(async function () {
      await inheritanceSystem.createInheritance(
        beneficiary.address,
        7 * ONE_DAY,
        "test",
        { value: INITIAL_DEPOSIT }
      );
    });

    it("Should allow updating beneficiary", async function () {
      await expect(
        inheritanceSystem.updateBeneficiary(otherAccount.address)
      )
        .to.emit(inheritanceSystem, "BeneficiaryUpdated")
        .withArgs(owner.address, beneficiary.address, otherAccount.address);

      const inheritance = await inheritanceSystem.getInheritanceDetails(owner.address);
      expect(inheritance.beneficiary).to.equal(otherAccount.address);
    });

    it("Should allow updating deadman switch duration", async function () {
      const newDuration = 14 * ONE_DAY;
      
      await expect(
        inheritanceSystem.updateDeadmanSwitch(newDuration)
      )
        .to.emit(inheritanceSystem, "DeadmanSwitchUpdated")
        .withArgs(owner.address, 7 * ONE_DAY, newDuration);

      const inheritance = await inheritanceSystem.getInheritanceDetails(owner.address);
      expect(inheritance.deadmanDuration).to.equal(newDuration);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle inheritance without initial deposit", async function () {
      await inheritanceSystem.createInheritance(
        beneficiary.address,
        7 * ONE_DAY,
        "test"
        // No value sent
      );

      const inheritance = await inheritanceSystem.getInheritanceDetails(owner.address);
      expect(inheritance.amount).to.equal(0);
      expect(inheritance.exists).to.be.true;
    });

    it("Should reject executing inheritance with no funds", async function () {
      await inheritanceSystem.createInheritance(
        beneficiary.address,
        7 * ONE_DAY,
        "test"
        // No value sent
      );

      await time.increase(7 * ONE_DAY + 1);
      
      await expect(
        inheritanceSystem.connect(beneficiary).executeInheritance(owner.address)
      ).to.be.revertedWith("No funds to inherit");
    });
  });
});