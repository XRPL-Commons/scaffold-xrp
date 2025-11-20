"use client";

import { useState, useEffect } from "react";
import { useXRPL } from "./providers/XRPLProvider";

export function WalletConnect() {
  const { connectedWallet, connectWallet, disconnectWallet } = useXRPL();
  const [isClient, setIsClient] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [manualAddress, setManualAddress] = useState("");

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleConnect = async (walletType) => {
    if (walletType === "manual") {
      if (manualAddress && manualAddress.startsWith("r")) {
        await connectWallet(manualAddress, "Manual");
        setShowModal(false);
        setManualAddress("");
      }
      return;
    }

    if (typeof window === "undefined") return;

    try {
      if (walletType === "xaman") {
        if (window.xaman) {
          const response = await window.xaman.connect();
          if (response?.address) {
            await connectWallet(response.address, "Xaman");
            setShowModal(false);
          }
        } else {
          alert("Xaman wallet not found. Please install the extension.");
        }
      } else if (walletType === "crossmark") {
        if (window.crossmark) {
          const response = await window.crossmark.connect();
          if (response?.address) {
            await connectWallet(response.address, "Crossmark");
            setShowModal(false);
          }
        } else {
          alert("Crossmark wallet not found. Please install the extension.");
        }
      } else if (walletType === "gemwallet") {
        if (window.gemWallet) {
          const response = await window.gemWallet.getAddress();
          if (response?.address) {
            await connectWallet(response.address, "GemWallet");
            setShowModal(false);
          }
        } else {
          alert("GemWallet not found. Please install the extension.");
        }
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      alert("Failed to connect wallet. Please try again.");
    }
  };

  if (!isClient) {
    return (
      <button className="btn-primary" disabled>
        Loading...
      </button>
    );
  }

  if (connectedWallet) {
    return (
      <div className="flex items-center space-x-2">
        <div className="bg-gray-100 px-4 py-2 rounded-lg">
          <div className="text-xs text-gray-500">{connectedWallet.type}</div>
          <div className="font-mono text-sm">
            {connectedWallet.address.slice(0, 6)}...{connectedWallet.address.slice(-4)}
          </div>
        </div>
        <button onClick={disconnectWallet} className="btn-secondary text-sm">
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <>
      <button onClick={() => setShowModal(true)} className="btn-primary">
        Connect Wallet
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Connect Wallet</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => handleConnect("xaman")}
                className="w-full p-4 border border-gray-300 rounded-lg hover:border-accent hover:bg-gray-50 transition-colors text-left"
              >
                <div className="font-medium">Xaman (Xumm)</div>
                <div className="text-sm text-gray-500">Connect with Xaman wallet</div>
              </button>

              <button
                onClick={() => handleConnect("crossmark")}
                className="w-full p-4 border border-gray-300 rounded-lg hover:border-accent hover:bg-gray-50 transition-colors text-left"
              >
                <div className="font-medium">Crossmark</div>
                <div className="text-sm text-gray-500">Connect with Crossmark wallet</div>
              </button>

              <button
                onClick={() => handleConnect("gemwallet")}
                className="w-full p-4 border border-gray-300 rounded-lg hover:border-accent hover:bg-gray-50 transition-colors text-left"
              >
                <div className="font-medium">GemWallet</div>
                <div className="text-sm text-gray-500">Connect with GemWallet</div>
              </button>

              <div className="border-t border-gray-200 pt-3">
                <div className="font-medium mb-2">Or enter address manually</div>
                <input
                  type="text"
                  placeholder="rAddress..."
                  value={manualAddress}
                  onChange={(e) => setManualAddress(e.target.value)}
                  className="input mb-2"
                />
                <button onClick={() => handleConnect("manual")} className="btn-primary w-full">
                  Connect Manually
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
