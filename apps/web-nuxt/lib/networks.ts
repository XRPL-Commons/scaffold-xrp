export type NetworkId = 'testnet' | 'devnet'

export interface StarterNetwork {
  id: NetworkId
  name: string
  wss: string
  rpc: string
  faucet: string
  explorer: string
  walletConnectId: string
}

export const NETWORKS: Record<NetworkId, StarterNetwork> = {
  testnet: {
    id: 'testnet',
    name: 'Testnet',
    wss: 'wss://s.altnet.rippletest.net:51233/',
    rpc: 'https://testnet.xrpl-labs.com',
    faucet: 'https://faucet.altnet.rippletest.net/accounts',
    explorer: 'https://testnet.xrpl.org',
    walletConnectId: 'xrpl:1',
  },
  devnet: {
    id: 'devnet',
    name: 'Devnet',
    wss: 'wss://s.devnet.rippletest.net:51233/',
    rpc: 'https://s.devnet.rippletest.net:51234/',
    faucet: 'https://faucet.devnet.rippletest.net/accounts',
    explorer: 'https://devnet.xrpl.org',
    walletConnectId: 'xrpl:2',
  },
}

export const DEFAULT_NETWORK = NETWORKS.testnet
export const SUPPORTED_NETWORKS = Object.values(NETWORKS)
export const NETWORK_STORAGE_KEY = 'scaffold-xrp-network'

export function getNetworkById(networkId: unknown): StarterNetwork | null {
  if (typeof networkId !== 'string') return null
  return SUPPORTED_NETWORKS.find((network) => network.id === networkId) ?? null
}

export function getInitialNetworkId(fallback: unknown): NetworkId {
  const fallbackNetwork = getNetworkById(fallback)?.id ?? DEFAULT_NETWORK.id

  if (typeof window === 'undefined') return fallbackNetwork

  try {
    return getNetworkById(window.localStorage.getItem(NETWORK_STORAGE_KEY))?.id ?? fallbackNetwork
  } catch {
    return fallbackNetwork
  }
}
