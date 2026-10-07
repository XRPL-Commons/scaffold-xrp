"use client";

import { WALLET_CONFIGURATION } from "./providers/WalletProvider";

export function WalletSetupDetails() {
  const missingConfiguration = [];

  if (!WALLET_CONFIGURATION.xamanConfigured) {
    missingConfiguration.push("NEXT_PUBLIC_XAMAN_API_KEY for Xaman");
  }
  if (!WALLET_CONFIGURATION.walletConnectConfigured) {
    missingConfiguration.push(
      "NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID for WalletConnect"
    );
  }

  if (missingConfiguration.length === 0) return null;

  return (
    <details className="mt-4 rounded-md border bg-muted/30 p-3 text-sm">
      <summary className="cursor-pointer font-medium">
        Hosted wallet setup
      </summary>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        Add {missingConfiguration.join(" and ")} to your local environment to
        enable those hosted wallet flows. GemWallet works through its browser
        extension.
      </p>
    </details>
  );
}
