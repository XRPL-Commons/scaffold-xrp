"use client";

import { useState } from "react";
import { useXRPL } from "./providers/XRPLProvider";

export function DebugPanel() {
  const { network, isConnected, connectedWallet, balance, client } = useXRPL();
  const [isExpanded, setIsExpanded] = useState(true);
  const [customCommand, setCustomCommand] = useState("");
  const [commandResult, setCommandResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const executeCommand = async () => {
    if (!client || !client.isConnected() || !customCommand) return;

    setIsLoading(true);
    try {
      const command = JSON.parse(customCommand);
      const result = await client.request(command);
      setCommandResult(JSON.stringify(result, null, 2));
    } catch (error) {
      setCommandResult(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const loadExampleCommand = (type) => {
    const examples = {
      server_info: JSON.stringify({ command: "server_info" }, null, 2),
      account_info: connectedWallet
        ? JSON.stringify(
            {
              command: "account_info",
              account: connectedWallet.address,
              ledger_index: "validated",
            },
            null,
            2
          )
        : JSON.stringify({ command: "account_info", account: "rAddress..." }, null, 2),
      ledger: JSON.stringify({ command: "ledger", ledger_index: "validated" }, null, 2),
    };
    setCustomCommand(examples[type] || "");
  };

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Debug Panel</h2>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-500 hover:text-gray-700"
        >
          {isExpanded ? "▼" : "▶"}
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Network:</span>
              <span className="font-medium">{network.name}</span>
            </div>

            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Network ID:</span>
              <span className="font-medium">{network.networkId}</span>
            </div>

            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">WebSocket:</span>
              <span className="font-mono text-xs break-all">{network.wss}</span>
            </div>

            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Connection:</span>
              <span
                className={`font-medium ${isConnected ? "text-green-600" : "text-red-600"}`}
              >
                {isConnected ? "Connected" : "Disconnected"}
              </span>
            </div>

            {connectedWallet && (
              <>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Wallet:</span>
                  <span className="font-medium">{connectedWallet.type}</span>
                </div>

                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Address:</span>
                  <span className="font-mono text-xs break-all">{connectedWallet.address}</span>
                </div>

                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Balance:</span>
                  <span className="font-medium">
                    {balance !== null ? `${balance.toFixed(6)} XRP` : "Loading..."}
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="border-t border-gray-200 pt-4">
            <h3 className="font-medium mb-2">Custom XRPL Command</h3>

            <div className="flex gap-2 mb-2 flex-wrap">
              <button
                onClick={() => loadExampleCommand("server_info")}
                className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
              >
                Server Info
              </button>
              <button
                onClick={() => loadExampleCommand("account_info")}
                className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
              >
                Account Info
              </button>
              <button
                onClick={() => loadExampleCommand("ledger")}
                className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
              >
                Ledger
              </button>
            </div>

            <textarea
              value={customCommand}
              onChange={(e) => setCustomCommand(e.target.value)}
              placeholder='{"command": "server_info"}'
              className="w-full h-24 p-2 border border-gray-300 rounded-lg font-mono text-xs mb-2"
            />

            <button
              onClick={executeCommand}
              disabled={!isConnected || !customCommand || isLoading}
              className="btn-secondary text-sm w-full mb-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Executing..." : "Execute Command"}
            </button>

            {commandResult && (
              <div>
                <div className="text-sm font-medium mb-1">Result:</div>
                <pre className="p-2 bg-gray-50 rounded-lg text-xs overflow-auto max-h-64">
                  {commandResult}
                </pre>
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 pt-4">
            <h3 className="font-medium mb-2 text-sm">Quick Links</h3>
            <div className="space-y-1">
              <a
                href={network.explorer}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-xs text-accent hover:underline"
              >
                Explorer →
              </a>
              <a
                href={network.faucet}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-xs text-accent hover:underline"
              >
                Faucet →
              </a>
              <a
                href="https://xrpl.org/docs.html"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-xs text-accent hover:underline"
              >
                XRPL Docs →
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
