import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { useChainId } from "wagmi";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Get the native currency symbol for the current chain
export function getNativeCurrencySymbol(chainId: number): string {
  switch (chainId) {
    case 50312: // Somnia network
      return "STT";
    case 1: // Ethereum mainnet
      return "ETH";
    case 8453: // Base
      return "ETH";
    default:
      return "ETH";
  }
}

// Hook to get current native currency symbol
export function useNativeCurrency() {
  const chainId = useChainId();
  return getNativeCurrencySymbol(chainId);
}
