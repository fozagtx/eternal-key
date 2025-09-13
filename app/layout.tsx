import "@rainbow-me/rainbowkit/styles.css";
import "./globals.css";
import type { Metadata } from "next";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Crypto Inheritance System - Secure Your Legacy",
  description:
    "Secure your crypto assets for the future with our advanced inheritance system featuring deadman switch technology on Somnia testnet.",
  keywords:
    "crypto, inheritance, deadman switch, blockchain, Somnia, testnet, smart contract",
  authors: [{ name: "Crypto Inheritance System" }],
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1e1b4b",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
