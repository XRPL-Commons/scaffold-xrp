"use client";

import { WalletConnector as XrplWalletConnector } from "@xrpl-commons/xrpl-connect-react";
import { useWallet } from "./providers/WalletProvider";
import { WALLET_CONFIGURATION } from "./providers/WalletProvider";

export function WalletConnector() {
  const { showStatus } = useWallet();
  const missingConfiguration = [];

  if (!WALLET_CONFIGURATION.xamanConfigured) {
    missingConfiguration.push("NEXT_PUBLIC_XAMAN_API_KEY for Xaman");
  }
  if (!WALLET_CONFIGURATION.walletConnectConfigured) {
    missingConfiguration.push(
      "NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID for WalletConnect"
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <XrplWalletConnector
        id="wallet-connector"
        aria-label="Choose an XRPL wallet"
        primaryWallet="xaman"
        wallets={["xaman", "gemwallet", "walletconnect"]}
        showUnavailable
        theme="light"
        cssVars={{
          "--xc-font-family": "inherit",
          "--xc-border-radius": "0.5rem",
          "--xc-connect-button-border-radius": "0.375rem",
        }}
        onConnecting={(walletId) =>
          showStatus(`Connecting to ${walletId}…`, "info")
        }
        onConnect={() => showStatus("Wallet connected", "success")}
        onError={(error) => showStatus(error.message, "error")}
      />
      {missingConfiguration.length > 0 && (
        <p className="max-w-[18rem] text-right text-[0.65rem] leading-tight text-muted-foreground">
          Add {missingConfiguration.join(" and ")} to enable those hosted wallet
          flows. GemWallet works through its browser extension.
        </p>
      )}
    </div>
  );
}
