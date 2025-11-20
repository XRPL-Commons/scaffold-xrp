"use client";

import { useState } from "react";
import { useXRPL } from "./providers/XRPLProvider";
import { NETWORKS } from "../lib/networks";

export function NetworkSwitcher() {
  const { network, switchNetwork } = useXRPL();
  const [isOpen, setIsOpen] = useState(false);

  const handleNetworkChange = async (networkId) => {
    await switchNetwork(networkId);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
      >
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <span className="font-medium">{network.name}</span>
        <span className="text-gray-500">▼</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
          {Object.values(NETWORKS).map((net) => (
            <button
              key={net.id}
              onClick={() => handleNetworkChange(net.id)}
              className={`w-full text-left px-4 py-2 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                network.id === net.id ? "bg-gray-100" : ""
              }`}
            >
              <div className="font-medium">{net.name}</div>
              <div className="text-xs text-gray-500">Network ID: {net.networkId}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
