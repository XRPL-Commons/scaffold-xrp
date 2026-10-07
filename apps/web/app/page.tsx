"use client";

import { Header } from "../components/Header";
import { AccountInfo } from "../components/AccountInfo";
import { TransactionForm } from "../components/TransactionForm";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <div className="container py-6">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight">Scaffold-XRP</h1>
            <p className="text-muted-foreground">
              A focused starter kit for building dApps on the XRP Ledger
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <AccountInfo />
            <TransactionForm />
          </div>

          <div className="mt-8 rounded-lg border p-6">
            <h2 className="mb-3 font-semibold">Getting started</h2>
            <ol className="list-inside list-decimal space-y-2 text-sm text-muted-foreground">
              <li>Choose Testnet or Devnet and connect Xaman, GemWallet, or WalletConnect.</li>
              <li>View your connected account details in the account panel.</li>
              <li>Send XRP with an optional destination tag from the payment panel.</li>
            </ol>
          </div>
        </div>
      </main>

      <footer className="border-t py-6">
        <div className="container text-center text-sm text-muted-foreground">
          Built with Scaffold-XRP
        </div>
      </footer>
    </div>
  );
}
