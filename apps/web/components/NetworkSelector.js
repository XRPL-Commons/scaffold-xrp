"use client";

import { useWallet } from "./providers/WalletProvider";
import { SUPPORTED_NETWORKS } from "../lib/networks";

export function NetworkSelector() {
  const { selectedNetwork, selectNetwork, networkSwitching } = useWallet();
  const selectedNetworkId = selectedNetwork.id;

  return (
    <label className="flex items-center gap-2 text-xs text-muted-foreground">
      <span>Network</span>
      <select
        aria-label="XRPL network"
        className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        value={selectedNetworkId}
        disabled={networkSwitching}
        onChange={(event) => void selectNetwork(event.target.value)}
      >
        {SUPPORTED_NETWORKS.map((network) => (
          <option key={network.id} value={network.id}>
            {network.name}
          </option>
        ))}
      </select>
    </label>
  );
}
