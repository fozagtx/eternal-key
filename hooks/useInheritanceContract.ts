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
  DeadManSwitch,
  SwitchStatus,
} from "@/lib/contracts";

export function useDeadManSwitch() {
  const { address } = useAccount();
  const {
    writeContract,
    data: hash,
    error: writeError,
    isPending: isWritePending,
  } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });
  const initializeSwitch = async (beneficiary: Address, deadline: bigint) => {
    if (!address) throw new Error("Wallet not connected");

    return writeContract({
      address: CONTRACT_ADDRESSES.InheritanceCore,
      abi: INHERITANCE_CORE_ABI,
      functionName: "initialize",
      args: [beneficiary, deadline],
    });
  };
  const deposit = async (amount: string) => {
    if (!address) throw new Error("Wallet not connected");
    return writeContract({
      address: CONTRACT_ADDRESSES.InheritanceCore,
      abi: INHERITANCE_CORE_ABI,
      functionName: "deposit",
      value: parseEther(amount),
    });
  };
  const checkIn = async (newDeadline: bigint) => {
    if (!address) throw new Error("Wallet not connected");

    return writeContract({
      address: CONTRACT_ADDRESSES.InheritanceCore,
      abi: INHERITANCE_CORE_ABI,
      functionName: "checkIn",
      args: [newDeadline],
    });
  };
  const claim = async () => {
    if (!address) throw new Error("Wallet not connected");

    return writeContract({
      address: CONTRACT_ADDRESSES.InheritanceCore,
      abi: INHERITANCE_CORE_ABI,
      functionName: "claim",
    });
  };

  const cancel = async () => {
    if (!address) throw new Error("Wallet not connected");

    return writeContract({
      address: CONTRACT_ADDRESSES.InheritanceCore,
      abi: INHERITANCE_CORE_ABI,
      functionName: "cancel",
    });
  };

  return {
    initializeSwitch,
    deposit,
    checkIn,
    claim,
    cancel,
    hash,
    error: writeError,
    isPending: isWritePending,
    isConfirming,
    isConfirmed,
  };
}

export function useDeadManSwitchData() {
  const { address } = useAccount();

  return useReadContract({
    address: CONTRACT_ADDRESSES.InheritanceCore,
    abi: INHERITANCE_CORE_ABI,
    functionName: "getSwitch",
    query: {
      enabled: !!address,
    },
  }) as {
    data: DeadManSwitch | undefined;
    isError: boolean;
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;
  };
}

export function useIsDeadlineExpired() {
  const { address } = useAccount();

  return useReadContract({
    address: CONTRACT_ADDRESSES.InheritanceCore,
    abi: INHERITANCE_CORE_ABI,
    functionName: "isDeadlineExpired",
    query: {
      enabled: !!address,
      refetchInterval: 1000,
    },
  }) as {
    data: boolean | undefined;
    isError: boolean;
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;
  };
}

export function useTimeRemaining() {
  const { address } = useAccount();

  return useReadContract({
    address: CONTRACT_ADDRESSES.InheritanceCore,
    abi: INHERITANCE_CORE_ABI,
    functionName: "getTimeRemaining",
    query: {
      enabled: !!address,
      refetchInterval: 1000,
    },
  }) as {
    data: bigint | undefined;
    isError: boolean;
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;
  };
}

export function useSwitchStatus() {
  const { address } = useAccount();

  return useReadContract({
    address: CONTRACT_ADDRESSES.InheritanceCore,
    abi: INHERITANCE_CORE_ABI,
    functionName: "getStatus",
    query: {
      enabled: !!address,
    },
  }) as {
    data: SwitchStatus | undefined;
    isError: boolean;
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;
  };
}
