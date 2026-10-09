import {
  DEFAULT_NETWORK,
  getInitialNetworkId,
  getNetworkById,
  type NetworkId,
} from '~/lib/networks'

export function useNetworkSelection() {
  const runtimeConfig = useRuntimeConfig()
  const selectedNetworkId = useState<NetworkId>('xrpl-selected-network', () =>
    getInitialNetworkId(runtimeConfig.public.defaultNetwork),
  )
  const selectedNetwork = computed(
    () => getNetworkById(selectedNetworkId.value) ?? DEFAULT_NETWORK,
  )

  function setSelectedNetworkId(networkId: NetworkId) {
    selectedNetworkId.value = networkId
  }

  return {
    selectedNetworkId,
    selectedNetwork,
    setSelectedNetworkId,
  }
}
