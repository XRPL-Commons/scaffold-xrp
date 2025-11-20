"use client";

import { useState } from "react";
import { useXRPL } from "./providers/XRPLProvider";

export function ContractInteraction() {
  const { connectedWallet, client, isConnected, addTransaction, refreshAccountInfo } = useXRPL();
  const [contractAddress, setContractAddress] = useState("");
  const [functionName, setFunctionName] = useState("");
  const [functionArgs, setFunctionArgs] = useState("");
  const [isCalling, setIsCalling] = useState(false);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState("");

  const stringToHex = (str) => {
    return Array.from(str)
      .map((c) => c.charCodeAt(0).toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();
  };

  const callContract = async () => {
    if (!connectedWallet || !isConnected || !contractAddress || !functionName) {
      setMessage("Please fill in all fields");
      return;
    }

    setIsCalling(true);
    setMessage("");
    setResult("");

    try {
      const functionNameHex = stringToHex(functionName);

      const tx = {
        TransactionType: "ContractCall",
        Account: connectedWallet.address,
        ContractAccount: contractAddress,
        Fee: "1000000",
        FunctionName: functionNameHex,
        ComputationAllowance: "1000000",
      };

      if (functionArgs) {
        tx.FunctionArgs = stringToHex(functionArgs);
      }

      setMessage("Please sign the transaction in your wallet...");

      if (window.xaman && connectedWallet.type === "Xaman") {
        const payload = await window.xaman.payload.create({
          txjson: tx,
        });
        setMessage(`Transaction submitted. Hash: ${payload.hash}`);
        setResult(JSON.stringify(payload.result || {}, null, 2));
        addTransaction({ tx, hash: payload.hash });
      } else if (window.crossmark && connectedWallet.type === "Crossmark") {
        const response = await window.crossmark.signAndSubmit(tx);
        setMessage(`Transaction submitted. Hash: ${response.hash}`);
        setResult(JSON.stringify(response.result || {}, null, 2));
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
      console.error("Contract call failed:", error);
      setMessage(`Error: ${error.message || "Failed to call contract"}`);
    } finally {
      setIsCalling(false);
    }
  };

  const loadCounterExample = () => {
    setFunctionName("increment");
    setFunctionArgs("");
  };

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Interact with Contract</h2>
        <button onClick={loadCounterExample} className="text-sm text-accent hover:underline">
          Load Counter Example
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contract Address
          </label>
          <input
            type="text"
            value={contractAddress}
            onChange={(e) => setContractAddress(e.target.value)}
            placeholder="rAddress..."
            className="input"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Function Name</label>
          <input
            type="text"
            value={functionName}
            onChange={(e) => setFunctionName(e.target.value)}
            placeholder="e.g., increment, get_value"
            className="input"
          />
          {functionName && (
            <div className="mt-1 text-xs text-gray-500">
              Hex: {stringToHex(functionName)}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Function Arguments (optional)
          </label>
          <input
            type="text"
            value={functionArgs}
            onChange={(e) => setFunctionArgs(e.target.value)}
            placeholder="e.g., 5, hello"
            className="input"
          />
          {functionArgs && (
            <div className="mt-1 text-xs text-gray-500">
              Hex: {stringToHex(functionArgs)}
            </div>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
          <strong>Example Counter Contract Functions:</strong>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>increment - Increase counter by 1</li>
            <li>decrement - Decrease counter by 1</li>
            <li>get_value - Get current counter value</li>
            <li>reset - Reset counter to 0</li>
          </ul>
        </div>

        <button
          onClick={callContract}
          disabled={!connectedWallet || !contractAddress || !functionName || isCalling}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCalling ? "Calling..." : "Call Contract Function"}
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

        {result && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Result</label>
            <pre className="p-3 bg-gray-50 rounded-lg text-xs overflow-auto">{result}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
