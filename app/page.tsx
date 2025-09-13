"use client";

import { useState } from "react";
import Image from "next/image";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import {
  ShieldCheckIcon,
  ClockIcon,
  LockClosedIcon,
  HeartIcon,
  ArrowRightIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

export default function Home() {
  const { isConnected } = useAccount();
  const router = useRouter();
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  const features = [
    {
      icon: ShieldCheckIcon,
      title: "Secure Smart Contracts",
      description:
        "Battle-tested contracts on Somnia testnet with comprehensive security measures",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: ClockIcon,
      title: "Deadman Switch",
      description:
        "Configurable duration from 1 day to 1 year with check-in system",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: LockClosedIcon,
      title: "Full Control",
      description:
        "Deposit, withdraw, and manage your inheritance while staying active",
      color: "from-green-500 to-emerald-500",
    },
    {
      icon: HeartIcon,
      title: "Personal Messages",
      description:
        "Leave meaningful messages for your loved ones along with the inheritance",
      color: "from-red-500 to-rose-500",
    },
  ];

  const steps = [
    "Connect your wallet to Somnia testnet",
    "Set beneficiary and deadman switch duration",
    "Deposit STT tokens and write a message",
    "Stay active with regular check-ins",
  ];

  const handleGetStarted = () => {
    if (isConnected) {
      router.push("/dashboard");
    }
  };

  return (
    <main className="min-h-screen">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <ShieldCheckIcon className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            EternalKey
          </span>
        </div>

        <div className="flex items-center space-x-4">
          <ConnectButton.Custom>
            {({
              account,
              chain,
              openAccountModal,
              openChainModal,
              openConnectModal,
              authenticationStatus,
              mounted,
            }) => {
              const ready = mounted && authenticationStatus !== "loading";
              const connected =
                ready &&
                account &&
                chain &&
                (!authenticationStatus ||
                  authenticationStatus === "authenticated");

              return (
                <div
                  {...(!ready && {
                    "aria-hidden": true,
                    style: {
                      opacity: 0,
                      pointerEvents: "none",
                      userSelect: "none",
                    },
                  })}
                >
                  {(() => {
                    if (!connected) {
                      return (
                        <button
                          onClick={openConnectModal}
                          type="button"
                          className="flex items-center gap-1.5 bg-[#38BDF8] text-white rounded-md px-[0.12rem] py-[0.12rem] transition-all duration-200 cursor-pointer hover:brightness-95"
                        >
                          <div className="flex items-center gap-1.5 bg-gradient-to-r from-[#2567EC] to-[#37B6F7] rounded-[0.8rem] px-4 py-2 relative shadow-[0_1px_3px_0px_rgba(0,0,0,0.65)]">
                            <span className="text-[0.875rem] font-medium z-50">
                              Connect Wallet
                            </span>
                            <div className="absolute w-full h-full left-0 top-0 bg-gradient-to-t from-white/0 to-white/20 z-10 rounded-[0.8rem]"></div>
                          </div>
                        </button>
                      );
                    }

                    if (chain.unsupported) {
                      return (
                        <button
                          onClick={openChainModal}
                          type="button"
                          className="flex items-center gap-1.5 bg-red-500 text-white rounded-md px-[0.12rem] py-[0.12rem] transition-all duration-200 cursor-pointer hover:brightness-95"
                        >
                          <div className="flex items-center gap-1.5 bg-gradient-to-r from-red-600 to-red-500 rounded-[0.8rem] px-4 py-2 relative shadow-[0_1px_3px_0px_rgba(0,0,0,0.65)]">
                            <span className="text-[0.875rem] font-medium z-50">
                              Wrong Network
                            </span>
                          </div>
                        </button>
                      );
                    }

                    return (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={openAccountModal}
                          type="button"
                          className="flex items-center gap-1.5 bg-[#38BDF8] text-white rounded-md px-[0.12rem] py-[0.12rem] transition-all duration-200 cursor-pointer hover:brightness-95"
                        >
                          <div className="flex items-center gap-1.5 bg-gradient-to-r from-[#2567EC] to-[#37B6F7] rounded-[0.8rem] px-4 py-2 relative shadow-[0_1px_3px_0px_rgba(0,0,0,0.65)]">
                            <span className="text-[0.875rem] font-medium z-50">
                              {account.displayName}
                            </span>
                            <div className="absolute w-full h-full left-0 top-0 bg-gradient-to-t from-white/0 to-white/20 z-10 rounded-[0.8rem]"></div>
                          </div>
                        </button>

                        <button
                          onClick={handleGetStarted}
                          className="flex items-center gap-1.5 bg-green-500 text-white rounded-md px-[0.12rem] py-[0.12rem] transition-all duration-200 cursor-pointer hover:brightness-95"
                        >
                          <div className="flex items-center gap-1.5 bg-gradient-to-r from-green-600 to-green-500 rounded-[0.8rem] px-4 py-2 relative shadow-[0_1px_3px_0px_rgba(0,0,0,0.65)]">
                            <span className="text-[0.875rem] font-medium z-50">
                              Dashboard
                            </span>
                            <ArrowRightIcon className="w-4 h-4 z-50" />
                          </div>
                        </button>
                      </div>
                    );
                  })()}
                </div>
              );
            }}
          </ConnectButton.Custom>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-6 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
            Secure Your Crypto Legacy
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed">
            Protect your digital assets for loved ones with our advanced
            inheritance system featuring deadman switch technology on Somnia
            testnet
          </p>

          {!isConnected ? (
            <div className="flex flex-col items-center gap-4">
              <ConnectButton.Custom>
                {({ openConnectModal }) => (
                  <button
                    onClick={openConnectModal}
                    className="flex items-center gap-2 bg-[#38BDF8] text-white rounded-md px-[0.12rem] py-[0.12rem] transition-all duration-200 cursor-pointer hover:brightness-95 hover:scale-105 transform"
                  >
                    <div className="flex items-center gap-2 bg-gradient-to-r from-[#2567EC] to-[#37B6F7] rounded-[0.8rem] px-8 py-4 relative shadow-[0_2px_8px_0px_rgba(0,0,0,0.4)]">
                      <span className="text-lg font-semibold z-50">
                        Get Started - Connect Wallet
                      </span>
                      <ArrowRightIcon className="w-5 h-5 z-50" />
                      <div className="absolute w-full h-full left-0 top-0 bg-gradient-to-t from-white/0 to-white/20 z-10 rounded-[0.8rem]"></div>
                    </div>
                  </button>
                )}
              </ConnectButton.Custom>
              <p className="text-sm text-gray-400">
                No fees to connect • Somnia testnet
              </p>
            </div>
          ) : (
            <button
              onClick={handleGetStarted}
              className="flex items-center gap-2 bg-green-500 text-white rounded-md px-[0.12rem] py-[0.12rem] transition-all duration-200 cursor-pointer hover:brightness-95 hover:scale-105 transform mx-auto"
            >
              <div className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-500 rounded-[0.8rem] px-8 py-4 relative shadow-[0_2px_8px_0px_rgba(0,0,0,0.4)]">
                <span className="text-lg font-semibold z-50">
                  Open Dashboard
                </span>
                <ArrowRightIcon className="w-5 h-5 z-50" />
              </div>
            </button>
          )}
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-white">
            Why Choose EternalKey?
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="relative group cursor-pointer"
                onMouseEnter={() => setHoveredFeature(index)}
                onMouseLeave={() => setHoveredFeature(null)}
              >
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:scale-105">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-r ${
                      feature.color
                    } p-3 mb-6 transition-transform duration-300 ${
                      hoveredFeature === index ? "scale-110" : ""
                    }`}
                  >
                    <feature.icon className="w-full h-full text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="px-6 py-20 bg-white/5 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-white">
            How It Works
          </h2>

          <div className="space-y-8">
            {steps.map((step, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="text-lg text-gray-200">{step}</p>
                  {index < steps.length - 1 && (
                    <div className="w-px h-8 bg-gradient-to-b from-blue-500/50 to-transparent ml-4 mt-4"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="space-y-2">
              <div className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                100%
              </div>
              <div className="text-gray-300">Secure & Audited</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">
                1-365
              </div>
              <div className="text-gray-300">Days Duration Range</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                24/7
              </div>
              <div className="text-gray-300">System Availability</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-white/10">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-gray-400">
            Built on Somnia Testnet • Secure • Decentralized • Open Source
          </p>
        </div>
      </footer>
    </main>
  );
}
