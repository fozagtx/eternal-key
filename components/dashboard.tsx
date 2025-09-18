"use client";

import { useAccount } from "wagmi";
import { ConnectKitButton } from "connectkit";
import { InheritanceForm } from "@/components/inheritance/InheritanceForm";

export function Dashboard() {
  const { address, isConnected } = useAccount();

  if (!isConnected || !address) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#2567EC] to-[#37B6F7] bg-clip-text text-transparent mb-4">
            Eternal Key
          </h1>
          <p className="text-muted-foreground mb-6">
            Connect your wallet to set up inheritance
          </p>
          <ConnectKitButton />
        </div>
      </div>
    );
  }

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 sm:mb-12 gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-[#2567EC] to-[#37B6F7] bg-clip-text text-transparent">
              Eternal Key
            </h1>
            <p className="text-muted-foreground mt-2 text-sm sm:text-base">
              Decentralized inheritance for STT tokens
            </p>
          </div>

          {/* Wallet Info */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
            <div className="flex flex-col items-start sm:items-end">
              <p className="text-xs sm:text-sm text-muted-foreground">
                Connected Wallet
              </p>
              <p className="font-mono text-xs sm:text-sm font-medium">
                {formatAddress(address)}
              </p>
            </div>
            <ConnectKitButton />
          </div>
        </div>

        {/* Main Content - Enhanced Inheritance Form */}
        <InheritanceForm />
      </div>
    </div>
  );
}
