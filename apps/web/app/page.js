"use client";

import { Header } from "../components/Header";
import { AccountInfo } from "../components/AccountInfo";
import { ContractInteraction } from "../components/ContractInteraction";
import { TransactionForm } from "../components/TransactionForm";
import { MPTokenCard } from "../components/MPTokenCard";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <div className="container py-6">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight">Scaffold-XRP</h1>
            <p className="text-muted-foreground">
              Build dApps on XRPL with smart contracts
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <AccountInfo />
            <ContractInteraction />
            <TransactionForm />
            <MPTokenCard />
          </div>

          <div className="mt-8 rounded-lg border p-6">
            <h2 className="font-semibold mb-3">Getting Started</h2>
            <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
              <li>Connect your wallet using the button in the header</li>
              <li>Deploy your smart contract using Bedrock or XRPL CLI</li>
              <li>Interact with deployed contracts using the contract panel</li>
              <li>Send XRP transactions using the transaction form</li>
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
