"use client";

import { useWallet as useBindingWallet } from "@xrpl-commons/xrpl-connect-react";
import { Wallet } from "lucide-react";
import { useWallet } from "./providers/WalletProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

export function AccountInfo() {
  const { connected, account, network, manager } = useBindingWallet();
  const { selectedNetwork } = useWallet();
  const hasAccount = connected && account;

  return (
    <Card className="min-w-0 rounded-xl">
      <CardHeader className="p-6 pb-6 md:p-8 md:pb-6">
        <CardTitle className="text-xl">Account</CardTitle>
        <CardDescription>
          {hasAccount ? "Your connected wallet." : "Your connected wallet will appear here."}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 pt-0 md:p-8 md:pt-0">
        {hasAccount ? (
          <>
            <dl className="divide-y text-sm">
              <div className="space-y-2 pb-5">
                <dt className="text-muted-foreground">Address</dt>
                <dd className="break-all font-mono text-xs leading-relaxed">{account.address}</dd>
              </div>
              <div className="flex items-center justify-between gap-3 py-4">
                <dt className="text-muted-foreground">Network</dt>
                <dd>{network?.name || account.network.name}</dd>
              </div>
              <div className="flex items-center justify-between gap-3 pt-4">
                <dt className="text-muted-foreground">Wallet</dt>
                <dd>{manager.wallet?.name || "Wallet"}</dd>
              </div>
            </dl>
            {account.network.id !== selectedNetwork.id && (
              <p role="alert" className="mt-5 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
                Switch your wallet to {selectedNetwork.name} before sending.
              </p>
            )}
          </>
        ) : (
          <div className="flex min-h-40 items-center gap-5 rounded-xl bg-muted/60 p-6 md:p-8">
            <Wallet
              className="h-9 w-9 shrink-0 text-muted-foreground"
              strokeWidth={1.5}
              aria-hidden="true"
            />
            <div>
              <p className="font-medium">Not connected</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Connect your wallet above to get started.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
