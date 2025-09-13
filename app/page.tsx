"use client";

import { useAccount } from "wagmi";
import { GetStartedButton } from "@/components/get-started-button";
import { Dashboard } from "@/components/dashboard";

export default function HomePage() {
  const { isConnected } = useAccount();

  if (isConnected) {
    return <Dashboard />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-12 px-4 max-w-4xl">
        <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold bg-gradient-to-r from-[#2567EC] to-[#37B6F7] bg-clip-text text-transparent leading-tight">
          Decentralized
          <br />
          Inheritance
          <br />
          Governance
          <br />
          <span className="text-foreground">For The People</span>
        </h1>

        <GetStartedButton className="mx-auto" />
      </div>
    </div>
  );
}
