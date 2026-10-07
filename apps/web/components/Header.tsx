"use client";

import { useWallet as useBindingWallet } from "@xrpl-commons/xrpl-connect-react";
import { WalletConnector } from "./WalletConnector";
import { useWallet } from "./providers/WalletProvider";
import { NetworkSelector } from "./NetworkSelector";

export function Header() {
  const { error: walletError } = useBindingWallet();
  const { statusMessage } = useWallet();
  const message = statusMessage?.message || walletError?.message;
  const isError = statusMessage ? statusMessage.type === "error" : Boolean(walletError);

  return (
    <header className="mx-auto w-full max-w-6xl px-4 sm:px-6">
      <div className="flex min-h-24 flex-wrap items-center justify-between gap-4 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-foreground text-background">
            <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
              <path
                d="m4 4 5 5a4.25 4.25 0 0 0 6 0l5-5M4 20l5-5a4.25 4.25 0 0 1 6 0l5 5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <span className="text-lg font-semibold tracking-tight">Scaffold-XRP</span>
        </div>
        <div className="ml-auto flex flex-wrap items-center justify-end gap-3">
          <NetworkSelector />
          <WalletConnector />
        </div>
      </div>
      {message && (
        <p
          role={isError ? "alert" : "status"}
          className={`pb-3 text-sm ${isError ? "text-destructive" : "text-muted-foreground"}`}
        >
          {message}
        </p>
      )}
    </header>
  );
}
