"use client";

import { useState } from "react";
import { Address } from "viem";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { useInheritanceContract } from "@/hooks/useInheritanceContract";
import { DistributionType, TimeLock } from "@/lib/contracts";

interface CreateInheritanceFormProps {
  onSuccess?: (inheritanceId: string) => void;
}

export function CreateInheritanceForm({
  onSuccess,
}: CreateInheritanceFormProps) {
  const { address } = useAccount();
  const { createInheritance, isWritePending, isConfirming, isConfirmed } =
    useInheritanceContract();

  const [formData, setFormData] = useState({
    name: "",
    executor: "",
    requiresConfirmation: true,
    distributionType: DistributionType.IMMEDIATE,
    vestingDuration: 0,
    cliffDuration: 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Inheritance name is required";
    }

    if (!formData.executor.trim()) {
      newErrors.executor = "Executor address is required";
    } else if (
      !formData.executor.startsWith("0x") ||
      formData.executor.length !== 42
    ) {
      newErrors.executor = "Invalid Ethereum address";
    }

    if (formData.executor === address) {
      newErrors.executor = "Executor cannot be the same as the owner";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const timeLock: TimeLock = {
        distributionType: formData.distributionType,
        unlockTime: BigInt(Math.floor(Date.now() / 1000) + 86400), // 24 hours from now in seconds
        vestingDuration: BigInt(formData.vestingDuration * 86400), // Convert days to seconds
        cliffDuration: BigInt(formData.cliffDuration * 86400), // Convert days to seconds
        milestoneTimestamps: [] as readonly bigint[],
        milestonePercentages: [] as readonly bigint[],
      };

      await createInheritance(
        formData.name,
        formData.executor as Address,
        formData.requiresConfirmation,
        timeLock,
      );
    } catch (error) {
      console.error("Failed to create inheritance:", error);
    }
  };

  // Reset form after successful creation
  if (isConfirmed && onSuccess) {
    onSuccess("inheritance-created");
    setFormData({
      name: "",
      executor: "",
      requiresConfirmation: true,
      distributionType: DistributionType.IMMEDIATE,
      vestingDuration: 0,
      cliffDuration: 0,
    });
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-6">Create Inheritance Vault</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Inheritance Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            className="w-full border border-border rounded-md px-3 py-2 bg-background"
            placeholder="My Family Inheritance"
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Executor Address *
          </label>
          <input
            type="text"
            value={formData.executor}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, executor: e.target.value }))
            }
            className="w-full border border-border rounded-md px-3 py-2 bg-background font-mono text-sm"
            placeholder="0x..."
          />
          {errors.executor && (
            <p className="text-red-500 text-sm mt-1">{errors.executor}</p>
          )}
          <p className="text-sm text-muted-foreground mt-1">
            Address that can trigger the inheritance distribution
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Distribution Type
          </label>
          <select
            value={formData.distributionType}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                distributionType: parseInt(e.target.value) as DistributionType,
              }))
            }
            className="w-full border border-border rounded-md px-3 py-2 bg-background"
          >
            <option value={DistributionType.IMMEDIATE}>Immediate</option>
            <option value={DistributionType.LINEAR_VESTING}>
              Linear Vesting
            </option>
            <option value={DistributionType.CLIFF_VESTING}>
              Cliff Vesting
            </option>
          </select>
        </div>

        {formData.distributionType === DistributionType.LINEAR_VESTING && (
          <div>
            <label className="block text-sm font-medium mb-2">
              Vesting Duration (days)
            </label>
            <input
              type="number"
              value={formData.vestingDuration}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  vestingDuration: parseInt(e.target.value) || 0,
                }))
              }
              className="w-full border border-border rounded-md px-3 py-2 bg-background"
              min="1"
              placeholder="365"
            />
          </div>
        )}

        {formData.distributionType === DistributionType.CLIFF_VESTING && (
          <div>
            <label className="block text-sm font-medium mb-2">
              Cliff Duration (days)
            </label>
            <input
              type="number"
              value={formData.cliffDuration}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  cliffDuration: parseInt(e.target.value) || 0,
                }))
              }
              className="w-full border border-border rounded-md px-3 py-2 bg-background"
              min="1"
              placeholder="30"
            />
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="requiresConfirmation"
            checked={formData.requiresConfirmation}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                requiresConfirmation: e.target.checked,
              }))
            }
            className="rounded border-border"
          />
          <label htmlFor="requiresConfirmation" className="text-sm">
            Require confirmation before distribution
          </label>
        </div>

        <Button
          type="submit"
          disabled={isWritePending || isConfirming}
          className="w-full bg-gradient-to-r from-[#2567EC] to-[#37B6F7] hover:brightness-95"
        >
          {isWritePending
            ? "Preparing..."
            : isConfirming
              ? "Creating..."
              : "Create Inheritance"}
        </Button>

        {isConfirmed && (
          <div className="text-green-600 text-sm text-center">
            ✅ Inheritance vault created successfully!
          </div>
        )}
      </form>
    </div>
  );
}
