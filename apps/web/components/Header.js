"use client";

import { WalletConnect } from "./WalletConnect";
import { NetworkSwitcher } from "./NetworkSwitcher";

export function Header() {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-xrpl rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">X</span>
            </div>
            <span className="text-xl font-bold">Scaffold-XRP</span>
          </div>

          <div className="flex items-center space-x-4">
            <NetworkSwitcher />
            <WalletConnect />
          </div>
        </div>
      </div>
    </header>
  );
}
