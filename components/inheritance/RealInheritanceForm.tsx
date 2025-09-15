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

export function RealInheritanceForm() {
  const { address } = useAccount();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { data: receipt, isSuccess } = useWaitForTransactionReceipt({ hash });

  const [step, setStep] = useState<"create" | "deposit" | "success">("create");
  const [realInheritanceId, setRealInheritanceId] = useState<
    bigint | undefined
  >(undefined);
  const [isDepositing, setIsDepositing] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    beneficiaryAddress: "",
    depositAmount: "0.01",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Parse inheritance ID from transaction receipt
  useEffect(() => {
    if (receipt && receipt.logs) {
      // Look for InheritanceCreated event in logs
      const inheritanceCreatedLog = receipt.logs.find(
        (log) =>
          log.address?.toLowerCase() ===
          CONTRACT_ADDRESSES.InheritanceCore.toLowerCase(),
      );

      if (
        inheritanceCreatedLog &&
        inheritanceCreatedLog.topics &&
        inheritanceCreatedLog.topics[1]
      ) {
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

    if (!formData.name.trim()) newErrors.name = "Name required";
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
      // Create inheritance with real contract call
      const timeLock: TimeLock = {
        distributionType: DistributionType.IMMEDIATE,
        unlockTime: BigInt(Math.floor(Date.now() / 1000) + 15), // 15 seconds
        vestingDuration: BigInt(0),
        cliffDuration: BigInt(0),
        milestoneTimestamps: [] as readonly bigint[],
        milestonePercentages: [] as readonly bigint[],
      };

      // Note: createInheritance doesn't accept ETH, we need separate deposit call
      await writeContract({
        address: CONTRACT_ADDRESSES.InheritanceCore,
        abi: INHERITANCE_CORE_ABI,
        functionName: "createInheritance",
        args: [
          formData.name,
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
      // Deposit STT to inheritance contract
      await writeContract({
        address: CONTRACT_ADDRESSES.InheritanceCore,
        abi: INHERITANCE_CORE_ABI,
        functionName: "depositETH",
        args: [realInheritanceId],
        value: parseEther(formData.depositAmount),
      });
    } catch (error) {
      console.error("Failed to deposit STT:", error);
    }
  };

  // Deposit step
  if (step === "deposit" && realInheritanceId) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4 text-center">
            ✅ Step 2: Deposit STT
          </h2>
          <div className="space-y-4">
            <div className="bg-muted/50 rounded p-3 text-sm">
              <p>
                <strong>Inheritance ID:</strong> {realInheritanceId.toString()}
              </p>
              <p>
                <strong>Name:</strong> {formData.name}
              </p>
              <p>
                <strong>Amount to Deposit:</strong> {formData.depositAmount} STT
              </p>
            </div>

            <div className="bg-green-500/10 border border-green-500/20 rounded p-3">
              <p className="text-green-600 font-bold text-sm">
                💰 Ready to Transfer STT
              </p>
              <p className="text-green-600 text-xs">
                This will send {formData.depositAmount} STT from your wallet to
                the inheritance contract
              </p>
            </div>

            <Button
              onClick={handleDeposit}
              disabled={isPending}
              className="w-full bg-gradient-to-r from-green-600 to-green-500"
            >
              {isPending
                ? "Transferring STT..."
                : `Transfer ${formData.depositAmount} STT`}
            </Button>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded p-3">
                <p className="text-red-600 text-xs">Error: {error.message}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (step === "success" && realInheritanceId) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-card border border-border rounded-lg p-6 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold mb-4">Inheritance Created!</h2>
          <div className="space-y-3 text-sm">
            <div className="bg-muted/50 rounded p-3">
              <p>
                <strong>Name:</strong> {formData.name}
              </p>
              <p>
                <strong>ID:</strong> {realInheritanceId.toString()}
              </p>
              <p>
                <strong>Beneficiary:</strong> {formData.beneficiaryAddress}
              </p>
              <p>
                <strong>Amount:</strong> {formData.depositAmount} STT
              </p>
              <p>
                <strong>Timer:</strong> 15 seconds
              </p>
            </div>
            <div className="bg-green-500/10 border border-green-500/20 rounded p-3">
              <p className="text-green-600 font-bold">🎉 INHERITANCE CREATED</p>
              <p className="text-green-600 text-xs">
                Contract deployed successfully!
              </p>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded p-3">
              <p className="text-blue-600 font-bold text-xs">💡 Next Steps:</p>
              <p className="text-blue-600 text-xs">
                1. Add beneficiaries to this inheritance
              </p>
              <p className="text-blue-600 text-xs">2. Deposit STT tokens</p>
              <p className="text-blue-600 text-xs">
                3. Wait 15 seconds, then trigger inheritance
              </p>
            </div>
          </div>
          <Button
            onClick={() => {
              setStep("create");
              setRealInheritanceId(undefined);
              setFormData({
                name: "",
                beneficiaryAddress: "",
                depositAmount: "0.01",
              });
            }}
            className="w-full mt-6"
          >
            Create Another
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-6 text-center">
          Create Inheritance
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Inheritance Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              className="w-full border border-border rounded-md px-3 py-2 bg-background"
              placeholder="My Family Vault"
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name}</p>
            )}
          </div>

          {/* Beneficiary */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Beneficiary Wallet
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
              className="w-full border border-border rounded-md px-3 py-2 bg-background text-xs"
              placeholder="0x..."
            />
            {errors.beneficiaryAddress && (
              <p className="text-red-500 text-xs mt-1">
                {errors.beneficiaryAddress}
              </p>
            )}
          </div>

          {/* Deposit Amount */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Deposit Amount (STT)
            </label>
            <input
              type="number"
              step="0.001"
              value={formData.depositAmount}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  depositAmount: e.target.value,
                }))
              }
              className="w-full border border-border rounded-md px-3 py-2 bg-background"
            />
            {errors.depositAmount && (
              <p className="text-red-500 text-xs mt-1">
                {errors.depositAmount}
              </p>
            )}
          </div>

          {/* Settings */}
          <div className="bg-muted/50 rounded-lg p-3 text-xs">
            <p>
              <strong>Timer:</strong> 15 seconds (for testing)
            </p>
            <p>
              <strong>Distribution:</strong> Immediate to beneficiary
            </p>
            <p>
              <strong>STT:</strong> Will be deposited directly
            </p>
          </div>

          {/* Warning */}
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <p className="text-red-600 font-bold text-xs">🚨 NO SIMULATIONS</p>
            <p className="text-red-600 text-xs">Real STT will be transferred</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <p className="text-red-600 text-xs">Error: {error.message}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={isPending}
            className="w-full bg-gradient-to-r from-[#2567EC] to-[#37B6F7] hover:brightness-95"
          >
            {isPending
              ? "Creating & Depositing..."
              : `Create & Deposit ${formData.depositAmount} STT`}
          </Button>
        </form>
      </div>
    </div>
  );
}
