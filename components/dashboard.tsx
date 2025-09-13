"use client";

import { useAccount, useDisconnect } from "wagmi";
import { ConnectKitButton } from "connectkit";
import { cn } from "@/lib/utils";
import { DatePickerDemo } from "@/components/date-picker";

export function Dashboard() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  if (!isConnected || !address) {
    return null;
  }

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#2567EC] to-[#37B6F7] bg-clip-text text-transparent">
              Eternal Key Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage your decentralized inheritance governance
            </p>
          </div>

          {/* Wallet Info */}
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <p className="text-sm text-muted-foreground">Connected Wallet</p>
              <p className="font-mono text-sm font-medium">
                {formatAddress(address)}
              </p>
            </div>
            <ConnectKitButton />
          </div>
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Inheritance Vaults */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-[#2567EC] to-[#37B6F7] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">🏛️</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Inheritance Vaults</h3>
                <p className="text-sm text-muted-foreground">
                  Manage your digital assets
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Active Vaults</span>
                <span className="text-sm font-medium">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Total Value</span>
                <span className="text-sm font-medium">$0.00</span>
              </div>
              <button className="w-full bg-gradient-to-r from-[#2567EC] to-[#37B6F7] text-white rounded-md py-2 text-sm font-medium hover:brightness-95 transition-all">
                Create Vault
              </button>
            </div>
          </div>

          {/* Beneficiaries */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-[#2567EC] to-[#37B6F7] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">👥</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Beneficiaries</h3>
                <p className="text-sm text-muted-foreground">
                  Manage inheritance recipients
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Active Beneficiaries</span>
                <span className="text-sm font-medium">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Pending Approvals</span>
                <span className="text-sm font-medium">0</span>
              </div>
              <button className="w-full bg-gradient-to-r from-[#2567EC] to-[#37B6F7] text-white rounded-md py-2 text-sm font-medium hover:brightness-95 transition-all">
                Add Beneficiary
              </button>
            </div>
          </div>

          {/* Governance */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-[#2567EC] to-[#37B6F7] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">🗳️</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Governance</h3>
                <p className="text-sm text-muted-foreground">
                  Participate in decisions
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Active Proposals</span>
                <span className="text-sm font-medium">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Your Voting Power</span>
                <span className="text-sm font-medium">0</span>
              </div>
              <button className="w-full bg-gradient-to-r from-[#2567EC] to-[#37B6F7] text-white rounded-md py-2 text-sm font-medium hover:brightness-95 transition-all">
                View Proposals
              </button>
            </div>
          </div>
        </div>

        {/* Date Picker Section */}
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">Schedule Check-in Date</h3>
          <div className="max-w-sm">
            <DatePickerDemo />
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <div className="text-center py-12 text-muted-foreground">
            <p>
              No activity yet. Create your first inheritance vault to get
              started.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
