"use client";

import {
  useWallet as useBindingWallet,
  useWalletModal,
} from "@xrpl-commons/xrpl-connect-react";
import { useWallet } from "./providers/WalletProvider";
import { WalletSetupDetails } from "./WalletSetupDetails";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Alert, AlertDescription } from "./ui/alert";
import { Badge } from "./ui/badge";

export function AccountInfo() {
  const {
    connected,
    account,
    network,
    manager,
    connecting,
  } = useBindingWallet();
  const { ready, open } = useWalletModal();
  const { selectedNetwork, showStatus } = useWallet();

  const handleConnect = async () => {
    try {
      await open();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      showStatus(`Wallet connection failed: ${message}`, "error");
    }
  };

  if (!connected || !account) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Account</CardTitle>
          <CardDescription>Connect a wallet to view account details</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
              <span>
                Your wallet address and balance will appear here after connecting on {selectedNetwork.name}.
              </span>
              <Button
                type="button"
                size="sm"
                onClick={() => void handleConnect()}
                disabled={!ready || connecting}
              >
                {connecting ? "Connecting…" : "Connect wallet"}
              </Button>
            </AlertDescription>
          </Alert>
          <WalletSetupDetails />
        </CardContent>
      </Card>
    );
  }

  const networkMismatch = account.network.id !== selectedNetwork.id;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Account</CardTitle>
        <CardDescription>Your connected wallet details</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between gap-3 rounded-md border p-3">
          <span className="text-sm text-muted-foreground">Address</span>
          <code className="break-all text-right text-xs font-mono">{account.address}</code>
        </div>
        <div className="flex items-center justify-between rounded-md border p-3">
          <span className="text-sm text-muted-foreground">Network</span>
          <span className="text-sm">{network?.name || account.network.name}</span>
        </div>
        <div className="flex items-center justify-between rounded-md border p-3">
          <span className="text-sm text-muted-foreground">Wallet</span>
          <span className="text-sm">{manager.wallet?.name || "Wallet"}</span>
        </div>
        {networkMismatch && (
          <Badge variant="warning">
            Switch wallet to {selectedNetwork.name} before sending
          </Badge>
        )}
        <p className="text-xs text-muted-foreground">
          Use the wallet button above to view account actions or disconnect.
        </p>
      </CardContent>
    </Card>
  );
}
