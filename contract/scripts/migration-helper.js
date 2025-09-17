const { ethers } = require("hardhat");

/**
 * Migration Helper Script for InheritanceCore (old) -> InheritanceCore (new fixed version)
 *
 * This script assists in migrating data from the old contract to the new secure contract.
 * Run with: npx hardhat run scripts/migration-helper.js --network <network>
 */

class MigrationHelper {
  constructor(oldContractAddress, newContractAddress, provider) {
    this.oldContractAddress = oldContractAddress;
    this.newContractAddress = newContractAddress;
    this.provider = provider;
    this.migrationData = {
      inheritances: [],
      beneficiaries: [],
      assets: [],
      errors: [],
    };
  }

  async initialize() {
    // Get contract factories
    const OldInheritanceCore = await ethers.getContractFactory(
      "InheritanceCore"
    );
    const NewInheritanceCore = await ethers.getContractFactory(
      "InheritanceCore"
    );

    // Connect to deployed contracts
    this.oldContract = OldInheritanceCore.attach(this.oldContractAddress);
    this.newContract = NewInheritanceCore.attach(this.newContractAddress);

    console.log("Migration helper initialized:");
    console.log("Old contract:", this.oldContractAddress);
    console.log("New contract:", this.newContractAddress);
  }

  /**
   * Step 1: Analyze existing contract state
   */
  async analyzeExistingState() {
    console.log("\n=== ANALYZING EXISTING CONTRACT STATE ===");

    try {
      // Get inheritance counter (if available)
      // Note: This assumes the old contract has a way to get total inheritances
      // You may need to adjust based on the actual old contract interface

      let inheritanceCount = 0;
      let currentId = 0;

      // Try to find all existing inheritances by checking consecutive IDs
      while (inheritanceCount < 100) {
        // Safety limit
        try {
          const inheritanceData = await this.oldContract.getInheritanceData(
            currentId
          );

          // If we get data, this inheritance exists
          console.log(`Found inheritance ID: ${currentId}`);

          const inheritance = {
            id: currentId,
            owner: inheritanceData.owner,
            status: inheritanceData.status,
            createdAt: inheritanceData.createdAt,
            triggeredAt: inheritanceData.triggeredAt,
            timeLock: inheritanceData.timeLock,
            totalBeneficiaries: inheritanceData.totalBeneficiaries,
            requiresConfirmation: inheritanceData.requiresConfirmation,
            executor: inheritanceData.executor,
            totalSTTDeposited: inheritanceData.totalSTTDeposited,
            totalSTTClaimed: inheritanceData.totalSTTClaimed,
            beneficiaries: [],
            assets: [],
          };

          // Get assets for this inheritance
          try {
            const assets = await this.oldContract.getTotalAssets(currentId);
            inheritance.assets = assets;
            console.log(`  - Assets found: ${assets.length}`);
          } catch (error) {
            console.log(`  - Error getting assets: ${error.message}`);
            this.migrationData.errors.push({
              inheritanceId: currentId,
              type: "assets",
              error: error.message,
            });
          }

          // TODO: Get beneficiaries - this depends on the old contract having a method to list them
          // You may need to use events or other methods to gather this information

          this.migrationData.inheritances.push(inheritance);
          inheritanceCount++;
        } catch (error) {
          // No inheritance with this ID, break if we've found some
          if (inheritanceCount > 0) {
            break;
          }
        }
        currentId++;
      }

      console.log(`\nFound ${inheritanceCount} inheritances to migrate`);
    } catch (error) {
      console.error("Error analyzing existing state:", error);
      this.migrationData.errors.push({
        type: "analysis",
        error: error.message,
      });
    }
  }

  /**
   * Step 2: Validate new contract deployment
   */
  async validateNewContract() {
    console.log("\n=== VALIDATING NEW CONTRACT ===");

    try {
      // Test basic functionality
      const [deployer] = await ethers.getSigners();

      // Check roles
      const DEFAULT_ADMIN_ROLE = await this.newContract.DEFAULT_ADMIN_ROLE();
      const EXECUTOR_ROLE = await this.newContract.EXECUTOR_ROLE();

      const hasAdminRole = await this.newContract.hasRole(
        DEFAULT_ADMIN_ROLE,
        deployer.address
      );
      const hasExecutorRole = await this.newContract.hasRole(
        EXECUTOR_ROLE,
        deployer.address
      );

      console.log("Deployer has admin role:", hasAdminRole);
      console.log("Deployer has executor role:", hasExecutorRole);

      if (!hasAdminRole) {
        throw new Error("Deployer does not have admin role in new contract");
      }

      console.log("New contract validation passed");
    } catch (error) {
      console.error("New contract validation failed:", error);
      this.migrationData.errors.push({
        type: "validation",
        error: error.message,
      });
      return false;
    }

    return true;
  }

  /**
   * Step 3: Generate migration plan
   */
  generateMigrationPlan() {
    console.log("\n=== GENERATING MIGRATION PLAN ===");

    const plan = {
      totalInheritances: this.migrationData.inheritances.length,
      activeInheritances: 0,
      triggeredInheritances: 0,
      completedInheritances: 0,
      totalSTTToMigrate: ethers.parseEther("0"),
      erc20Tokens: new Set(),
      erc721Collections: new Set(),
      estimatedGasCost: 0,
    };

    for (const inheritance of this.migrationData.inheritances) {
      switch (inheritance.status) {
        case 0: // ACTIVE
          plan.activeInheritances++;
          break;
        case 1: // TRIGGERED
          plan.triggeredInheritances++;
          break;
        case 2: // COMPLETED
          plan.completedInheritances++;
          break;
      }

      plan.totalSTTToMigrate +=
        BigInt(inheritance.totalSTTDeposited) -
        BigInt(inheritance.totalSTTClaimed);

      // Analyze assets
      for (const asset of inheritance.assets) {
        if (asset.assetType === 1) {
          // ERC20
          plan.erc20Tokens.add(asset.contractAddress);
        } else if (asset.assetType === 2) {
          // ERC721
          plan.erc721Collections.add(asset.contractAddress);
        }
      }

      // Estimate gas cost (rough estimate)
      plan.estimatedGasCost += 500000; // ~500k gas per inheritance
    }

    console.log("Migration Plan:");
    console.log(`- Total inheritances: ${plan.totalInheritances}`);
    console.log(`- Active: ${plan.activeInheritances}`);
    console.log(`- Triggered: ${plan.triggeredInheritances}`);
    console.log(`- Completed: ${plan.completedInheritances}`);
    console.log(
      `- STT to migrate: ${ethers.formatEther(plan.totalSTTToMigrate)} ETH`
    );
    console.log(`- Unique ERC20 tokens: ${plan.erc20Tokens.size}`);
    console.log(`- Unique ERC721 collections: ${plan.erc721Collections.size}`);
    console.log(
      `- Estimated gas cost: ${plan.estimatedGasCost.toLocaleString()}`
    );

    return plan;
  }

  /**
   * Step 4: Execute dry run migration
   */
  async executeDryRun() {
    console.log("\n=== EXECUTING DRY RUN MIGRATION ===");

    const results = {
      successful: 0,
      failed: 0,
      errors: [],
    };

    for (const inheritance of this.migrationData.inheritances) {
      try {
        console.log(`\nDry run for inheritance ${inheritance.id}:`);

        // Simulate creating inheritance
        console.log(
          `  - Would create inheritance for owner: ${inheritance.owner}`
        );
        console.log(`  - Executor: ${inheritance.executor}`);
        console.log(`  - Beneficiaries: ${inheritance.totalBeneficiaries}`);
        console.log(`  - Assets: ${inheritance.assets.length}`);

        // Check for potential issues
        if (inheritance.assets.length === 0) {
          console.log("  ⚠️  Warning: No assets to migrate");
        }

        if (inheritance.totalBeneficiaries === 0) {
          console.log("  ⚠️  Warning: No beneficiaries");
        }

        // Validate TimeLock structure
        if (!inheritance.timeLock) {
          console.log("  ❌ Error: Missing TimeLock data");
          throw new Error("Missing TimeLock data");
        }

        results.successful++;
        console.log("  ✅ Dry run successful");
      } catch (error) {
        results.failed++;
        results.errors.push({
          inheritanceId: inheritance.id,
          error: error.message,
        });
        console.log(`  ❌ Dry run failed: ${error.message}`);
      }
    }

    console.log(
      `\nDry run results: ${results.successful} successful, ${results.failed} failed`
    );
    return results;
  }

  /**
   * Export migration data to file
   */
  async exportMigrationData() {
    const fs = require("fs");
    const path = require("path");

    const exportData = {
      timestamp: new Date().toISOString(),
      oldContract: this.oldContractAddress,
      newContract: this.newContractAddress,
      ...this.migrationData,
    };

    const fileName = `migration-data-${Date.now()}.json`;
    const filePath = path.join(__dirname, "..", "migration-data", fileName);

    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filePath, JSON.stringify(exportData, null, 2));
    console.log(`Migration data exported to: ${filePath}`);

    return filePath;
  }

  /**
   * Generate migration report
   */
  generateReport() {
    console.log("\n=== MIGRATION REPORT ===");

    const report = {
      summary: {
        totalInheritances: this.migrationData.inheritances.length,
        totalErrors: this.migrationData.errors.length,
        readyForMigration: this.migrationData.errors.length === 0,
      },
      recommendations: [],
    };

    if (report.summary.totalErrors > 0) {
      console.log(
        `⚠️  ${report.summary.totalErrors} errors found during analysis`
      );
      report.recommendations.push(
        "Review and fix errors before proceeding with migration"
      );

      for (const error of this.migrationData.errors) {
        console.log(`   - ${error.type}: ${error.error}`);
      }
    }

    if (report.summary.totalInheritances === 0) {
      console.log("ℹ️  No inheritances found to migrate");
      report.recommendations.push("Verify the old contract address is correct");
    } else {
      console.log(
        `✅ Found ${report.summary.totalInheritances} inheritances to migrate`
      );
      report.recommendations.push(
        "Proceed with asset transfer and state recreation"
      );
    }

    if (report.summary.readyForMigration) {
      console.log("🚀 Ready for migration!");
    } else {
      console.log("🛑 Migration not ready - fix errors first");
    }

    return report;
  }
}

async function main() {
  // Configuration - UPDATE THESE ADDRESSES
  const OLD_CONTRACT_ADDRESS =
    process.env.OLD_CONTRACT_ADDRESS ||
    "0x0000000000000000000000000000000000000000";
  const NEW_CONTRACT_ADDRESS =
    process.env.NEW_CONTRACT_ADDRESS ||
    "0x0000000000000000000000000000000000000000";

  if (OLD_CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000") {
    console.error("Please set OLD_CONTRACT_ADDRESS environment variable");
    process.exit(1);
  }

  if (NEW_CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000") {
    console.error("Please set NEW_CONTRACT_ADDRESS environment variable");
    process.exit(1);
  }

  const [signer] = await ethers.getSigners();
  const migrationHelper = new MigrationHelper(
    OLD_CONTRACT_ADDRESS,
    NEW_CONTRACT_ADDRESS,
    signer.provider
  );

  try {
    await migrationHelper.initialize();
    await migrationHelper.analyzeExistingState();

    const isValid = await migrationHelper.validateNewContract();
    if (!isValid) {
      console.error("New contract validation failed. Aborting migration.");
      process.exit(1);
    }

    migrationHelper.generateMigrationPlan();
    await migrationHelper.executeDryRun();

    const dataFile = await migrationHelper.exportMigrationData();
    const report = migrationHelper.generateReport();

    console.log(`\nMigration analysis complete. Data exported to: ${dataFile}`);

    if (report.summary.readyForMigration) {
      console.log("\nNext steps:");
      console.log("1. Review exported migration data");
      console.log("2. Execute asset transfers (manual or automated)");
      console.log("3. Run actual migration script");
      console.log("4. Verify migrated state");
    }
  } catch (error) {
    console.error("Migration helper failed:", error);
    process.exit(1);
  }
}

// Run the migration helper if this script is executed directly
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { MigrationHelper };
