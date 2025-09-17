import { Address } from "viem";

// Contract addresses - Latest deployment on Somnia Testnet
export const CONTRACT_ADDRESSES = {
  InheritanceCore: "0x2E68CbB4BdA0b44fed48FA98cE3bff799fa7Fb3E" as Address,
  TimingManager: "0x848A1fBfde1e51F6091e8610Ff4Cf75Cfb638360" as Address,
  EmergencyManager: "0x9d7b2D97D4A85A2AbC882F8152D4791553789374" as Address,
};

// Contract ABIs - Extracted from compiled contract artifact
export const INHERITANCE_CORE_ABI = [
  // Core functions
  {
    inputs: [
      { internalType: "address", name: "executor", type: "address" },
      { internalType: "bool", name: "requiresConfirmation", type: "bool" },
      {
        internalType: "struct IInheritanceCore.TimeLock",
        name: "timeLock",
        type: "tuple",
        components: [
          {
            internalType: "enum IInheritanceCore.DistributionType",
            name: "distributionType",
            type: "uint8",
          },
          { internalType: "uint256", name: "unlockTime", type: "uint256" },
          { internalType: "uint256", name: "vestingDuration", type: "uint256" },
          { internalType: "uint256", name: "cliffDuration", type: "uint256" },
          {
            internalType: "uint256[]",
            name: "milestoneTimestamps",
            type: "uint256[]",
          },
          {
            internalType: "uint256[]",
            name: "milestonePercentages",
            type: "uint256[]",
          },
        ],
      },
    ],
    name: "createInheritance",
    outputs: [
      { internalType: "uint256", name: "inheritanceId", type: "uint256" },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "inheritanceId", type: "uint256" },
      { internalType: "address", name: "beneficiary", type: "address" },
      {
        internalType: "uint256",
        name: "allocationBasisPoints",
        type: "uint256",
      },
    ],
    name: "addBeneficiary",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "inheritanceId", type: "uint256" },
    ],
    name: "depositSTT",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "inheritanceId", type: "uint256" },
      { internalType: "address", name: "tokenContract", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "depositERC20",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "inheritanceId", type: "uint256" },
      { internalType: "address", name: "nftContract", type: "address" },
      { internalType: "uint256[]", name: "tokenIds", type: "uint256[]" },
    ],
    name: "depositERC721",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "inheritanceId", type: "uint256" },
    ],
    name: "triggerInheritance",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "inheritanceId", type: "uint256" },
    ],
    name: "claimAssets",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "inheritanceId", type: "uint256" },
    ],
    name: "getInheritanceData",
    outputs: [
      {
        internalType: "struct IInheritanceCore.InheritanceData",
        name: "",
        type: "tuple",
        components: [
          { internalType: "address", name: "owner", type: "address" },
          {
            internalType: "enum IInheritanceCore.InheritanceStatus",
            name: "status",
            type: "uint8",
          },
          { internalType: "uint256", name: "createdAt", type: "uint256" },
          { internalType: "uint256", name: "triggeredAt", type: "uint256" },
          {
            internalType: "struct IInheritanceCore.TimeLock",
            name: "timeLock",
            type: "tuple",
            components: [
              {
                internalType: "enum IInheritanceCore.DistributionType",
                name: "distributionType",
                type: "uint8",
              },
              { internalType: "uint256", name: "unlockTime", type: "uint256" },
              {
                internalType: "uint256",
                name: "vestingDuration",
                type: "uint256",
              },
              {
                internalType: "uint256",
                name: "cliffDuration",
                type: "uint256",
              },
              {
                internalType: "uint256[]",
                name: "milestoneTimestamps",
                type: "uint256[]",
              },
              {
                internalType: "uint256[]",
                name: "milestonePercentages",
                type: "uint256[]",
              },
            ],
          },
          {
            internalType: "uint256",
            name: "totalBeneficiaries",
            type: "uint256",
          },
          { internalType: "bool", name: "requiresConfirmation", type: "bool" },
          { internalType: "address", name: "executor", type: "address" },
          {
            internalType: "uint256",
            name: "totalSTTDeposited",
            type: "uint256",
          },
          { internalType: "uint256", name: "totalSTTClaimed", type: "uint256" },
        ],
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "inheritanceId", type: "uint256" },
      { internalType: "address", name: "beneficiary", type: "address" },
    ],
    name: "getBeneficiaryInfo",
    outputs: [
      {
        internalType: "struct IInheritanceCore.Beneficiary",
        name: "",
        type: "tuple",
        components: [
          { internalType: "address", name: "wallet", type: "address" },
          {
            internalType: "uint256",
            name: "allocationBasisPoints",
            type: "uint256",
          },
          { internalType: "bool", name: "isActive", type: "bool" },
          { internalType: "uint256", name: "claimedSTT", type: "uint256" },
          { internalType: "uint256", name: "addedAt", type: "uint256" },
        ],
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "inheritanceId", type: "uint256" },
      { internalType: "address", name: "beneficiary", type: "address" },
    ],
    name: "getClaimableSTT",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "inheritanceId", type: "uint256" },
    ],
    name: "getTotalAssets",
    outputs: [
      {
        internalType: "struct IInheritanceCore.Asset[]",
        name: "",
        type: "tuple[]",
        components: [
          {
            internalType: "enum IInheritanceCore.AssetType",
            name: "assetType",
            type: "uint8",
          },
          { internalType: "address", name: "contractAddress", type: "address" },
          { internalType: "uint256", name: "amount", type: "uint256" },
          { internalType: "uint256[]", name: "tokenIds", type: "uint256[]" },
          { internalType: "bool", name: "isActive", type: "bool" },
          { internalType: "uint256", name: "depositedAt", type: "uint256" },
        ],
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  // Additional view functions for completeness
  {
    inputs: [
      { internalType: "uint256", name: "inheritanceId", type: "uint256" },
      { internalType: "address", name: "beneficiary", type: "address" },
    ],
    name: "hasClaimedSTT",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "inheritanceId", type: "uint256" },
      { internalType: "address", name: "beneficiary", type: "address" },
    ],
    name: "getAssetClaimingStatus",
    outputs: [{ internalType: "bool[]", name: "claimed", type: "bool[]" }],
    stateMutability: "view",
    type: "function",
  },
  // Events
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "inheritanceId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    name: "InheritanceCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "inheritanceId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "beneficiary",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "allocationBasisPoints",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    name: "BeneficiaryAdded",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "inheritanceId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "enum IInheritanceCore.AssetType",
        name: "assetType",
        type: "uint8",
      },
      {
        indexed: true,
        internalType: "address",
        name: "contractAddress",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256[]",
        name: "tokenIds",
        type: "uint256[]",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    name: "AssetDeposited",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "inheritanceId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "beneficiary",
        type: "address",
      },
      {
        indexed: false,
        internalType: "enum IInheritanceCore.AssetType",
        name: "assetType",
        type: "uint8",
      },
      {
        indexed: true,
        internalType: "address",
        name: "contractAddress",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256[]",
        name: "tokenIds",
        type: "uint256[]",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    name: "AssetClaimed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "inheritanceId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "triggeredBy",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    name: "InheritanceTriggered",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "inheritanceId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    name: "InheritanceCompleted",
    type: "event",
  },
] as const;

// Enums - Updated to match contract
export enum InheritanceStatus {
  ACTIVE = 0,
  TRIGGERED = 1,
  COMPLETED = 2,
  CANCELLED = 3,
}

export enum AssetType {
  STT = 0, // Updated from ETH to STT
  ERC20 = 1,
  ERC721 = 2,
}

export enum DistributionType {
  IMMEDIATE = 0,
  LINEAR_VESTING = 1,
  CLIFF_VESTING = 2,
  MILESTONE_BASED = 3,
}

// Type definitions - Updated to match contract structure
export interface InheritanceData {
  owner: string;
  status: InheritanceStatus;
  createdAt: bigint;
  triggeredAt: bigint;
  timeLock: TimeLock;
  totalBeneficiaries: bigint;
  requiresConfirmation: boolean;
  executor: string;
  totalSTTDeposited: bigint; // Updated from totalETHDeposited
  totalSTTClaimed: bigint; // Updated from totalETHClaimed
}

export interface Beneficiary {
  wallet: string;
  allocationBasisPoints: bigint;
  isActive: boolean;
  claimedSTT: bigint; // Updated from claimedETH
  addedAt: bigint;
}

export interface Asset {
  assetType: AssetType;
  contractAddress: string;
  amount: bigint;
  tokenIds: readonly bigint[];
  isActive: boolean;
  depositedAt: bigint;
}

export interface TimeLock {
  distributionType: DistributionType;
  unlockTime: bigint;
  vestingDuration: bigint;
  cliffDuration: bigint;
  milestoneTimestamps: readonly bigint[];
  milestonePercentages: readonly bigint[];
}
