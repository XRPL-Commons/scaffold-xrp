"use client";

import dynamic from "next/dynamic";
import { useWallet } from "./providers/WalletProvider";

function WalletConnectorPlaceholder() {
  return (
    <span
      role="status"
      aria-label="Loading wallet connection options"
      aria-live="polite"
      aria-busy="true"
      className="inline-flex h-9 min-w-32 items-center justify-center rounded-md border border-input bg-muted/50 px-3 text-xs text-muted-foreground"
    >
      Loading wallets…
    </span>
  );
}

const XrplWalletConnector = dynamic(
  () => import("@xrpl-commons/xrpl-connect-react").then(({ WalletConnector }) => WalletConnector),
  {
    ssr: false,
    loading: WalletConnectorPlaceholder,
  }
);

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
      onConnecting={(walletId) => showStatus(`Connecting to ${walletId}…`, "info")}
      onConnect={() => showStatus("Wallet connected", "success")}
      onError={(error) => showStatus(error.message, "error")}
    />
  );
}
