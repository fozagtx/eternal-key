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

export function InheritanceForm() {
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

  const [step, setStep] = useState<"setup" | "deposit" | "manage">("setup");
  const [formData, setFormData] = useState({
    beneficiaryAddress: "",
    depositAmount: "0.01",
    deadlineHours: "24",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (
      switchData?.owner &&
      switchData.owner !== "0x0000000000000000000000000000000000000000"
    ) {
      setStep("manage");
    }
  }, [switchData]);

  useEffect(() => {
    if (isSuccess && receipt) {
      refetchSwitch();
      if (step === "setup") {
        setStep("deposit");
      }
    }
  }, [isSuccess, receipt, step, refetchSwitch]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.beneficiaryAddress.trim()) {
      newErrors.beneficiaryAddress = "Beneficiary address required";
    }
    if (!formData.depositAmount || parseFloat(formData.depositAmount) <= 0) {
      newErrors.depositAmount = "Deposit amount must be > 0";
    }
    if (!formData.deadlineHours || parseFloat(formData.deadlineHours) <= 0) {
      newErrors.deadlineHours = "Deadline must be > 0 hours";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInitialize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const deadlineTimestamp = BigInt(
        Math.floor(Date.now() / 1000) +
          parseFloat(formData.deadlineHours) * 3600,
      );

      await initializeSwitch(
        formData.beneficiaryAddress as Address,
        deadlineTimestamp,
      );
    } catch (error) {
      console.error("Failed to initialize switch:", error);
    }
  };

  const handleDeposit = async () => {
    try {
      await deposit(formData.depositAmount);
    } catch (error) {
      console.error("Failed to deposit:", error);
    }
  };

  const handleCheckIn = async () => {
    try {
      const newDeadline = BigInt(
        Math.floor(Date.now() / 1000) +
          parseFloat(formData.deadlineHours) * 3600,
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

  if (step === "manage" && switchData) {
    const isOwner = address === switchData.owner;
    const isBeneficiary = address === switchData.beneficiary;

    return (
      <div className="max-w-2xl mx-auto px-4">
        <div className="relative bg-gradient-to-br from-white/90 via-white/80 to-white/70 dark:from-gray-900/90 dark:via-gray-800/80 dark:to-gray-900/70 border border-blue-200/50 dark:border-blue-800/50 rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-xl overflow-hidden">
          <div className="relative text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/25 mb-6">
              <span className="text-white text-2xl font-bold">DMS</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-3">
              Dead Man's Switch
            </h2>
            <p className="text-muted-foreground text-base max-w-md mx-auto">
              {isOwner
                ? "Manage your dead man's switch"
                : "Beneficiary dashboard"}
            </p>
          </div>

          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50/80 via-blue-50/60 to-cyan-50/80 dark:from-blue-900/20 dark:via-blue-800/20 dark:to-cyan-900/20 border border-blue-200/50 dark:border-blue-800/50 rounded-2xl p-6">
              <h3 className="font-bold text-lg text-blue-800 dark:text-blue-200 mb-4">
                Switch Status
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div className="p-3 bg-white/60 dark:bg-gray-800/60 rounded-xl">
                  <span className="text-blue-600 dark:text-blue-400 font-medium block">
                    Status:
                  </span>
                  <span className="font-bold text-blue-800 dark:text-blue-200">
                    {status === SwitchStatus.ACTIVE
                      ? "Active"
                      : status === SwitchStatus.CLAIMED
                        ? "Claimed"
                        : status === SwitchStatus.CANCELLED
                          ? "Cancelled"
                          : "Inactive"}
                  </span>
                </div>
                <div className="p-3 bg-white/60 dark:bg-gray-800/60 rounded-xl">
                  <span className="text-blue-600 dark:text-blue-400 font-medium block">
                    Balance:
                  </span>
                  <span className="font-bold text-blue-800 dark:text-blue-200">
                    {formatBalance(switchData.balance)} STT
                  </span>
                </div>
                <div className="p-3 bg-white/60 dark:bg-gray-800/60 rounded-xl">
                  <span className="text-blue-600 dark:text-blue-400 font-medium block">
                    Time Left:
                  </span>
                  <span className="font-bold text-blue-800 dark:text-blue-200">
                    {timeRemaining
                      ? formatTimeRemaining(timeRemaining)
                      : "Expired"}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-50/80 via-purple-50/60 to-violet-50/80 dark:from-purple-900/20 dark:via-purple-800/20 dark:to-violet-900/20 border border-purple-200/50 dark:border-purple-800/50 rounded-2xl p-6">
              <h3 className="font-bold text-lg text-purple-800 dark:text-purple-200 mb-4">
                Details
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center p-3 bg-white/60 dark:bg-gray-800/60 rounded-xl">
                  <span className="text-purple-600 dark:text-purple-400 font-medium">
                    Owner:
                  </span>
                  <span className="font-mono text-purple-800 dark:text-purple-200 text-xs">
                    {switchData.owner.slice(0, 8)}...
                    {switchData.owner.slice(-6)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white/60 dark:bg-gray-800/60 rounded-xl">
                  <span className="text-purple-600 dark:text-purple-400 font-medium">
                    Beneficiary:
                  </span>
                  <span className="font-mono text-purple-800 dark:text-purple-200 text-xs">
                    {switchData.beneficiary.slice(0, 8)}...
                    {switchData.beneficiary.slice(-6)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white/60 dark:bg-gray-800/60 rounded-xl">
                  <span className="text-purple-600 dark:text-purple-400 font-medium">
                    Deadline Expired:
                  </span>
                  <span className="font-bold text-purple-800 dark:text-purple-200">
                    {isExpired ? "Yes" : "No"}
                  </span>
                </div>
              </div>
            </div>

            {isOwner && status === SwitchStatus.ACTIVE && !isExpired && (
              <div className="space-y-4">
                <div className="space-y-3">
                  <label className="text-base font-semibold text-foreground">
                    Extend Deadline (Hours)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={formData.deadlineHours}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        deadlineHours: e.target.value,
                      }))
                    }
                    className="w-full border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 rounded-2xl px-6 py-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-base"
                    placeholder="24"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-base font-semibold text-foreground">
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
                    className="w-full border-2 border-gray-200 dark:border-gray-700 focus:border-green-500 dark:focus:border-green-400 rounded-2xl px-6 py-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-base"
                    placeholder="0.01"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button
                    onClick={handleCheckIn}
                    disabled={isPending}
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold py-3 rounded-xl"
                  >
                    {isPending ? "Processing..." : "Check In"}
                  </Button>
                  <Button
                    onClick={handleDeposit}
                    disabled={isPending}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3 rounded-xl"
                  >
                    {isPending ? "Processing..." : "Deposit"}
                  </Button>
                  <Button
                    onClick={handleCancel}
                    disabled={isPending}
                    variant="destructive"
                    className="font-bold py-3 rounded-xl"
                  >
                    {isPending ? "Processing..." : "Cancel Switch"}
                  </Button>
                </div>
              </div>
            )}

            {isBeneficiary && isExpired && status === SwitchStatus.ACTIVE && (
              <Button
                onClick={handleClaim}
                disabled={isPending}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-6 text-lg rounded-2xl"
              >
                {isPending
                  ? "Claiming..."
                  : `Claim ${formatBalance(switchData.balance)} STT`}
              </Button>
            )}

            {error && (
              <div className="bg-gradient-to-r from-red-50/80 to-red-50/80 dark:from-red-900/20 dark:to-red-900/20 border border-red-200/50 dark:border-red-800/50 rounded-2xl p-6">
                <p className="text-red-800 dark:text-red-200 font-bold">
                  Error
                </p>
                <p className="text-red-700 dark:text-red-300 text-sm">
                  {error.message}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (step === "deposit") {
    return (
      <div className="max-w-2xl mx-auto px-4">
        <div className="relative bg-gradient-to-br from-white/90 via-white/80 to-white/70 dark:from-gray-900/90 dark:via-gray-800/80 dark:to-gray-900/70 border border-green-200/50 dark:border-green-800/50 rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-xl overflow-hidden">
          <div className="relative text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg shadow-green-500/25 mb-6">
              <span className="text-white text-2xl font-bold">$</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-3">
              Deposit Funds
            </h2>
            <p className="text-muted-foreground text-base max-w-md mx-auto">
              Add STT tokens to your dead man's switch
            </p>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-base font-semibold text-foreground">
                Deposit Amount (STT)
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
                className="w-full border-2 border-gray-200 dark:border-gray-700 focus:border-green-500 dark:focus:border-green-400 rounded-2xl px-6 py-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-base"
                placeholder="0.01"
              />
            </div>

            <Button
              onClick={handleDeposit}
              disabled={isPending}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-6 text-lg rounded-2xl"
            >
              {isPending
                ? "Depositing..."
                : `Deposit ${formData.depositAmount} STT`}
            </Button>

            {error && (
              <div className="bg-gradient-to-r from-red-50/80 to-red-50/80 dark:from-red-900/20 dark:to-red-900/20 border border-red-200/50 dark:border-red-800/50 rounded-2xl p-6">
                <p className="text-red-800 dark:text-red-200 font-bold">
                  Error
                </p>
                <p className="text-red-700 dark:text-red-300 text-sm">
                  {error.message}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4">
      <div className="relative bg-gradient-to-br from-white/90 via-white/80 to-white/70 dark:from-gray-900/90 dark:via-gray-800/80 dark:to-gray-900/70 border border-blue-200/50 dark:border-blue-800/50 rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-xl overflow-hidden">
        <div className="relative text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/25 mb-6">
            <span className="text-white text-2xl font-bold">DMS</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-3">
            Create Dead Man's Switch
          </h2>
          <p className="text-muted-foreground text-base max-w-md mx-auto leading-relaxed">
            Set up an automated inheritance system that activates after a
            specified time period
          </p>
        </div>

        <form onSubmit={handleInitialize} className="relative space-y-8">
          <div className="space-y-3">
            <label className="flex items-center gap-3 text-base font-semibold text-foreground">
              Beneficiary Address
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
              className="w-full border-2 border-gray-200 dark:border-gray-700 focus:border-purple-500 dark:focus:border-purple-400 rounded-2xl px-6 py-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-sm font-mono"
              placeholder="0x1234567890abcdef1234567890abcdef12345678"
            />
            {errors.beneficiaryAddress && (
              <p className="text-red-600 dark:text-red-400 text-sm">
                {errors.beneficiaryAddress}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <label className="text-base font-semibold text-foreground">
              Initial Deposit (STT)
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
              className="w-full border-2 border-gray-200 dark:border-gray-700 focus:border-green-500 dark:focus:border-green-400 rounded-2xl px-6 py-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-base"
              placeholder="0.01"
            />
            {errors.depositAmount && (
              <p className="text-red-600 dark:text-red-400 text-sm">
                {errors.depositAmount}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <label className="text-base font-semibold text-foreground">
              Deadline (Hours from now)
            </label>
            <input
              type="number"
              step="1"
              min="1"
              value={formData.deadlineHours}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  deadlineHours: e.target.value,
                }))
              }
              className="w-full border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 rounded-2xl px-6 py-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-base"
              placeholder="24"
            />
            {errors.deadlineHours && (
              <p className="text-red-600 dark:text-red-400 text-sm">
                {errors.deadlineHours}
              </p>
            )}
          </div>

          <div className="bg-gradient-to-r from-amber-50/80 via-amber-50/60 to-orange-50/80 dark:from-amber-900/20 dark:via-amber-800/20 dark:to-orange-900/20 border border-amber-200/50 dark:border-amber-800/50 rounded-2xl p-6">
            <h4 className="text-amber-800 dark:text-amber-200 font-bold text-lg mb-2">
              How It Works
            </h4>
            <ul className="text-amber-700 dark:text-amber-300 text-sm space-y-1">
              <li>
                • You must check in before the deadline to keep the switch
                active
              </li>
              <li>
                • If you don't check in, the beneficiary can claim all funds
              </li>
              <li>
                • You can deposit additional funds and extend the deadline
                anytime
              </li>
              <li>
                • You can cancel the switch and withdraw funds before deadline
              </li>
            </ul>
          </div>

          {error && (
            <div className="bg-gradient-to-r from-red-50/80 to-red-50/80 dark:from-red-900/20 dark:to-red-900/20 border border-red-200/50 dark:border-red-800/50 rounded-2xl p-6">
              <p className="text-red-800 dark:text-red-200 font-bold">Error</p>
              <p className="text-red-700 dark:text-red-300 text-sm">
                {error.message}
              </p>
            </div>
          )}

          <Button
            type="submit"
            disabled={isPending}
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold py-6 text-lg rounded-2xl"
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
