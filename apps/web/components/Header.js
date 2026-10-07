"use client";

import { useWallet as useBindingWallet } from "@xrpl-commons/xrpl-connect-react";
import { WalletConnector } from "./WalletConnector";
import { useWallet } from "./providers/WalletProvider";
import { NetworkSelector } from "./NetworkSelector";
import { Badge } from "./ui/badge";

export function Header() {
  const { error: walletError } = useBindingWallet();
  const { statusMessage } = useWallet();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex min-h-14 flex-wrap items-center gap-3 py-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-foreground text-background">
            <span className="font-semibold text-sm">X</span>
          </div>
          <span className="font-semibold">Scaffold-XRP</span>
        </div>

        <div className="ml-auto flex flex-wrap items-center justify-end gap-3">
          <NetworkSelector />
          {statusMessage && (
            <Badge
              variant={
                statusMessage.type === "success"
                  ? "success"
                  : statusMessage.type === "error"
                    ? "destructive"
                    : statusMessage.type === "warning"
                      ? "warning"
                      : "secondary"
              }
            >
              {statusMessage.message}
            </Badge>
          )}
          {!statusMessage && walletError && (
            <Badge variant="destructive">{walletError.message}</Badge>
          )}
          <WalletConnector />
        </div>
      </div>
    </header>
  );
}
