import { useState } from "react";
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
} from "wagmi";
import {
  INHERITANCE_CONTRACT_ADDRESS,
  INHERITANCE_CONTRACT_ABI,
  InheritanceDetails,
  formatSTT,
} from "../lib/contracts";
import { shortenAddress, formatDate, isValidAddress } from "../lib/utils";
import CountdownTimer from "./CountdownTimer";
import toast from "react-hot-toast";

interface BeneficiaryPanelProps {
  userAddress: string;
}

export default function BeneficiaryPanel({
  userAddress,
}: BeneficiaryPanelProps) {
  const [checkAddress, setCheckAddress] = useState("");
  const [checkedInheritance, setCheckedInheritance] =
    useState<InheritanceDetails | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<bigint>(0n);

  const { writeContract, data: hash } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash,
  });

  // Read inheritance details for the checked address
  const { data: inheritanceData, refetch } = useReadContract({
    address: INHERITANCE_CONTRACT_ADDRESS as `0x${string}`,
    abi: INHERITANCE_CONTRACT_ABI,
    functionName: "getInheritanceDetails",
    args: checkAddress ? [checkAddress as `0x${string}`] : undefined,
    query: {
      enabled: !!checkAddress && isValidAddress(checkAddress),
    },
  });

  // Read time remaining for the checked address
  const { data: timeRemainingData } = useReadContract({
    address: INHERITANCE_CONTRACT_ADDRESS as `0x${string}`,
    abi: INHERITANCE_CONTRACT_ABI,
    functionName: "getTimeUntilTrigger",
    args: checkAddress ? [checkAddress as `0x${string}`] : undefined,
    query: {
      enabled: !!checkAddress && isValidAddress(checkAddress),
      refetchInterval: 1000, // Update every second
    },
  });

  const handleCheck = () => {
    if (!isValidAddress(checkAddress)) {
      toast.error("Please enter a valid address");
      return;
    }

    if (inheritanceData) {
      const inheritance = inheritanceData as InheritanceDetails;
      if (!inheritance.exists) {
        toast.error("No inheritance found for this address");
        setCheckedInheritance(null);
        return;
      }

      if (inheritance.beneficiary.toLowerCase() !== userAddress.toLowerCase()) {
        toast.error("You are not the beneficiary of this inheritance");
        setCheckedInheritance(null);
        return;
      }

      if (inheritance.executed) {
        toast("This inheritance has already been executed", { icon: "ℹ️" });
      }

      setCheckedInheritance(inheritance);
      setTimeRemaining((timeRemainingData as bigint) || 0n);
    }
  };

  const handleClaimInheritance = async () => {
    if (!checkedInheritance) return;

    try {
      await writeContract({
        address: INHERITANCE_CONTRACT_ADDRESS as `0x${string}`,
        abi: INHERITANCE_CONTRACT_ABI,
        functionName: "executeInheritance",
        args: [checkAddress as `0x${string}`],
      });
      toast.success("Inheritance claim initiated!");
    } catch (error: any) {
      console.error("Error claiming inheritance:", error);
      toast.error(error.shortMessage || "Failed to claim inheritance");
    }
  };

  const isTriggered = timeRemainingData
    ? (timeRemainingData as bigint) <= 0n
    : false;
  const canClaim =
    checkedInheritance &&
    !checkedInheritance.executed &&
    checkedInheritance.amount > 0n &&
    isTriggered;

  return (
    <div className="card">
      <h2 className="text-2xl font-bold text-white mb-6">
        Check Inheritance as Beneficiary
      </h2>

      <div className="space-y-6">
        {/* Address Input */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Owner Address to Check
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="0x... (address of inheritance owner)"
              value={checkAddress}
              onChange={(e) => setCheckAddress(e.target.value)}
              className="input-field flex-1"
            />
            <button
              onClick={handleCheck}
              disabled={!checkAddress}
              className="btn-primary px-6"
            >
              Check
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Enter the address of someone who might have set you as their
            beneficiary
          </p>
        </div>

        {/* Inheritance Details */}
        {checkedInheritance && (
          <div className="space-y-4">
            <div className="glass p-4 rounded-lg">
              <h3 className="font-medium text-white mb-3">Inheritance Found</h3>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Owner:</span>
                    <span className="text-white font-mono">
                      {shortenAddress(checkAddress)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Amount:</span>
                    <span className="text-white font-medium">
                      {formatSTT(checkedInheritance.amount)} STT
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Last Check-in:</span>
                    <span className="text-white">
                      {formatDate(checkedInheritance.lastCheckIn)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status:</span>
                    <span
                      className={`font-medium ${
                        checkedInheritance.executed
                          ? "text-gray-400"
                          : isTriggered
                          ? "text-red-400"
                          : "text-green-400"
                      }`}
                    >
                      {checkedInheritance.executed
                        ? "Executed"
                        : isTriggered
                        ? "Claimable"
                        : "Active"}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-white mb-2">
                    Deadman Switch
                  </h4>
                  <CountdownTimer
                    timeRemaining={(timeRemainingData as bigint) || 0n}
                    className="mb-2"
                  />
                  <p className="text-xs text-gray-400">
                    {isTriggered
                      ? "You can now claim this inheritance"
                      : "Time until inheritance becomes claimable"}
                  </p>
                </div>
              </div>
            </div>

            {/* Message from Owner */}
            {checkedInheritance.message && (
              <div className="glass p-4 rounded-lg">
                <h3 className="font-medium text-white mb-2">
                  Message from Owner
                </h3>
                <p className="text-gray-300 italic">
                  "{checkedInheritance.message}"
                </p>
              </div>
            )}

            {/* Claim Button */}
            {canClaim && (
              <div className="glass p-4 rounded-lg border-green-500/50">
                <h3 className="font-medium text-green-400 mb-3">
                  🎉 Inheritance Ready to Claim
                </h3>
                <p className="text-sm text-gray-300 mb-4">
                  The deadman switch has been triggered. You can now claim this
                  inheritance.
                </p>
                <button
                  onClick={handleClaimInheritance}
                  disabled={isConfirming}
                  className="w-full btn-success py-3 font-bold"
                >
                  {isConfirming ? (
                    <div className="flex items-center justify-center">
                      <div className="loading-spinner mr-2"></div>
                      Claiming...
                    </div>
                  ) : (
                    `Claim ${formatSTT(checkedInheritance.amount)} STT`
                  )}
                </button>
              </div>
            )}

            {/* Information Panels */}
            {checkedInheritance.executed && (
              <div className="glass p-4 rounded-lg border-gray-500/50">
                <h3 className="font-medium text-gray-400 mb-2">
                  Inheritance Already Claimed
                </h3>
                <p className="text-sm text-gray-300">
                  This inheritance has already been executed and claimed.
                </p>
              </div>
            )}

            {!isTriggered && !checkedInheritance.executed && (
              <div className="glass p-4 rounded-lg border-blue-500/50">
                <h3 className="font-medium text-blue-400 mb-2">
                  Inheritance Not Yet Claimable
                </h3>
                <p className="text-sm text-gray-300 mb-2">
                  The owner is still active and checking in regularly. The
                  inheritance will become claimable if they don't check in
                  within the specified timeframe.
                </p>
                <p className="text-xs text-gray-400">
                  You'll be notified when the deadman switch is triggered.
                </p>
              </div>
            )}

            {checkedInheritance.amount === 0n &&
              !checkedInheritance.executed && (
                <div className="glass p-4 rounded-lg border-yellow-500/50">
                  <h3 className="font-medium text-yellow-400 mb-2">
                    No Funds Available
                  </h3>
                  <p className="text-sm text-gray-300">
                    This inheritance exists but currently has no funds
                    deposited.
                  </p>
                </div>
              )}
          </div>
        )}

        {/* Help Text */}
        <div className="glass p-4 rounded-lg">
          <h3 className="font-medium text-white mb-2">How to Use</h3>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>
              • Enter the wallet address of someone who might have named you as
              beneficiary
            </li>
            <li>
              • If an inheritance exists and you're the beneficiary, you'll see
              the details
            </li>
            <li>
              • You can only claim inheritances where the deadman switch has
              been triggered
            </li>
            <li>• Each inheritance can only be claimed once</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
