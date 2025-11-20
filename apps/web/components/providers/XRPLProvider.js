"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { Client } from "xrpl";
import { DEFAULT_NETWORK, NETWORKS } from "../../lib/networks";

const XRPLContext = createContext();

export function XRPLProvider({ children }) {
  const [network, setNetwork] = useState(DEFAULT_NETWORK);
  const [client, setClient] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectedWallet, setConnectedWallet] = useState(null);
  const [balance, setBalance] = useState(null);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const initClient = async () => {
      try {
        const newClient = new Client(network.wss);
        await newClient.connect();
        setClient(newClient);
        setIsConnected(true);
      } catch (error) {
        console.error("Failed to connect to XRPL:", error);
        setIsConnected(false);
      }
    };

    initClient();

    return () => {
      if (client && client.isConnected()) {
        client.disconnect();
      }
    };
  }, [network]);

  const switchNetwork = async (networkId) => {
    const newNetwork = Object.values(NETWORKS).find((n) => n.id === networkId);
    if (newNetwork && newNetwork.id !== network.id) {
      if (client && client.isConnected()) {
        await client.disconnect();
      }
      setNetwork(newNetwork);
      setBalance(null);
      setTransactions([]);
    }
  };

  const connectWallet = async (walletAddress, walletType) => {
    setConnectedWallet({ address: walletAddress, type: walletType });
    await refreshAccountInfo(walletAddress);
  };

  const disconnectWallet = () => {
    setConnectedWallet(null);
    setBalance(null);
    setTransactions([]);
  };

  const refreshAccountInfo = async (address) => {
    if (!client || !client.isConnected()) return;

    try {
      const accountInfo = await client.request({
        command: "account_info",
        account: address || connectedWallet?.address,
        ledger_index: "validated",
      });

      const balanceInXRP = Number(accountInfo.result.account_data.Balance) / 1000000;
      setBalance(balanceInXRP);

      const txHistory = await client.request({
        command: "account_tx",
        account: address || connectedWallet?.address,
        limit: 10,
      });

      setTransactions(txHistory.result.transactions || []);
    } catch (error) {
      console.error("Failed to fetch account info:", error);
    }
  };

  const addTransaction = (tx) => {
    setTransactions((prev) => [tx, ...prev]);
  };

  const value = {
    network,
    switchNetwork,
    client,
    isConnected,
    connectedWallet,
    connectWallet,
    disconnectWallet,
    balance,
    transactions,
    refreshAccountInfo,
    addTransaction,
  };

  return <XRPLContext.Provider value={value}>{children}</XRPLContext.Provider>;
}

export function useXRPL() {
  const context = useContext(XRPLContext);
  if (!context) {
    throw new Error("useXRPL must be used within XRPLProvider");
  }
  return context;
}
