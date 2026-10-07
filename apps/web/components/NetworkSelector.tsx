"use client";

import { useWallet } from "./providers/WalletProvider";
import { SUPPORTED_NETWORKS } from "../lib/networks";

export function NetworkSelector() {
  const { selectedNetwork, selectNetwork, networkSwitching } = useWallet();
  const selectedNetworkId = selectedNetwork.id;

  return (
    <select
      aria-label="XRPL network"
      className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      value={selectedNetworkId}
      disabled={networkSwitching}
      onChange={(event) => {
        const nextNetwork = SUPPORTED_NETWORKS.find((network) => network.id === event.target.value);
        if (nextNetwork) void selectNetwork(nextNetwork.id);
      }}
    >
      {SUPPORTED_NETWORKS.map((network) => (
        <option key={network.id} value={network.id}>
          {network.name}
        </option>
      ))}
    </select>
  );
}
