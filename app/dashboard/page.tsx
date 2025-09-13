"use client";

import { useAccount, useReadContract } from "wagmi";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import InheritanceCreator from "../../components/InheritanceCreator";
import InheritanceManager from "../../components/InheritanceManager";
import BeneficiaryPanel from "../../components/BeneficiaryPanel";
import {
  INHERITANCE_CONTRACT_ADDRESS,
  INHERITANCE_CONTRACT_ABI,
  InheritanceDetails,
} from "../../lib/contracts";

export default function Dashboard() {
  const { isConnected, address } = useAccount();
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(0);

  // Read user's inheritance data
  const { data: inheritanceData, refetch: refetchInheritance } =
    useReadContract({
      address: INHERITANCE_CONTRACT_ADDRESS as `0x${string}`,
      abi: INHERITANCE_CONTRACT_ABI,
      functionName: "getInheritanceDetails",
      args: [address],
    });

  // Read time remaining
  const { data: timeRemainingData, refetch: refetchTime } = useReadContract({
    address: INHERITANCE_CONTRACT_ADDRESS as `0x${string}`,
    abi: INHERITANCE_CONTRACT_ABI,
    functionName: "getTimeUntilTrigger",
    args: [address],
  });

  const handleUpdate = () => {
    refetchInheritance();
    refetchTime();
    setRefreshKey((prev) => prev + 1);
  };

  useEffect(() => {
    if (!isConnected) {
      router.push("/");
    }
  }, [isConnected, router]);

  if (!isConnected || !address) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Wallet Not Connected
          </h2>
          <p className="text-gray-300 mb-6">
            Please connect your wallet to access the dashboard
          </p>
          <ConnectButton />
        </div>
      </div>
    );
  }

  // Convert inheritance data to proper format
  const inheritance: InheritanceDetails = inheritanceData
    ? {
        beneficiary: (inheritanceData as any)[0],
        amount: (inheritanceData as any)[1],
        deadmanDuration: (inheritanceData as any)[2],
        lastCheckIn: (inheritanceData as any)[3],
        message: (inheritanceData as any)[4] || "",
        exists: (inheritanceData as any)[5],
        executed: (inheritanceData as any)[6],
      }
    : {
        beneficiary: "0x0000000000000000000000000000000000000000",
        amount: 0n,
        deadmanDuration: 0n,
        lastCheckIn: 0n,
        message: "",
        exists: false,
        executed: false,
      };

  const timeRemaining = (timeRemainingData as bigint) || 0n;

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">EK</span>
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            EternalKey Dashboard
          </span>
        </div>

        <ConnectButton />
      </nav>

      {/* Main Content */}
      <div className="px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Column - Inheritance Management */}
            <div className="space-y-8">
              <InheritanceCreator onSuccess={handleUpdate} />
              <InheritanceManager
                inheritance={inheritance}
                timeRemaining={timeRemaining}
                onUpdate={handleUpdate}
              />
            </div>
            <div>
              <BeneficiaryPanel userAddress={address} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
