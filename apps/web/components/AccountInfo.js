"use client";

import { useEffect } from "react";
import { useXRPL } from "./providers/XRPLProvider";

export function AccountInfo() {
  const { connectedWallet, balance, refreshAccountInfo, isConnected } = useXRPL();

  useEffect(() => {
    if (connectedWallet && isConnected) {
      refreshAccountInfo();
      const interval = setInterval(() => {
        refreshAccountInfo();
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [connectedWallet, isConnected]);

  if (!connectedWallet) {
    return (
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Account Info</h2>
        <div className="text-center py-8 text-gray-500">
          <p>Connect your wallet to view account information</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="text-xl font-bold mb-4">Account Info</h2>

      <div className="space-y-4">
        <div>
          <label className="text-sm text-gray-500 block mb-1">Address</label>
          <div className="font-mono bg-gray-50 p-3 rounded-lg break-all">
            {connectedWallet.address}
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-500 block mb-1">Balance</label>
          <div className="text-3xl font-bold text-xrpl">
            {balance !== null ? `${balance.toFixed(6)} XRP` : "Loading..."}
          </div>
        </div>

        <button onClick={() => refreshAccountInfo()} className="btn-secondary text-sm">
          Refresh Balance
        </button>
      </div>
    </div>
  );
}
