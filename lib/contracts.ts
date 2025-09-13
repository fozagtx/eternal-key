export const INHERITANCE_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '';

export const INHERITANCE_CONTRACT_ABI = [
  // Events
  "event InheritanceCreated(address indexed owner, address indexed beneficiary, uint256 deadmanDuration, string message)",
  "event FundsDeposited(address indexed owner, uint256 amount, uint256 totalAmount)",
  "event FundsWithdrawn(address indexed owner, uint256 amount, uint256 remainingAmount)",
  "event CheckInPerformed(address indexed owner, uint256 timestamp)",
  "event BeneficiaryUpdated(address indexed owner, address indexed oldBeneficiary, address indexed newBeneficiary)",
  "event DeadmanSwitchUpdated(address indexed owner, uint256 oldDuration, uint256 newDuration)",
  "event InheritanceExecuted(address indexed owner, address indexed beneficiary, uint256 amount, string message)",

  // Read functions
  "function inheritances(address) external view returns (address beneficiary, uint256 amount, uint256 deadmanDuration, uint256 lastCheckIn, string memory message, bool exists, bool executed)",
  "function isDeadmanSwitchTriggered(address owner) external view returns (bool)",
  "function getInheritanceDetails(address owner) external view returns (tuple(address beneficiary, uint256 amount, uint256 deadmanDuration, uint256 lastCheckIn, string message, bool exists, bool executed))",
  "function getTimeUntilTrigger(address owner) external view returns (uint256)",
  "function MIN_DEADMAN_DURATION() external view returns (uint256)",
  "function MAX_DEADMAN_DURATION() external view returns (uint256)",

  // Write functions
  "function createInheritance(address beneficiary, uint256 deadmanDuration, string memory message) external payable",
  "function depositFunds() external payable",
  "function withdrawFunds(uint256 amount) external",
  "function checkIn() external",
  "function updateBeneficiary(address newBeneficiary) external",
  "function updateDeadmanSwitch(uint256 newDuration) external",
  "function executeInheritance(address owner) external",
] as const;

export interface InheritanceDetails {
  beneficiary: string;
  amount: bigint;
  deadmanDuration: bigint;
  lastCheckIn: bigint;
  message: string;
  exists: boolean;
  executed: boolean;
}

export const formatTimeRemaining = (seconds: bigint): string => {
  if (seconds <= 0n) return 'Triggered';
  
  const totalSeconds = Number(seconds);
  const days = Math.floor(totalSeconds / (24 * 60 * 60));
  const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
  const secs = totalSeconds % 60;

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
};

export const formatSTT = (amount: bigint): string => {
  const ether = Number(amount) / 1e18;
  return ether.toFixed(4);
};