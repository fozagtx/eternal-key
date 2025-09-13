// import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: string[]) {
  return inputs.filter(Boolean).join(' ');
}

export const shortenAddress = (address: string, chars = 4): string => {
  if (!address) return '';
  return `${address.substring(0, chars + 2)}...${address.substring(address.length - chars)}`;
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy: ', err);
    return false;
  }
};

export const formatDate = (timestamp: bigint): string => {
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
};

export const isValidAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

export const parseSTT = (amount: string): bigint => {
  try {
    const num = parseFloat(amount);
    if (isNaN(num) || num < 0) return 0n;
    return BigInt(Math.floor(num * 1e18));
  } catch {
    return 0n;
  }
};

export const DURATION_OPTIONS = [
  { value: 1, label: '1 Day', seconds: 24 * 60 * 60 },
  { value: 3, label: '3 Days', seconds: 3 * 24 * 60 * 60 },
  { value: 7, label: '1 Week', seconds: 7 * 24 * 60 * 60 },
  { value: 14, label: '2 Weeks', seconds: 14 * 24 * 60 * 60 },
  { value: 30, label: '1 Month', seconds: 30 * 24 * 60 * 60 },
  { value: 90, label: '3 Months', seconds: 90 * 24 * 60 * 60 },
  { value: 180, label: '6 Months', seconds: 180 * 24 * 60 * 60 },
  { value: 365, label: '1 Year', seconds: 365 * 24 * 60 * 60 },
];