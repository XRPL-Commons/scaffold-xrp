"use client";

import { useState } from "react";
import { useXRPL } from "./providers/XRPLProvider";

export function ContractDeployment() {
  const { connectedWallet, client, isConnected, addTransaction, refreshAccountInfo } = useXRPL();
  const [wasmFile, setWasmFile] = useState(null);
  const [wasmHex, setWasmHex] = useState("");
  const [isDeploying, setIsDeploying] = useState(false);
  const [message, setMessage] = useState("");
  const [contractAddress, setContractAddress] = useState("");

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setWasmFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        const arrayBuffer = event.target.result;
        const bytes = new Uint8Array(arrayBuffer);
        const hex = Array.from(bytes)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("")
          .toUpperCase();
        setWasmHex(hex);
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const deployContract = async () => {
    if (!connectedWallet || !isConnected || !wasmHex) {
      setMessage("Please connect wallet and select a WASM file");
      return;
    }

    setIsDeploying(true);
    setMessage("");

    try {
      const tx = {
        TransactionType: "ContractCreate",
        Account: connectedWallet.address,
        Fee: "100000000",
        ContractCode: wasmHex,
      };

      setMessage("Please sign the transaction in your wallet...");

      if (window.xaman && connectedWallet.type === "Xaman") {
        const payload = await window.xaman.payload.create({
          txjson: tx,
        });
        setMessage(`Transaction submitted. Hash: ${payload.hash}`);
        setContractAddress(payload.contractAddress || "Check explorer for contract address");
        addTransaction({ tx, hash: payload.hash });
      } else if (window.crossmark && connectedWallet.type === "Crossmark") {
        const response = await window.crossmark.signAndSubmit(tx);
        setMessage(`Transaction submitted. Hash: ${response.hash}`);
        setContractAddress(response.contractAddress || "Check explorer for contract address");
        addTransaction({ tx, hash: response.hash });
      } else {
        setMessage(
          "Manual transaction signing not yet implemented. Please use Xaman or Crossmark wallet."
        );
      }

      setTimeout(() => {
        refreshAccountInfo();
      }, 3000);
    } catch (error) {
      console.error("Contract deployment failed:", error);
      setMessage(`Error: ${error.message || "Failed to deploy contract"}`);
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="card">
      <h2 className="text-xl font-bold mb-4">Deploy Contract</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload WASM File
          </label>
          <input
            type="file"
            accept=".wasm"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-accent file:text-white hover:file:bg-accent/90"
          />
          {wasmFile && (
            <div className="mt-2 text-sm text-gray-600">
              Selected: {wasmFile.name} ({(wasmFile.size / 1024).toFixed(2)} KB)
            </div>
          )}
        </div>

        {wasmHex && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contract Code (Hex)
            </label>
            <textarea
              value={wasmHex}
              readOnly
              className="w-full h-32 p-3 bg-gray-50 rounded-lg font-mono text-xs"
            />
          </div>
        )}

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
          <strong>Note:</strong> Contract deployment requires 100 XRP as fee. Make sure you have
          sufficient balance.
        </div>

        <button
          onClick={deployContract}
          disabled={!connectedWallet || !wasmHex || isDeploying}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDeploying ? "Deploying..." : "Deploy Contract"}
        </button>

        {message && (
          <div
            className={`p-3 rounded-lg ${
              message.startsWith("Error")
                ? "bg-red-50 text-red-700 border border-red-200"
                : "bg-blue-50 text-blue-700 border border-blue-200"
            }`}
          >
            {message}
          </div>
        )}

        {contractAddress && (
          <div className="p-3 rounded-lg bg-green-50 border border-green-200">
            <div className="text-sm text-green-700 font-medium mb-1">Contract Deployed!</div>
            <div className="text-xs font-mono break-all">{contractAddress}</div>
          </div>
        )}
      </div>
    </div>
  );
}
