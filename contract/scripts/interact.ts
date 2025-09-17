import { ethers } from "hardhat";
import { InheritanceCore } from "../typechain-types";

export interface ContractConfig {
  contractAddress: string;
  signerAddress?: string;
}

export interface InheritanceParams {
  name: string;
  executor: string;
  requiresConfirmation: boolean;
  timeLock: {
    distributionType: number;
    unlockTime: number;
    vestingDuration: number;
    cliffDuration: number;
    milestoneTimestamps: number[];
    milestonePercentages: number[];
  };
}

export interface BeneficiaryParams {
  inheritanceId: number;
  beneficiaryAddress: string;
  allocationBasisPoints: number;
}

export interface DepositParams {
  inheritanceId: number;
  amount: string;
}

export interface ERC20DepositParams extends DepositParams {
  tokenContract: string;
}

export interface ERC721DepositParams {
  inheritanceId: number;
  nftContract: string;
  tokenIds: number[];
}

export class InheritanceContractInteraction {
  private contract: InheritanceCore;
  private signer: ethers.Signer;

  constructor(config: ContractConfig) {
    if (!config.contractAddress) {
      throw new Error("Contract address is required");
    }

    this.initializeContract(config);
  }

  private async initializeContract(config: ContractConfig): Promise<void> {
    const signers = await ethers.getSigners();

    if (config.signerAddress) {
      const targetSigner = signers.find(s => s.address === config.signerAddress);
      if (!targetSigner) {
        throw new Error(`Signer with address ${config.signerAddress} not found`);
      }
      this.signer = targetSigner;
    } else {
      this.signer = signers[0];
    }

    const InheritanceCore = await ethers.getContractFactory("InheritanceCore");
    this.contract = InheritanceCore.attach(config.contractAddress) as InheritanceCore;
  }

  async createInheritance(params: InheritanceParams): Promise<number> {
    try {
      const tx = await this.contract.createInheritance(
        params.name,
        params.executor,
        params.requiresConfirmation,
        params.timeLock
      );

      const receipt = await tx.wait();
      if (!receipt) {
        throw new Error("Transaction failed");
      }

      const event = receipt.logs.find(log => {
        try {
          const parsed = this.contract.interface.parseLog(log);
          return parsed?.name === "InheritanceCreated";
        } catch {
          return false;
        }
      });

      if (!event) {
        throw new Error("InheritanceCreated event not found");
      }

      const parsed = this.contract.interface.parseLog(event);
      return parsed?.args[0] as number;

    } catch (error) {
      throw new Error(`Failed to create inheritance: ${error}`);
    }
  }

  async addBeneficiary(params: BeneficiaryParams): Promise<void> {
    try {
      const tx = await this.contract.addBeneficiary(
        params.inheritanceId,
        params.beneficiaryAddress,
        params.allocationBasisPoints
      );

      await tx.wait();
    } catch (error) {
      throw new Error(`Failed to add beneficiary: ${error}`);
    }
  }

  async depositETH(params: DepositParams): Promise<void> {
    try {
      const tx = await this.contract.depositETH(params.inheritanceId, {
        value: ethers.parseEther(params.amount)
      });

      await tx.wait();
    } catch (error) {
      throw new Error(`Failed to deposit ETH: ${error}`);
    }
  }

  async depositERC20(params: ERC20DepositParams): Promise<void> {
    try {
      const tx = await this.contract.depositERC20(
        params.inheritanceId,
        params.tokenContract,
        ethers.parseEther(params.amount)
      );

      await tx.wait();
    } catch (error) {
      throw new Error(`Failed to deposit ERC20: ${error}`);
    }
  }

  async depositERC721(params: ERC721DepositParams): Promise<void> {
    try {
      const tx = await this.contract.depositERC721(
        params.inheritanceId,
        params.nftContract,
        params.tokenIds
      );

      await tx.wait();
    } catch (error) {
      throw new Error(`Failed to deposit ERC721: ${error}`);
    }
  }

  async triggerInheritance(inheritanceId: number): Promise<void> {
    try {
      const tx = await this.contract.triggerInheritance(inheritanceId);
      await tx.wait();
    } catch (error) {
      throw new Error(`Failed to trigger inheritance: ${error}`);
    }
  }

  async claimAssets(inheritanceId: number): Promise<void> {
    try {
      const tx = await this.contract.claimAssets(inheritanceId);
      await tx.wait();
    } catch (error) {
      throw new Error(`Failed to claim assets: ${error}`);
    }
  }

  async getInheritanceData(inheritanceId: number) {
    try {
      return await this.contract.getInheritanceData(inheritanceId);
    } catch (error) {
      throw new Error(`Failed to get inheritance data: ${error}`);
    }
  }

  async getBeneficiaryInfo(inheritanceId: number, beneficiaryAddress: string) {
    try {
      return await this.contract.getBeneficiaryInfo(inheritanceId, beneficiaryAddress);
    } catch (error) {
      throw new Error(`Failed to get beneficiary info: ${error}`);
    }
  }

  async getClaimableETH(inheritanceId: number, beneficiaryAddress: string): Promise<string> {
    try {
      const amount = await this.contract.getClaimableETH(inheritanceId, beneficiaryAddress);
      return ethers.formatEther(amount);
    } catch (error) {
      throw new Error(`Failed to get claimable ETH: ${error}`);
    }
  }

  async getTotalAssets(inheritanceId: number) {
    try {
      return await this.contract.getTotalAssets(inheritanceId);
    } catch (error) {
      throw new Error(`Failed to get total assets: ${error}`);
    }
  }

  async getContractBalance(): Promise<string> {
    try {
      const balance = await ethers.provider.getBalance(await this.contract.getAddress());
      return ethers.formatEther(balance);
    } catch (error) {
      throw new Error(`Failed to get contract balance: ${error}`);
    }
  }

  async validateInheritanceExists(inheritanceId: number): Promise<boolean> {
    try {
      await this.contract.getInheritanceData(inheritanceId);
      return true;
    } catch {
      return false;
    }
  }

  async hasRole(role: string, account: string): Promise<boolean> {
    try {
      return await this.contract.hasRole(ethers.id(role), account);
    } catch (error) {
      throw new Error(`Failed to check role: ${error}`);
    }
  }

  getContract(): InheritanceCore {
    return this.contract;
  }

  getSigner(): ethers.Signer {
    return this.signer;
  }

  async getSignerAddress(): Promise<string> {
    return await this.signer.getAddress();
  }
}

export async function createContractInteraction(config: ContractConfig): Promise<InheritanceContractInteraction> {
  const interaction = new InheritanceContractInteraction(config);
  return interaction;
}

export const DISTRIBUTION_TYPES = {
  IMMEDIATE: 0,
  LINEAR_VESTING: 1,
  CLIFF_VESTING: 2,
  MILESTONE_BASED: 3
} as const;

export const INHERITANCE_STATUS = {
  ACTIVE: 0,
  TRIGGERED: 1,
  COMPLETED: 2,
  DISPUTED: 3,
  FROZEN: 4
} as const;

export const ASSET_TYPES = {
  ETH: 0,
  ERC20: 1,
  ERC721: 2
} as const;

export function createTimeLock(
  distributionType: number,
  unlockTimeInDays: number = 0,
  vestingDurationInDays: number = 0,
  cliffDurationInDays: number = 0
) {
  const now = Math.floor(Date.now() / 1000);
  const dayInSeconds = 86400;

  return {
    distributionType,
    unlockTime: now + (unlockTimeInDays * dayInSeconds),
    vestingDuration: vestingDurationInDays * dayInSeconds,
    cliffDuration: cliffDurationInDays * dayInSeconds,
    milestoneTimestamps: [],
    milestonePercentages: []
  };
}

export function createMilestoneTimeLock(
  milestones: Array<{ daysFromNow: number; percentage: number }>
) {
  const now = Math.floor(Date.now() / 1000);
  const dayInSeconds = 86400;

  const timestamps = milestones.map(m => now + (m.daysFromNow * dayInSeconds));
  const percentages = milestones.map(m => m.percentage * 100); // Convert to basis points

  return {
    distributionType: DISTRIBUTION_TYPES.MILESTONE_BASED,
    unlockTime: now,
    vestingDuration: 0,
    cliffDuration: 0,
    milestoneTimestamps: timestamps,
    milestonePercentages: percentages
  };
}
