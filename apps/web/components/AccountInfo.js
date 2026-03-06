"use client";

import { useWallet } from "./providers/WalletProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

export function AccountInfo() {
  const { isConnected, accountInfo } = useWallet();

  if (!isConnected || !accountInfo) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Account</CardTitle>
        <CardDescription>Your connected wallet details</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between rounded-md border p-3">
          <span className="text-sm text-muted-foreground">Address</span>
          <code className="text-xs font-mono">{accountInfo.address}</code>
        </div>
        <div className="flex items-center justify-between rounded-md border p-3">
          <span className="text-sm text-muted-foreground">Network</span>
          <span className="text-sm">{accountInfo.network}</span>
        </div>
        <div className="flex items-center justify-between rounded-md border p-3">
          <span className="text-sm text-muted-foreground">Wallet</span>
          <span className="text-sm">{accountInfo.walletName}</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Click your address in the header to disconnect
        </p>
      </CardContent>
    </Card>
  );
}
