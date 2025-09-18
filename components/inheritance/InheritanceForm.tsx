"use client";

import { useState, useEffect } from "react";
import { Address, parseEther } from "viem";
import { useAccount, useWaitForTransactionReceipt } from "wagmi";
import { Button } from "@/components/ui/button";
import {
  useDeadManSwitch,
  useDeadManSwitchData,
  useIsDeadlineExpired,
  useTimeRemaining,
  useSwitchStatus,
} from "@/hooks/useInheritanceContract";
import { SwitchStatus } from "@/lib/contracts";

export function InheritanceDashboard() {
  const { address } = useAccount();
  const {
    initializeSwitch,
    deposit,
    checkIn,
    claim,
    cancel,
    hash,
    isPending,
    error,
  } = useDeadManSwitch();

  const { data: receipt, isSuccess } = useWaitForTransactionReceipt({ hash });
  const { data: switchData, refetch: refetchSwitch } = useDeadManSwitchData();
  const { data: isExpired } = useIsDeadlineExpired();
  const { data: timeRemaining } = useTimeRemaining();
  const { data: status } = useSwitchStatus();

  const [step, setStep] = useState<"setup" | "manage">("setup");
  const [formData, setFormData] = useState({
    beneficiaryAddress: "",
    depositAmount: "0.01",
    deadlineHours: "24", // 24 hours default
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Check if a switch already exists
  const hasSwitchAlready = Boolean(
    switchData?.owner &&
      switchData.owner !== "0x0000000000000000000000000000000000000000",
  );

  // Check if the switch is expired
  const isSwitchExpired = Boolean(isExpired && hasSwitchAlready);

  useEffect(() => {
    if (hasSwitchAlready) {
      setStep("manage");
    }
  }, [hasSwitchAlready]);

  // Force refresh switch data on mount
  useEffect(() => {
    if (address) {
      refetchSwitch();
    }
  }, [address, refetchSwitch]);

  useEffect(() => {
    if (isSuccess && receipt) {
      refetchSwitch();
    }
  }, [isSuccess, receipt, refetchSwitch]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.beneficiaryAddress) {
      newErrors.beneficiaryAddress = "Beneficiary address is required";
    } else if (!/^0x[a-fA-F0-9]{40}$/.test(formData.beneficiaryAddress)) {
      newErrors.beneficiaryAddress = "Invalid Ethereum address";
    } else if (
      formData.beneficiaryAddress.toLowerCase() === address?.toLowerCase()
    ) {
      newErrors.beneficiaryAddress = "Beneficiary cannot be the same as owner";
    }

    if (!formData.depositAmount || parseFloat(formData.depositAmount) <= 0) {
      newErrors.depositAmount = "Deposit amount must be greater than 0";
    }

    if (!formData.deadlineHours || parseFloat(formData.deadlineHours) <= 0) {
      newErrors.deadlineHours = "Deadline must be greater than 0 hours";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInitialize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Double-check if switch already exists
    await refetchSwitch();
    if (hasSwitchAlready) {
      setErrors({
        general:
          "A switch already exists for your account. Please cancel it first.",
      });
      setStep("manage");
      return;
    }

    try {
      const deadlineTimestamp = BigInt(
        Math.floor(Date.now() / 1000) +
          Math.floor(parseFloat(formData.deadlineHours) * 3600),
      );

      await initializeSwitch(
        formData.beneficiaryAddress as Address,
        deadlineTimestamp,
      );
    } catch (error: any) {
      console.error("Failed to initialize switch:", error);

      // Check for specific switch already exists error
      if (
        error?.message?.includes("SwitchAlreadyInitialized") ||
        error?.message?.includes("Internal JSON-RPC error")
      ) {
        setErrors({
          general:
            "A switch already exists. Please refresh the page or cancel the existing switch.",
        });
        setStep("manage");
        await refetchSwitch();
      } else {
        setErrors({ general: "Failed to create switch. Please try again." });
      }
    }
  };

  const handleDeposit = async () => {
    if (isSwitchExpired) {
      alert(
        "Cannot deposit to expired switch. Please cancel and create a new one.",
      );
      return;
    }
    try {
      await deposit(formData.depositAmount);
    } catch (error) {
      console.error("Deposit failed:", error);
      alert("Deposit failed. The switch may be expired or invalid.");
    }
  };

  const handleCheckIn = async () => {
    try {
      const newDeadline = BigInt(
        Math.floor(Date.now() / 1000) +
          Math.floor(parseFloat(formData.deadlineHours) * 3600),
      );
      await checkIn(newDeadline);
    } catch (error) {
      console.error("Failed to check in:", error);
    }
  };

  const handleClaim = async () => {
    try {
      await claim();
    } catch (error) {
      console.error("Failed to claim:", error);
    }
  };

  const handleCancel = async () => {
    try {
      await cancel();
      setStep("setup"); // Go back to setup after canceling
    } catch (error) {
      console.error("Failed to cancel:", error);
    }
  };

  const formatTimeRemaining = (seconds: bigint) => {
    const totalSeconds = Number(seconds);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  };

  const formatBalance = (balance: bigint) => {
    return parseFloat((Number(balance) / 1e18).toFixed(6));
  };

  // Management view for existing switches
  if (step === "manage" && switchData) {
    const isOwner = address === switchData.owner;
    const isBeneficiary = address === switchData.beneficiary;

    return (
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Dead Man's Switch Dashboard
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {isOwner ? "Manage your switch" : "Beneficiary view"}
            </p>
          </div>

          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
              <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                Status
              </h3>
              <p className="text-blue-900 dark:text-blue-100 font-bold">
                {status === SwitchStatus.ACTIVE
                  ? "Active"
                  : status === SwitchStatus.CLAIMED
                    ? "Claimed"
                    : status === SwitchStatus.CANCELLED
                      ? "Cancelled"
                      : "Inactive"}
              </p>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
              <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                Balance
              </h3>
              <p className="text-green-900 dark:text-green-100 font-bold">
                {formatBalance(switchData.balance)} STT
              </p>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4">
              <h3 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">
                Time Left
              </h3>
              <p className="text-purple-900 dark:text-purple-100 font-bold">
                {timeRemaining ? formatTimeRemaining(timeRemaining) : "Expired"}
              </p>
            </div>
          </div>

          {/* Expired Switch Warning */}
          {isOwner && isSwitchExpired && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-700 mb-6">
              <h3 className="font-bold text-red-800 dark:text-red-200 mb-2">
                ⚠️ Switch Expired!
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                Your switch deadline has passed. You cannot deposit or check-in
                to an expired switch. Cancel it to recover any remaining funds,
                then create a new one.
              </p>
              <Button
                onClick={handleCancel}
                disabled={isPending}
                variant="destructive"
                size="sm"
              >
                {isPending ? "Canceling..." : "Cancel Expired Switch"}
              </Button>
            </div>
          )}

          {/* Owner Controls */}
          {isOwner && status === SwitchStatus.ACTIVE && !isSwitchExpired && (
            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Additional Deposit (STT)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0.001"
                    value={formData.depositAmount}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        depositAmount: e.target.value,
                      }))
                    }
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Extend Deadline (Hours)
                  </label>
                  <input
                    type="number"
                    value={formData.deadlineHours}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        deadlineHours: e.target.value,
                      }))
                    }
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="24"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={handleDeposit}
                  disabled={isPending}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {isPending ? "Depositing..." : "Deposit STT"}
                </Button>
                <Button
                  onClick={handleCheckIn}
                  disabled={isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isPending ? "Checking In..." : "Check In"}
                </Button>
                <Button
                  onClick={handleCancel}
                  disabled={isPending}
                  variant="destructive"
                >
                  {isPending ? "Canceling..." : "Cancel Switch"}
                </Button>
              </div>
            </div>
          )}

          {/* Beneficiary Claim */}
          {isBeneficiary &&
            isSwitchExpired &&
            status === SwitchStatus.ACTIVE && (
              <div className="mb-6">
                <Button
                  onClick={handleClaim}
                  disabled={isPending}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-lg"
                >
                  {isPending
                    ? "Claiming..."
                    : `Claim ${formatBalance(switchData.balance)} STT`}
                </Button>
              </div>
            )}

          {/* Details */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
            <h3 className="font-semibold mb-3">Switch Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Owner:</span>
                <p className="font-mono text-xs break-all">
                  {switchData.owner}
                </p>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">
                  Beneficiary:
                </span>
                <p className="font-mono text-xs break-all">
                  {switchData.beneficiary}
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-red-800 dark:text-red-200 text-sm">
                {error.message}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4">
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Create Dead Man's Switch
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Set up automated inheritance for your STT tokens
          </p>

          {/* Refresh button for detecting existing switches */}
          <div className="mt-4">
            <Button
              type="button"
              onClick={() => refetchSwitch()}
              disabled={isPending}
              variant="outline"
              size="sm"
            >
              🔄 Check for Existing Switch
            </Button>
          </div>
        </div>

        <form onSubmit={handleInitialize} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Beneficiary Address *
            </label>
            <input
              type="text"
              value={formData.beneficiaryAddress}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  beneficiaryAddress: e.target.value,
                }))
              }
              className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm"
              placeholder="0x1234567890abcdef1234567890abcdef12345678"
            />
            {errors.beneficiaryAddress && (
              <p className="text-red-600 text-sm mt-1">
                {errors.beneficiaryAddress}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Initial Deposit (STT) *
            </label>
            <input
              type="number"
              step="0.001"
              min="0.001"
              value={formData.depositAmount}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  depositAmount: e.target.value,
                }))
              }
              className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="0.01"
            />
            {errors.depositAmount && (
              <p className="text-red-600 text-sm mt-1">
                {errors.depositAmount}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Deadline (Hours from now) *
            </label>
            <input
              type="number"
              value={formData.deadlineHours}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  deadlineHours: e.target.value,
                }))
              }
              className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="24"
            />
            {errors.deadlineHours && (
              <p className="text-red-600 text-sm mt-1">
                {errors.deadlineHours}
              </p>
            )}
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4">
            <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">
              How It Works
            </h4>
            <ul className="text-amber-700 dark:text-amber-300 text-sm space-y-1">
              <li>• Check in before the deadline to keep your switch active</li>
              <li>
                • If you don't check in, your beneficiary can claim the funds
              </li>
              <li>• You can add more funds and extend the deadline anytime</li>
              <li>
                • Cancel anytime to withdraw your funds before the deadline
              </li>
            </ul>
          </div>

          {errors.general && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-red-800 dark:text-red-200 text-sm">
                {errors.general}
              </p>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-red-800 dark:text-red-200 text-sm">
                {error.message}
              </p>
            </div>
          )}

          <Button
            type="submit"
            disabled={isPending}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg"
          >
            {isPending
              ? "Creating Switch..."
              : `Create Switch with ${formData.depositAmount} STT`}
          </Button>
        </form>
      </div>
    </div>
  );
}
