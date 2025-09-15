import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseEther, formatEther, Address } from "viem";
import {
  CONTRACT_ADDRESSES,
  INHERITANCE_CORE_ABI,
  InheritanceData,
  Beneficiary,
  Asset,
  TimeLock,
} from "@/lib/contracts";

export function useInheritanceContract() {
  const { address } = useAccount();
  const {
    writeContract,
    data: hash,
    error: writeError,
    isPending: isWritePending,
  } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  // Create a new inheritance vault
  const createInheritance = async (
    name: string,
    executor: Address,
    requiresConfirmation: boolean,
    timeLock: TimeLock,
  ) => {
    if (!address) throw new Error("Wallet not connected");

    const args = [
      name,
      executor,
      requiresConfirmation,
      {
        distributionType: timeLock.distributionType,
        unlockTime: timeLock.unlockTime,
        vestingDuration: timeLock.vestingDuration,
        cliffDuration: timeLock.cliffDuration,
        milestoneTimestamps: timeLock.milestoneTimestamps,
        milestonePercentages: timeLock.milestonePercentages,
      },
    ] as const;

    return writeContract({
      address: CONTRACT_ADDRESSES.InheritanceCore,
      abi: INHERITANCE_CORE_ABI,
      functionName: "createInheritance",
      args,
    });
  };

  // Add beneficiary to inheritance
  const addBeneficiary = async (
    inheritanceId: bigint,
    beneficiary: Address,
    allocationBasisPoints: bigint,
  ) => {
    return writeContract({
      address: CONTRACT_ADDRESSES.InheritanceCore,
      abi: INHERITANCE_CORE_ABI,
      functionName: "addBeneficiary",
      args: [inheritanceId, beneficiary, allocationBasisPoints],
    });
  };

  // Deposit ETH to inheritance vault
  const depositETH = async (inheritanceId: bigint, amount: string) => {
    return writeContract({
      address: CONTRACT_ADDRESSES.InheritanceCore,
      abi: INHERITANCE_CORE_ABI,
      functionName: "depositETH",
      args: [inheritanceId],
      value: parseEther(amount),
    });
  };

  // Deposit ERC20 tokens
  const depositERC20 = async (
    inheritanceId: bigint,
    tokenContract: Address,
    amount: bigint,
  ) => {
    return writeContract({
      address: CONTRACT_ADDRESSES.InheritanceCore,
      abi: INHERITANCE_CORE_ABI,
      functionName: "depositERC20",
      args: [inheritanceId, tokenContract, amount],
    });
  };

  // Deposit ERC721 NFTs
  const depositERC721 = async (
    inheritanceId: bigint,
    nftContract: Address,
    tokenIds: bigint[],
  ) => {
    return writeContract({
      address: CONTRACT_ADDRESSES.InheritanceCore,
      abi: INHERITANCE_CORE_ABI,
      functionName: "depositERC721",
      args: [inheritanceId, nftContract, tokenIds],
    });
  };

  // Trigger inheritance distribution
  const triggerInheritance = async (inheritanceId: bigint) => {
    return writeContract({
      address: CONTRACT_ADDRESSES.InheritanceCore,
      abi: INHERITANCE_CORE_ABI,
      functionName: "triggerInheritance",
      args: [inheritanceId],
    });
  };

  // Claim assets as beneficiary
  const claimAssets = async (inheritanceId: bigint) => {
    return writeContract({
      address: CONTRACT_ADDRESSES.InheritanceCore,
      abi: INHERITANCE_CORE_ABI,
      functionName: "claimAssets",
      args: [inheritanceId],
    });
  };

  return {
    // Write functions
    createInheritance,
    addBeneficiary,
    depositETH,
    depositERC20,
    depositERC721,
    triggerInheritance,
    claimAssets,

    // Transaction state
    hash,
    writeError,
    isWritePending,
    isConfirming,
    isConfirmed,
  };
}

// Hook to read inheritance data
export function useInheritanceData(inheritanceId: bigint) {
  return useReadContract({
    address: CONTRACT_ADDRESSES.InheritanceCore,
    abi: INHERITANCE_CORE_ABI,
    functionName: "getInheritanceData",
    args: [inheritanceId],
    query: {
      enabled: !!inheritanceId,
    },
  }) as {
    data: InheritanceData | undefined;
    isError: boolean;
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;
  };
}

// Hook to get beneficiary info
export function useBeneficiaryInfo(
  inheritanceId: bigint,
  beneficiary: Address,
) {
  return useReadContract({
    address: CONTRACT_ADDRESSES.InheritanceCore,
    abi: INHERITANCE_CORE_ABI,
    functionName: "getBeneficiaryInfo",
    args: [inheritanceId, beneficiary],
    query: {
      enabled: !!inheritanceId && !!beneficiary,
    },
  }) as {
    data: Beneficiary | undefined;
    isError: boolean;
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;
  };
}

// Hook to get claimable ETH amount
export function useClaimableETH(inheritanceId: bigint, beneficiary?: Address) {
  const { address } = useAccount();
  const targetAddress = beneficiary || address;

  return useReadContract({
    address: CONTRACT_ADDRESSES.InheritanceCore,
    abi: INHERITANCE_CORE_ABI,
    functionName: "getClaimableETH",
    args: [inheritanceId, targetAddress!],
    query: {
      enabled: !!inheritanceId && !!targetAddress,
    },
  }) as {
    data: bigint | undefined;
    isError: boolean;
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;
  };
}

// Hook to get all assets in inheritance
export function useInheritanceAssets(inheritanceId: bigint) {
  return useReadContract({
    address: CONTRACT_ADDRESSES.InheritanceCore,
    abi: INHERITANCE_CORE_ABI,
    functionName: "getTotalAssets",
    args: [inheritanceId],
    query: {
      enabled: !!inheritanceId,
    },
  }) as {
    data: Asset[] | undefined;
    isError: boolean;
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;
  };
}
