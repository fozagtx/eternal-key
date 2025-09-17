import { cn } from "@/lib/utils";
import { IconTarget, IconClock, IconWallet } from "@tabler/icons-react";
import Image from "next/image";

const SolanaLogo = () => (
  <Image
    src="/solana-sol-logo.svg"
    alt="Solana Logo"
    width={32}
    height={32}
    className="text-blue-400"
  />
);

export default function FeaturesSectionDemo() {
  const features = [
    {
      title: "Full Control",
      description: "Complete authority over your digital assets",
      icon: <IconTarget />,
    },
    {
      title: "Flexible Timing",
      description: "Set custom check-in periods that work for you",
      icon: <IconClock />,
    },
    {
      title: "Multi-Wallet Support",
      description: "Connect and manage multiple beneficiary wallets",
      icon: <IconWallet className="w-8 h-8" />,
    },
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 relative z-10 py-6 sm:py-10 max-w-7xl mx-auto gap-y-4 sm:gap-y-0">
      {features.map((feature, index) => (
        <Feature key={feature.title} {...feature} index={index} />
      ))}
    </div>
  );
}

const Feature = ({
  title,
  description,
  icon,
  index,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  index: number;
}) => {
  return (
    <div
      className={cn(
        "flex flex-col text-black lg:border-r py-6 sm:py-8 lg:py-10 relative group/feature border-zinc-800",
        (index === 0 || index === 4) && "lg:border-l border-zinc-800",
        index < 4 && "lg:border-b border-zinc-800",
      )}
    >
      {index < 4 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-t from-blue-500/20 to-transparent pointer-events-none" />
      )}
      {index >= 4 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-b from-blue-500/20 to-transparent pointer-events-none" />
      )}
      <div className="mb-3 sm:mb-4 relative z-10 px-6 sm:px-8 lg:px-10 text-blue-400 [&>svg]:w-6 [&>svg]:h-6 sm:[&>svg]:w-8 sm:[&>svg]:h-8">
        {icon}
      </div>
      <div className="text-base sm:text-lg font-bold mb-2 relative z-10 px-6 sm:px-8 lg:px-10">
        <div className="absolute left-0 inset-y-0 h-6 group-hover/feature:h-8 w-1 rounded-tr-full rounded-br-full bg-zinc-700 group-hover/feature:bg-blue-500 transition-all duration-200 origin-center" />
        <span className="group-hover/feature:translate-x-2 transition duration-200 inline-block text-black">
          {title}
        </span>
      </div>
      <p className="text-xs sm:text-sm text-black max-w-xs relative z-10 px-6 sm:px-8 lg:px-10">
        {description}
      </p>
    </div>
  );
};
