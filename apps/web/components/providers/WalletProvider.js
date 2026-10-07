"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  useSigner,
  useWallet as useBindingWallet,
  XrplConnectProvider,
} from "@xrpl-commons/xrpl-connect-react";
import {
  GemWalletAdapter,
  WalletConnectAdapter,
  XamanAdapter,
} from "xrpl-connect";
import { DEFAULT_NETWORK, getNetworkById } from "../../lib/networks";

const WalletContext = createContext(undefined);
const NetworkSelectionContext = createContext(undefined);

const xamanApiKey = process.env.NEXT_PUBLIC_XAMAN_API_KEY?.trim() || "";
const walletConnectProjectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID?.trim() || "";

export const WALLET_CONFIGURATION = Object.freeze({
  xamanConfigured: Boolean(xamanApiKey),
  walletConnectConfigured: Boolean(walletConnectProjectId),
});

function createWalletConfig(networkId) {
  return {
    adapters: [
      new XamanAdapter(xamanApiKey ? { apiKey: xamanApiKey } : undefined),
      new GemWalletAdapter(),
      new WalletConnectAdapter(
        walletConnectProjectId ? { projectId: walletConnectProjectId } : undefined
      ),
    ],
    network: networkId,
    autoConnect: true,
    logger: { level: "warn" },
  };
}

function WalletCompatibilityBridge({ children }) {
  const {
    manager,
    connected,
    account,
    network,
    connecting,
    error,
  } = useBindingWallet();
  const signer = useSigner();
  const {
    selectedNetworkId,
    selectedNetwork,
    setSelectedNetworkId,
  } = useContext(NetworkSelectionContext);
  const [events, setEvents] = useState([]);
  const [statusMessage, setStatusMessage] = useState(null);
  const [networkSwitching, setNetworkSwitching] = useState(false);
  const statusTimerRef = useRef(null);

  const addEvent = useCallback((name, data) => {
    setEvents((previous) => [
      {
        timestamp: new Date().toLocaleTimeString(),
        name,
        data,
      },
      ...previous,
    ]);
  }, []);

  const clearEvents = useCallback(() => setEvents([]), []);

  const showStatus = useCallback((message, type = "info") => {
    setStatusMessage({ message, type });
    if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
    statusTimerRef.current = setTimeout(() => setStatusMessage(null), 5000);
  }, []);

  const selectNetwork = useCallback(
    async (networkId) => {
      const nextNetwork = getNetworkById(networkId);
      if (!nextNetwork || nextNetwork.id === selectedNetworkId) return;

      setNetworkSwitching(true);
      try {
        // WalletManager v1 has no generic switchNetwork method. Disconnecting
        // first makes the provider's new network config authoritative when its
        // key changes below, and cancels a pending connection if necessary.
        await manager.disconnect();
        setSelectedNetworkId(nextNetwork.id);
      } catch (switchError) {
        const message =
          switchError instanceof Error ? switchError.message : String(switchError);
        showStatus(`Could not switch network: ${message}`, "error");
      } finally {
        setNetworkSwitching(false);
      }
    },
    [manager, selectedNetworkId, setSelectedNetworkId, showStatus]
  );

  useEffect(() => {
    const onConnect = (nextAccount) => addEvent("Connected", nextAccount);
    const onDisconnect = () => addEvent("Disconnected", null);
    const onNetworkChanged = (nextNetwork) =>
      addEvent("Network changed", nextNetwork);
    const onError = (nextError) => addEvent("Wallet error", nextError);

    manager.on("connect", onConnect);
    manager.on("disconnect", onDisconnect);
    manager.on("networkChanged", onNetworkChanged);
    manager.on("error", onError);

    return () => {
      manager.off("connect", onConnect);
      manager.off("disconnect", onDisconnect);
      manager.off("networkChanged", onNetworkChanged);
      manager.off("error", onError);
    };
  }, [addEvent, manager]);

  useEffect(
    () => () => {
      if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
    },
    []
  );

  const contextValue = useMemo(
    () => {
      const accountInfo = account
        ? {
            address: account.address,
            network: `${account.network.name} (${account.network.id})`,
            walletName: manager.wallet?.name || "Wallet",
          }
        : null;

      return {
        // Compatibility fields keep the optional primitive components usable.
        // Their values and signer methods are all derived from XRPL Connect's
        // provider; this context does not own a second wallet lifecycle.
        walletManager: manager,
        isConnected: connected,
        accountInfo,
        account,
        network,
        connecting,
        error,
        events,
        statusMessage,
        addEvent,
        clearEvents,
        showStatus,
        ...signer,
        selectedNetwork,
        networkSwitching,
        selectNetwork,
      };
    },
    [
      account,
      addEvent,
      clearEvents,
      connected,
      connecting,
      error,
      events,
      manager,
      network,
      networkSwitching,
      selectNetwork,
      selectedNetwork,
      showStatus,
      signer,
      statusMessage,
    ]
  );

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
}

export function WalletProvider({ children }) {
  const [selectedNetworkId, setSelectedNetworkId] = useState(DEFAULT_NETWORK.id);
  const selectedNetwork =
    getNetworkById(selectedNetworkId) || DEFAULT_NETWORK;
  const config = useMemo(
    () => createWalletConfig(selectedNetwork.id),
    [selectedNetwork.id]
  );
  const networkSelection = useMemo(
    () => ({
      selectedNetworkId: selectedNetwork.id,
      selectedNetwork,
      setSelectedNetworkId,
    }),
    [selectedNetwork]
  );

  return (
    <NetworkSelectionContext.Provider value={networkSelection}>
      <XrplConnectProvider key={selectedNetwork.id} config={config}>
        <WalletCompatibilityBridge>{children}</WalletCompatibilityBridge>
      </XrplConnectProvider>
    </NetworkSelectionContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
