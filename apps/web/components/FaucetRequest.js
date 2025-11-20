"use client";

import { useState } from "react";
import { useXRPL } from "./providers/XRPLProvider";

export function FaucetRequest() {
  const { connectedWallet, network, refreshAccountInfo } = useXRPL();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  const requestFunds = async () => {
    if (!connectedWallet) {
      setMessage("Please connect your wallet first");
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      const response = await fetch(network.faucet, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          destination: connectedWallet.address,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessage(`Success! Funded with ${data.amount || "1000"} XRP`);
        setTimeout(() => {
          refreshAccountInfo();
        }, 2000);
      } else {
        const error = await response.text();
        setMessage(`Error: ${error || "Failed to request funds"}`);
      }
    } catch (error) {
      console.error("Faucet request failed:", error);
      setMessage("Error: Failed to connect to faucet");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card">
      <h2 className="text-xl font-bold mb-4">Faucet</h2>

      <div className="space-y-4">
        <p className="text-gray-600">
          Request test XRP from the {network.name} faucet. Use this to fund your account for testing.
        </p>

        <button
          onClick={requestFunds}
          disabled={!connectedWallet || isLoading}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Requesting funds..." : "Request Test XRP"}
        </button>

        {message && (
          <div
            className={`p-3 rounded-lg ${
              message.startsWith("Success")
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {message}
          </div>
        )}

        {!connectedWallet && (
          <div className="text-sm text-gray-500">
            Connect your wallet to request test funds
          </div>
        )}
      </div>
    </div>
  );
}