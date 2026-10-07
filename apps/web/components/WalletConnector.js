"use client";

import { WalletConnector as XrplWalletConnector } from "@xrpl-commons/xrpl-connect-react";
import { useWallet } from "./providers/WalletProvider";

export function WalletConnector() {
  const { showStatus } = useWallet();

  return (
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
  );
}
