import { Address } from "viem";

// Contract addresses - Fresh deployment on Somnia Testnet
export const CONTRACT_ADDRESSES = {
  InheritanceCore: "0xD83Bf43AF32269732e96E88aa8D0745416f1A9F2" as Address,
  TimingManager: "0x848A1fBfde1e51F6091e8610Ff4Cf75Cfb638360" as Address,
  EmergencyManager: "0x9d7b2D97D4A85A2AbC882F8152D4791553789374" as Address,
};

// Contract ABIs
export const INHERITANCE_CORE_ABI = [
  // Core functions
  {
    inputs: [
      { internalType: "string", name: "name", type: "string" },
      { internalType: "address", name: "executor", type: "address" },
      { internalType: "bool", name: "requiresConfirmation", type: "bool" },
      {
        internalType: "tuple",
        name: "timeLock",
        type: "tuple",
        components: [
          {
            internalType: "enum DistributionType",
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
    name: "depositETH",
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
        internalType: "tuple",
        name: "",
        type: "tuple",
        components: [
          { internalType: "address", name: "owner", type: "address" },
          { internalType: "string", name: "name", type: "string" },
          {
            internalType: "enum InheritanceStatus",
            name: "status",
            type: "uint8",
          },
          { internalType: "uint256", name: "createdAt", type: "uint256" },
          { internalType: "uint256", name: "triggeredAt", type: "uint256" },
          {
            internalType: "uint256",
            name: "totalETHDeposited",
            type: "uint256",
          },
          { internalType: "uint256", name: "totalETHClaimed", type: "uint256" },
          {
            internalType: "uint256",
            name: "totalBeneficiaries",
            type: "uint256",
          },
          { internalType: "address", name: "executor", type: "address" },
          { internalType: "bool", name: "requiresConfirmation", type: "bool" },
          {
            internalType: "tuple",
            name: "timeLock",
            type: "tuple",
            components: [
              {
                internalType: "enum DistributionType",
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
        internalType: "tuple",
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
          { internalType: "uint256", name: "addedAt", type: "uint256" },
          { internalType: "uint256", name: "claimedETH", type: "uint256" },
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
    name: "getClaimableETH",
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
        internalType: "tuple[]",
        name: "",
        type: "tuple[]",
        components: [
          { internalType: "enum AssetType", name: "assetType", type: "uint8" },
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
      { indexed: false, internalType: "string", name: "name", type: "string" },
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
        internalType: "uint8",
        name: "assetType",
        type: "uint8",
      },
      {
        indexed: false,
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
] as const;

// Enums
export enum InheritanceStatus {
  ACTIVE = 0,
  TRIGGERED = 1,
  COMPLETED = 2,
  CANCELLED = 3,
}

export enum AssetType {
  ETH = 0,
  ERC20 = 1,
  ERC721 = 2,
}

export enum DistributionType {
  IMMEDIATE = 0,
  LINEAR_VESTING = 1,
  CLIFF_VESTING = 2,
  MILESTONE_BASED = 3,
}

// Type definitions
export interface InheritanceData {
  owner: string;
  name: string;
  status: InheritanceStatus;
  createdAt: bigint;
  triggeredAt: bigint;
  totalETHDeposited: bigint;
  totalETHClaimed: bigint;
  totalBeneficiaries: bigint;
  executor: string;
  requiresConfirmation: boolean;
  timeLock: TimeLock;
}

export interface Beneficiary {
  wallet: string;
  allocationBasisPoints: bigint;
  isActive: boolean;
  addedAt: bigint;
  claimedETH: bigint;
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
