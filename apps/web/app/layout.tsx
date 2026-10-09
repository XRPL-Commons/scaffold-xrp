import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { WalletProvider } from "../components/providers/WalletProvider";

export const metadata: Metadata = {
  title: "Scaffold-XRP",
  description: "A starter for building XRP Ledger apps with Next.js.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground">
        <WalletProvider>{children}</WalletProvider>
      </body>
    </html>
  );
}
