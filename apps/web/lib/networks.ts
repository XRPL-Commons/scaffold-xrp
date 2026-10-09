export const NETWORKS = {
  TESTNET: {
    id: "testnet",
    name: "Testnet",
    wss: "wss://s.altnet.rippletest.net:51233/",
    rpc: "https://testnet.xrpl-labs.com",
    faucet: "https://faucet.altnet.rippletest.net/accounts",
    explorer: "https://testnet.xrpl.org",
    walletConnectId: "xrpl:1",
  },
  DEVNET: {
    id: "devnet",
    name: "Devnet",
    wss: "wss://s.devnet.rippletest.net:51233/",
    rpc: "https://s.devnet.rippletest.net:51234/",
    faucet: "https://faucet.devnet.rippletest.net/accounts",
    explorer: "https://devnet.xrpl.org",
    walletConnectId: "xrpl:2",
  },
} as const;

export type Network = (typeof NETWORKS)[keyof typeof NETWORKS];
export type NetworkId = Network["id"];

export const DEFAULT_NETWORK =
  Object.values(NETWORKS).find(
    (network) => network.id === process.env.NEXT_PUBLIC_DEFAULT_NETWORK
  ) ?? NETWORKS.TESTNET;

export const SUPPORTED_NETWORKS = Object.values(NETWORKS);

export function getNetworkById(networkId: string | undefined): Network | null {
  return SUPPORTED_NETWORKS.find((network) => network.id === networkId) ?? null;
}
