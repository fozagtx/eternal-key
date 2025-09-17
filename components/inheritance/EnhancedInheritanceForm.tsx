"use client";

import { useState, useEffect } from "react";
import { Address, parseEther } from "viem";
import {
  useAccount,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { Button } from "@/components/ui/button";
import {
  CONTRACT_ADDRESSES,
  INHERITANCE_CORE_ABI,
  DistributionType,
  TimeLock,
} from "@/lib/contracts";

const EXECUTOR_ADDRESS =
  "0xC796e70F59DFFe8FF6DD88CF574345633682d829" as Address;

export function EnhancedInheritanceForm() {
  const { address } = useAccount();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { data: receipt, isSuccess } = useWaitForTransactionReceipt({ hash });

  const [step, setStep] = useState<"create" | "deposit" | "success">("create");
  const [realInheritanceId, setRealInheritanceId] = useState<
    bigint | undefined
  >(undefined);

  const [formData, setFormData] = useState({
    beneficiaryAddress: "",
    depositAmount: "0.01",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Parse inheritance ID from transaction receipt
  useEffect(() => {
    if (receipt?.logs) {
      const inheritanceCreatedLog = receipt.logs.find(
        (log) =>
          log.address?.toLowerCase() ===
          CONTRACT_ADDRESSES.InheritanceCore.toLowerCase(),
      );

      if (inheritanceCreatedLog?.topics?.[1]) {
        const inheritanceId = BigInt(inheritanceCreatedLog.topics[1]);
        setRealInheritanceId(inheritanceId);
        if (step === "create") {
          setStep("deposit");
        } else if (step === "deposit") {
          setStep("success");
        }
      }
    }
  }, [receipt, step]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.beneficiaryAddress.trim())
      newErrors.beneficiaryAddress = "Beneficiary address required";
    if (!formData.depositAmount || parseFloat(formData.depositAmount) <= 0) {
      newErrors.depositAmount = "Deposit amount must be > 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const timeLock: TimeLock = {
        distributionType: DistributionType.IMMEDIATE,
        unlockTime: BigInt(Math.floor(Date.now() / 1000) + 15),
        vestingDuration: BigInt(0),
        cliffDuration: BigInt(0),
        milestoneTimestamps: [] as readonly bigint[],
        milestonePercentages: [] as readonly bigint[],
      };

      await writeContract({
        address: CONTRACT_ADDRESSES.InheritanceCore,
        abi: INHERITANCE_CORE_ABI,
        functionName: "createInheritance",
        args: [
          EXECUTOR_ADDRESS,
          false,
          {
            distributionType: timeLock.distributionType,
            unlockTime: timeLock.unlockTime,
            vestingDuration: timeLock.vestingDuration,
            cliffDuration: timeLock.cliffDuration,
            milestoneTimestamps: timeLock.milestoneTimestamps,
            milestonePercentages: timeLock.milestonePercentages,
          },
        ],
      });
    } catch (error) {
      console.error("Failed to create inheritance:", error);
    }
  };

  const handleDeposit = async () => {
    if (!realInheritanceId) return;

    try {
      await writeContract({
        address: CONTRACT_ADDRESSES.InheritanceCore,
        abi: INHERITANCE_CORE_ABI,
        functionName: "depositSTT",
        args: [realInheritanceId],
        value: parseEther(formData.depositAmount),
      });
    } catch (error) {
      console.error("Failed to deposit STT:", error);
    }
  };

  // Step 2: Deposit
  if (step === "deposit" && realInheritanceId) {
    return (
      <div className="max-w-2xl mx-auto px-4">
        <div className="relative bg-gradient-to-br from-white/90 via-white/80 to-white/70 dark:from-gray-900/90 dark:via-gray-800/80 dark:to-gray-900/70 border border-green-200/50 dark:border-green-800/50 rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-xl overflow-hidden">
          {/* Background Effects */}
          <div className="absolute inset-0 bg-gradient-to-br from-green-50/20 via-transparent to-emerald-50/20 pointer-events-none"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-400/10 to-emerald-400/10 rounded-full blur-3xl"></div>

          {/* Header */}
          <div className="relative text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg shadow-green-500/25 mb-6">
              <span className="text-3xl">💰</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-3">
              Deposit STT Tokens
            </h2>
            <p className="text-muted-foreground text-base max-w-md mx-auto">
              Transfer your tokens to the inheritance smart contract
            </p>

            {/* Progress Steps */}
            <div className="flex items-center justify-center gap-3 mt-6">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs font-medium text-green-700 dark:text-green-300">Step 1: Complete</span>
              </div>
              <div className="w-8 h-0.5 bg-green-300 rounded-full"></div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-green-700 dark:text-green-300">Step 2: Deposit</span>
              </div>
              <div className="w-8 h-0.5 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800/50 rounded-full">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <span className="text-xs font-medium text-gray-500">Step 3: Complete</span>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {/* Contract Info */}
            <div className="bg-gradient-to-r from-blue-50/80 via-blue-50/60 to-cyan-50/80 dark:from-blue-900/20 dark:via-blue-800/20 dark:to-cyan-900/20 border border-blue-200/50 dark:border-blue-800/50 rounded-2xl p-6 space-y-4">
              <h3 className="font-bold text-lg text-blue-800 dark:text-blue-200 flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">📋</span>
                </div>
                Inheritance Contract Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between items-center p-3 bg-white/60 dark:bg-gray-800/60 rounded-xl">
                  <span className="text-blue-600 dark:text-blue-400 font-medium">🆔 Contract ID:</span>
                  <span className="font-mono text-blue-800 dark:text-blue-200 bg-blue-100/80 dark:bg-blue-900/40 px-3 py-1 rounded-lg">
                    #{realInheritanceId.toString()}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white/60 dark:bg-gray-800/60 rounded-xl">
                  <span className="text-blue-600 dark:text-blue-400 font-medium">💎 Amount:</span>
                  <span className="font-bold text-blue-800 dark:text-blue-200">{formData.depositAmount} STT</span>
                </div>
              </div>
            </div>

            {/* Ready to Transfer */}
            <div className="bg-gradient-to-r from-green-50/80 via-green-50/60 to-emerald-50/80 dark:from-green-900/20 dark:via-green-800/20 dark:to-emerald-900/20 border border-green-200/50 dark:border-green-800/50 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-2xl">🚀</span>
                </div>
                <div className="flex-1">
                  <h4 className="text-green-800 dark:text-green-200 font-bold text-lg mb-2">Ready to Transfer</h4>
                  <p className="text-green-700 dark:text-green-300 text-sm leading-relaxed">
                    This will securely transfer {formData.depositAmount} STT from your wallet to the inheritance smart contract on the blockchain.
                  </p>
                </div>
              </div>
            </div>

            <Button
              onClick={handleDeposit}
              disabled={isPending}
              className="w-full bg-gradient-to-r from-green-600 via-green-500 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white font-bold py-6 text-lg rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:transform-none"
            >
              {isPending ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Transferring STT...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-3">
                  <span className="text-xl">💸</span>
                  <span>Transfer {formData.depositAmount} STT</span>
                </div>
              )}
            </Button>

            {error && (
              <div className="bg-gradient-to-r from-red-50/80 to-red-50/80 dark:from-red-900/20 dark:to-red-900/20 border border-red-200/50 dark:border-red-800/50 rounded-2xl p-6">
                <div className="flex items-start gap-4">
                  <span className="text-2xl">❌</span>
                  <div>
                    <p className="text-red-800 dark:text-red-200 font-bold text-lg">Transfer Error</p>
                    <p className="text-red-700 dark:text-red-300 text-sm">{error.message}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Success
  if (step === "success" && realInheritanceId) {
    return (
      <div className="max-w-2xl mx-auto px-4">
        <div className="relative bg-gradient-to-br from-white/90 via-white/80 to-white/70 dark:from-gray-900/90 dark:via-gray-800/80 dark:to-gray-900/70 border border-green-200/50 dark:border-green-800/50 rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-xl text-center overflow-hidden">
          {/* Background Effects */}
          <div className="absolute inset-0 bg-gradient-to-br from-green-50/20 via-transparent to-emerald-50/20 pointer-events-none"></div>
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-green-400/10 to-emerald-400/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-blue-400/10 to-purple-400/10 rounded-full blur-3xl"></div>

          {/* Success Animation */}
          <div className="relative mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-green-500 to-emerald-500 shadow-2xl shadow-green-500/25 mb-6 animate-bounce">
              <span className="text-4xl">🎉</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-4">
              Inheritance Created Successfully!
            </h2>
            <p className="text-muted-foreground text-lg max-w-lg mx-auto leading-relaxed">
              Your digital legacy is now secured on the blockchain and ready to protect your assets for future generations.
            </p>
          </div>

          <div className="space-y-6 text-left">
            {/* Contract Details */}
            <div className="bg-gradient-to-r from-blue-50/80 via-blue-50/60 to-cyan-50/80 dark:from-blue-900/20 dark:via-blue-800/20 dark:to-cyan-900/20 border border-blue-200/50 dark:border-blue-800/50 rounded-2xl p-6 space-y-4">
              <h3 className="font-bold text-lg text-blue-800 dark:text-blue-200 flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">📋</span>
                </div>
                Contract Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between items-center p-3 bg-white/60 dark:bg-gray-800/60 rounded-xl">
                  <span className="text-blue-600 dark:text-blue-400 font-medium">🆔 Contract ID:</span>
                  <span className="font-mono text-blue-800 dark:text-blue-200 bg-blue-100/80 dark:bg-blue-900/40 px-3 py-1 rounded-lg">
                    #{realInheritanceId.toString()}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white/60 dark:bg-gray-800/60 rounded-xl">
                  <span className="text-blue-600 dark:text-blue-400 font-medium">👤 Beneficiary:</span>
                  <span className="font-mono text-blue-800 dark:text-blue-200 text-xs bg-blue-100/80 dark:bg-blue-900/40 px-3 py-1 rounded-lg">
                    {formData.beneficiaryAddress.slice(0, 8)}...{formData.beneficiaryAddress.slice(-6)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white/60 dark:bg-gray-800/60 rounded-xl">
                  <span className="text-blue-600 dark:text-blue-400 font-medium">💎 Amount:</span>
                  <span className="font-bold text-blue-800 dark:text-blue-200">{formData.depositAmount} STT</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white/60 dark:bg-gray-800/60 rounded-xl">
                  <span className="text-blue-600 dark:text-blue-400 font-medium">⏱️ Release Timer:</span>
                  <span className="font-bold text-blue-800 dark:text-blue-200">15 seconds</span>
                </div>
              </div>
            </div>

            {/* Success Message */}
            <div className="bg-gradient-to-r from-green-50/80 via-green-50/60 to-emerald-50/80 dark:from-green-900/20 dark:via-green-800/20 dark:to-emerald-900/20 border border-green-200/50 dark:border-green-800/50 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">✅</span>
                </div>
                <div>
                  <h4 className="text-green-800 dark:text-green-200 font-bold text-lg mb-2">Successfully Deployed</h4>
                  <p className="text-green-700 dark:text-green-300 text-sm leading-relaxed">
                    Your inheritance contract is now live on the Somnia blockchain and ready to secure your digital assets for the next generation.
                  </p>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-gradient-to-r from-purple-50/80 via-purple-50/60 to-violet-50/80 dark:from-purple-900/20 dark:via-purple-800/20 dark:to-violet-900/20 border border-purple-200/50 dark:border-purple-800/50 rounded-2xl p-6">
              <h3 className="font-bold text-lg text-purple-800 dark:text-purple-200 flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">💡</span>
                </div>
                What Happens Next
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3 p-3 bg-white/60 dark:bg-gray-800/60 rounded-xl">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <p className="text-purple-700 dark:text-purple-300">Inheritance will automatically activate after 15 seconds</p>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white/60 dark:bg-gray-800/60 rounded-xl">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <p className="text-purple-700 dark:text-purple-300">Beneficiary can claim tokens once timer expires</p>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white/60 dark:bg-gray-800/60 rounded-xl">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <p className="text-purple-700 dark:text-purple-300">Create additional inheritances for other assets</p>
                </div>
              </div>
            </div>
          </div>

          <Button
            onClick={() => {
              setStep("create");
              setRealInheritanceId(undefined);
              setFormData({
                beneficiaryAddress: "",
                depositAmount: "0.01",
              });
            }}
            className="w-full mt-8 bg-gradient-to-r from-[#1e40af] via-[#2563eb] to-[#0ea5e9] hover:from-[#1d4ed8] hover:to-[#06b6d4] text-white font-bold py-6 text-lg rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]"
          >
            <div className="flex items-center justify-center gap-3">
              <span className="text-xl">🔄</span>
              <span>Create Another Inheritance</span>
            </div>
          </Button>
        </div>
      </div>
    );
  }

  // Step 1: Create
  return (
    <div className="max-w-2xl mx-auto px-4">
      <div className="relative bg-gradient-to-br from-white/90 via-white/80 to-white/70 dark:from-gray-900/90 dark:via-gray-800/80 dark:to-gray-900/70 border border-blue-200/50 dark:border-blue-800/50 rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-xl overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/20 via-transparent to-cyan-50/20 pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-cyan-400/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-400/10 to-pink-400/10 rounded-full blur-2xl"></div>

        {/* Header */}
        <div className="relative text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/25 mb-6">
            <span className="text-3xl">🔐</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-[#1e40af] via-[#2563eb] to-[#0ea5e9] bg-clip-text text-transparent mb-3">
            Create Inheritance
          </h2>
          <p className="text-muted-foreground text-base max-w-md mx-auto leading-relaxed">
            Secure your digital legacy with blockchain technology. Set up automated inheritance in minutes.
          </p>

          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-3 mt-6">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Step 1: Setup</span>
            </div>
            <div className="w-8 h-0.5 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800/50 rounded-full">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              <span className="text-xs font-medium text-gray-500">Step 2: Deposit</span>
            </div>
            <div className="w-8 h-0.5 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800/50 rounded-full">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              <span className="text-xs font-medium text-gray-500">Step 3: Complete</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="relative space-y-8">
          {/* Beneficiary */}
          <div className="space-y-3">
            <label htmlFor="beneficiary-address" className="flex items-center gap-3 text-base font-semibold text-foreground">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 shadow-sm">
                <span className="text-lg">👤</span>
              </div>
              Beneficiary Wallet Address
            </label>
            <div className="relative group">
              <input
                id="beneficiary-address"
                type="text"
                value={formData.beneficiaryAddress}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    beneficiaryAddress: e.target.value,
                  }))
                }
                className="w-full border-2 border-gray-200 dark:border-gray-700 focus:border-purple-500 dark:focus:border-purple-400 rounded-2xl px-6 py-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-sm font-mono transition-all duration-300 hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-4 focus:ring-purple-500/10 dark:focus:ring-purple-400/10 group-hover:shadow-lg"
                placeholder="0x1234567890abcdef1234567890abcdef12345678"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground/70 text-sm">📋</span>
                  <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></div>
                </div>
              </div>
            </div>
            {errors.beneficiaryAddress && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl">
                <span className="text-red-500">⚠️</span>
                <p className="text-red-600 dark:text-red-400 text-sm font-medium">{errors.beneficiaryAddress}</p>
              </div>
            )}
          </div>

          {/* Deposit Amount */}
          <div className="space-y-3">
            <label className="flex items-center gap-3 text-base font-semibold text-foreground">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 shadow-sm">
                <span className="text-lg">💰</span>
              </div>
              Deposit Amount (STT)
            </label>
            <div className="relative group">
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
                className="w-full border-2 border-gray-200 dark:border-gray-700 focus:border-green-500 dark:focus:border-green-400 rounded-2xl px-6 py-4 pr-20 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-base transition-all duration-300 hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-4 focus:ring-green-500/10 dark:focus:ring-green-400/10 group-hover:shadow-lg"
                placeholder="0.01"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                <div className="flex items-center gap-2">
                  <span className="text-foreground text-sm font-bold bg-green-100 dark:bg-green-900/30 px-3 py-1.5 rounded-lg border border-green-200 dark:border-green-800">STT</span>
                  <div className="w-1 h-6 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full"></div>
                </div>
              </div>
            </div>
            {errors.depositAmount && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl">
                <span className="text-red-500">⚠️</span>
                <p className="text-red-600 dark:text-red-400 text-sm font-medium">{errors.depositAmount}</p>
              </div>
            )}
          </div>

          {/* Settings Card */}
          <div className="bg-gradient-to-r from-blue-50/80 via-blue-50/60 to-cyan-50/80 dark:from-blue-900/20 dark:via-blue-800/20 dark:to-cyan-900/20 border border-blue-200/50 dark:border-blue-800/50 rounded-2xl p-6 space-y-4">
            <h3 className="font-bold text-lg text-blue-800 dark:text-blue-200 flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm">⚙️</span>
              </div>
              Inheritance Settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex justify-between items-center p-3 bg-white/60 dark:bg-gray-800/60 rounded-xl">
                <span className="text-blue-600 dark:text-blue-400 font-medium">⏱️ Timer:</span>
                <span className="font-bold text-blue-800 dark:text-blue-200">15 seconds</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white/60 dark:bg-gray-800/60 rounded-xl">
                <span className="text-blue-600 dark:text-blue-400 font-medium">📤 Distribution:</span>
                <span className="font-bold text-blue-800 dark:text-blue-200">Immediate</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white/60 dark:bg-gray-800/60 rounded-xl">
                <span className="text-blue-600 dark:text-blue-400 font-medium">🔐 Security:</span>
                <span className="font-bold text-blue-800 dark:text-blue-200">Blockchain</span>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-gradient-to-r from-amber-50/80 via-amber-50/60 to-orange-50/80 dark:from-amber-900/20 dark:via-amber-800/20 dark:to-orange-900/20 border border-amber-200/50 dark:border-amber-800/50 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center">
                <span className="text-2xl">⚠️</span>
              </div>
              <div>
                <h4 className="text-amber-800 dark:text-amber-200 font-bold text-lg mb-2">Live Transaction</h4>
                <p className="text-amber-700 dark:text-amber-300 text-sm leading-relaxed">
                  Real STT tokens will be transferred to the smart contract on the Somnia blockchain. This is not a simulation.
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-gradient-to-r from-red-50/80 to-red-50/80 dark:from-red-900/20 dark:to-red-900/20 border border-red-200/50 dark:border-red-800/50 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <span className="text-2xl">❌</span>
                <div>
                  <p className="text-red-800 dark:text-red-200 font-bold text-lg">Transaction Error</p>
                  <p className="text-red-700 dark:text-red-300 text-sm">{error.message}</p>
                </div>
              </div>
            </div>
          )}

          <Button
            type="submit"
            disabled={isPending}
            className="w-full bg-gradient-to-r from-[#1e40af] via-[#2563eb] to-[#0ea5e9] hover:from-[#1d4ed8] hover:to-[#06b6d4] text-white font-bold py-6 text-lg rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:transform-none"
          >
            {isPending ? (
              <div className="flex items-center justify-center gap-3">
                <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Creating Inheritance...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-3">
                <span className="text-xl">🚀</span>
                <span>Create & Deposit {formData.depositAmount} STT</span>
              </div>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
