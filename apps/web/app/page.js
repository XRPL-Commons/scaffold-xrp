"use client";

import { Header } from "../components/Header";
import { AccountInfo } from "../components/AccountInfo";
import { FaucetRequest } from "../components/FaucetRequest";
import { ContractDeployment } from "../components/ContractDeployment";
import { ContractInteraction } from "../components/ContractInteraction";
import { TransactionHistory } from "../components/TransactionHistory";
import { DebugPanel } from "../components/DebugPanel";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Scaffold-XRP</h1>
          <p className="text-gray-600">
            A starter kit for building dApps on XRPL with smart contracts
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <AccountInfo />
            <FaucetRequest />
            <ContractDeployment />
            <ContractInteraction />
            <TransactionHistory />
          </div>

          <div className="lg:col-span-1">
            <DebugPanel />
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-200 mt-16">
        <div className="container mx-auto px-4 py-6 text-center text-gray-600">
          <p>Built with Scaffold-XRP 🚀</p>
        </div>
      </footer>
    </div>
  );
}
