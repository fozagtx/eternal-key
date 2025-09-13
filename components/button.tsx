"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface GetStartedButtonProps {
  onClick?: () => void;
  children?: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
}

export function Button({
  onClick,
  children = "Get Started",
  className,
  size = "md",
  disabled = false,
}: GetStartedButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  const sizeClasses = {
    sm: "px-6 py-2 text-sm",
    md: "px-8 py-3 text-lg",
    lg: "px-10 py-4 text-xl",
  };

  const handleClick = () => {
    if (!disabled && onClick) {
      onClick();
    }
  };

  return (
    <button
      type="button"
      className={cn(
        "flex items-center gap-1.5 bg-[#38BDF8] text-white rounded-md px-[0.12rem] py-[0.12rem] transition-all duration-200",
        disabled
          ? "cursor-not-allowed opacity-50"
          : "cursor-pointer hover:brightness-95",
        className,
      )}
      onClick={handleClick}
      onMouseEnter={() => !disabled && setIsHovered(true)}
      onMouseLeave={() => !disabled && setIsHovered(false)}
      disabled={disabled}
      onKeyDown={(event) => {
        if (!disabled && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          handleClick();
        }
      }}
    >
      <div
        className={cn(
          "flex items-center gap-1.5 bg-gradient-to-r from-[#2567EC] to-[#37B6F7] rounded-[0.8rem] relative shadow-[0_1px_3px_0px_rgba(0,0,0,0.65)] font-medium",
          sizeClasses[size],
        )}
      >
        <span className="z-50">{children}</span>
        <div className="absolute w-full h-full left-0 top-0 bg-gradient-to-t from-white/0 to-white/50 z-10 rounded-[0.8rem] flex items-center justify-center">
          <div className="absolute w-[calc(100%-2px)] h-[calc(100%-2px)] top-[0.08rem] bg-gradient-to-r from-[#2567EC] to-[#37B6F7] z-50 rounded-[0.8rem]"></div>
        </div>
      </div>
    </button>
  );
}
