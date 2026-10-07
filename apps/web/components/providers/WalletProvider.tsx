"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import {
  useSigner,
  useWallet as useBindingWallet,
  XrplConnectProvider,
  type XrplConnectConfig,
} from "@xrpl-commons/xrpl-connect-react";
import {
  GemWalletAdapter,
  WalletConnectAdapter,
  XamanAdapter,
  type AccountInfo,
  type NetworkInfo,
  type SubmittedTransaction,
  type WalletError,
  type WalletManager,
} from "xrpl-connect";
import { DEFAULT_NETWORK, getNetworkById, type Network, type NetworkId } from "../../lib/networks";
import type { AppTransaction } from "../../lib/transactions";

type StatusType = "info" | "success" | "error" | "warning";

export interface WalletStatusMessage {
  message: string;
  type: StatusType;
}

export interface WalletEvent {
  timestamp: string;
  name: string;
  data: unknown;
}

export interface WalletContextValue {
  walletManager: WalletManager;
  isConnected: boolean;
  accountInfo: {
    address: string;
    network: string;
    walletName: string;
  } | null;
  account: AccountInfo | null;
  network: NetworkInfo | null;
  connecting: boolean;
  error: WalletError | null;
  events: WalletEvent[];
  statusMessage: WalletStatusMessage | null;
  addEvent: (name: string, data: unknown) => void;
  clearEvents: () => void;
  showStatus: (message: string, type?: StatusType) => void;
  sign: ReturnType<typeof useSigner>["sign"];
  signAndSubmit: (transaction: AppTransaction) => Promise<SubmittedTransaction>;
  signMessage: ReturnType<typeof useSigner>["signMessage"];
  selectedNetwork: Network;
  networkSwitching: boolean;
  selectNetwork: (networkId: NetworkId) => Promise<void>;
}

interface NetworkSelectionValue {
  selectedNetworkId: NetworkId;
  selectedNetwork: Network;
  setSelectedNetworkId: Dispatch<SetStateAction<NetworkId>>;
}

const WalletContext = createContext<WalletContextValue | undefined>(undefined);
const NetworkSelectionContext = createContext<NetworkSelectionValue | undefined>(undefined);

const xamanApiKey = process.env.NEXT_PUBLIC_XAMAN_API_KEY?.trim() || "";
const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID?.trim() || "";

export const WALLET_CONFIGURATION = Object.freeze({
  xamanConfigured: Boolean(xamanApiKey),
  walletConnectConfigured: Boolean(walletConnectProjectId),
});

function createWalletConfig(networkId: NetworkId): XrplConnectConfig {
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

function WalletCompatibilityBridge({ children }: { children: ReactNode }) {
  const { manager, connected, account, network, connecting, error } = useBindingWallet();
  const signer = useSigner();
  const networkSelection = useContext(NetworkSelectionContext);
  if (!networkSelection) {
    throw new Error("WalletCompatibilityBridge must be inside WalletProvider");
  }
  const { selectedNetworkId, selectedNetwork, setSelectedNetworkId } = networkSelection;
  const [events, setEvents] = useState<WalletEvent[]>([]);
  const [statusMessage, setStatusMessage] = useState<WalletStatusMessage | null>(null);
  const [networkSwitching, setNetworkSwitching] = useState(false);
  const statusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const addEvent = useCallback((name: string, data: unknown) => {
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

  const showStatus = useCallback((message: string, type: StatusType = "info") => {
    setStatusMessage({ message, type });
    if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
    statusTimerRef.current = setTimeout(() => setStatusMessage(null), 5000);
  }, []);

  const selectNetwork = useCallback(
    async (networkId: NetworkId) => {
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
        const message = switchError instanceof Error ? switchError.message : String(switchError);
        showStatus(`Could not switch network: ${message}`, "error");
      } finally {
        setNetworkSwitching(false);
      }
    },
    [manager, selectedNetworkId, setSelectedNetworkId, showStatus]
  );

  const signAndSubmit = useCallback(
    (transaction: AppTransaction) =>
      manager.signAndSubmit(transaction as Parameters<WalletManager["signAndSubmit"]>[0]),
    [manager]
  );

  useEffect(() => {
    const onConnect = (nextAccount: AccountInfo) => addEvent("Connected", nextAccount);
    const onDisconnect = () => addEvent("Disconnected", null);
    const onNetworkChanged = (nextNetwork: NetworkInfo) => addEvent("Network changed", nextNetwork);
    const onError = (nextError: unknown) => addEvent("Wallet error", nextError);

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

  const contextValue = useMemo(() => {
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
      signAndSubmit,
      selectedNetwork,
      networkSwitching,
      selectNetwork,
    };
  }, [
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
    signAndSubmit,
    showStatus,
    signer,
    statusMessage,
  ]);

  return <WalletContext.Provider value={contextValue}>{children}</WalletContext.Provider>;
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [selectedNetworkId, setSelectedNetworkId] = useState<NetworkId>(DEFAULT_NETWORK.id);
  const selectedNetwork = getNetworkById(selectedNetworkId) || DEFAULT_NETWORK;
  const config = useMemo(() => createWalletConfig(selectedNetwork.id), [selectedNetwork.id]);
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
