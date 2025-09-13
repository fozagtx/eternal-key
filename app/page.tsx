"use client";

import { useAccount } from "wagmi";
import { GetStartedButton } from "@/components/connectKit";
import { Dashboard } from "@/components/dashboard";
import FeaturesSectionDemo from "@/components/features-section";
import Particles from "@/components/particles";
export default function HomePage() {
  const { isConnected } = useAccount();

  if (isConnected) {
    return <Dashboard />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      <Particles
        className="absolute inset-0"
        quantity={50}
        ease={70}
        color="#3b82f6"
        size={1}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-cyan-50/30 pointer-events-none" />
      <div className="text-center space-y-16 px-6 max-w-5xl relative z-10">
        <div className="space-y-8 mt-2">
          <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-100/80 to-cyan-100/80 rounded-full border border-blue-200/60 backdrop-blur-sm">
            <span className="text-sm font-medium text-blue-800 animate-pulse">
              currently in beta
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold leading-[1.1] tracking-tight">
            <span className="bg-gradient-to-r from-[#1e40af] via-[#2563eb] to-[#0ea5e9] bg-clip-text text-transparent">
              Decentralized
            </span>
            <br />
            <span className="bg-gradient-to-r from-[#2563eb] via-[#0ea5e9] to-[#06b6d4] bg-clip-text text-transparent">
              Inheritance
            </span>
            <br />
            <span className="text-slate-800 dark:text-slate-200 font-semibold">
              For The People
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed">
            Secure your legacy with blockchain technology inheritance.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <GetStartedButton
            size="lg"
            className="shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300"
          />
        </div>

        {/* Features Section */}
        <FeaturesSectionDemo />
      </div>
    </div>
  );
}
