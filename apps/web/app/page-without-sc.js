"use client";

import { Header } from "../components/Header";
import { AccountInfo } from "../components/AccountInfo";
import { TransactionForm } from "../components/TransactionForm";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Scaffold-XRP</h1>
          <p className="text-gray-600">
            A starter kit for building dApps on the XRP Ledger
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <AccountInfo />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <TransactionForm />
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-3">Getting Started</h2>
          <div className="space-y-2 text-sm">
            <p>1. Connect your wallet using the button in the header</p>
            <p>2. View your account details in the account info panel</p>
            <p>3. Send XRP transactions using the transaction form</p>
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-200 mt-16">
        <div className="container mx-auto px-4 py-6 text-center text-gray-600">
          <p>Built with Scaffold-XRP</p>
        </div>
      </footer>
    </div>
  );
}
