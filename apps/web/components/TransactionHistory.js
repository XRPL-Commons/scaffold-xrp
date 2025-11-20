"use client";

import { useXRPL } from "./providers/XRPLProvider";

export function TransactionHistory() {
  const { connectedWallet, transactions, network } = useXRPL();

  const formatDate = (timestamp) => {
    const rippleEpoch = 946684800;
    const unixTimestamp = (timestamp + rippleEpoch) * 1000;
    return new Date(unixTimestamp).toLocaleString();
  };

  const formatAmount = (amount) => {
    if (typeof amount === "string") {
      return (Number(amount) / 1000000).toFixed(6) + " XRP";
    }
    return JSON.stringify(amount);
  };

  if (!connectedWallet) {
    return (
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Transaction History</h2>
        <div className="text-center py-8 text-gray-500">
          <p>Connect your wallet to view transaction history</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="text-xl font-bold mb-4">Transaction History</h2>

      {transactions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No transactions found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((item, index) => {
            const tx = item.tx || item;
            const meta = item.meta;

            return (
              <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="inline-block px-2 py-1 bg-accent text-white text-xs rounded">
                      {tx.TransactionType}
                    </span>
                  </div>
                  {meta?.TransactionResult && (
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        meta.TransactionResult === "tesSUCCESS"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {meta.TransactionResult}
                    </span>
                  )}
                </div>

                <div className="space-y-1 text-sm">
                  {tx.hash && (
                    <div className="flex items-start">
                      <span className="text-gray-500 w-20">Hash:</span>
                      <a
                        href={`${network.explorer}/transactions/${tx.hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-xs text-accent hover:underline break-all"
                      >
                        {tx.hash}
                      </a>
                    </div>
                  )}

                  {tx.Account && (
                    <div className="flex items-start">
                      <span className="text-gray-500 w-20">From:</span>
                      <span className="font-mono text-xs break-all">{tx.Account}</span>
                    </div>
                  )}

                  {(tx.Destination || tx.ContractAccount) && (
                    <div className="flex items-start">
                      <span className="text-gray-500 w-20">To:</span>
                      <span className="font-mono text-xs break-all">
                        {tx.Destination || tx.ContractAccount}
                      </span>
                    </div>
                  )}

                  {tx.Amount && (
                    <div className="flex items-start">
                      <span className="text-gray-500 w-20">Amount:</span>
                      <span className="font-medium">{formatAmount(tx.Amount)}</span>
                    </div>
                  )}

                  {tx.Fee && (
                    <div className="flex items-start">
                      <span className="text-gray-500 w-20">Fee:</span>
                      <span>{formatAmount(tx.Fee)}</span>
                    </div>
                  )}

                  {tx.date && (
                    <div className="flex items-start">
                      <span className="text-gray-500 w-20">Date:</span>
                      <span className="text-xs">{formatDate(tx.date)}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
