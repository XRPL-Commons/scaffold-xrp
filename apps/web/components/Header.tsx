"use client";

import Image from "next/image";
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
            <Image
              src="/xrpl-logo.png"
              alt=""
              width={28}
              height={24}
              className="object-contain brightness-0 invert"
            />
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
