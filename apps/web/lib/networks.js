export const NETWORKS = {
  ALPHANET: {
    id: "alphanet",
    name: "AlphaNet",
    networkId: 21465,
    wss: "wss://alphanet.nerdnest.xyz",
    faucet: "https://alphanet.faucet.nerdnest.xyz/accounts",
    explorer: "https://alphanet.xrpl.org",
  },
  TESTNET: {
    id: "testnet",
    name: "Testnet",
    networkId: 1,
    wss: "wss://s.altnet.rippletest.net:51233",
    faucet: "https://faucet.altnet.rippletest.net/accounts",
    explorer: "https://testnet.xrpl.org",
  },
  DEVNET: {
    id: "devnet",
    name: "Devnet",
    networkId: 2,
    wss: "wss://s.devnet.rippletest.net:51233",
    faucet: "https://faucet.devnet.rippletest.net/accounts",
    explorer: "https://devnet.xrpl.org",
  },
};

export const DEFAULT_NETWORK = NETWORKS.ALPHANET;
