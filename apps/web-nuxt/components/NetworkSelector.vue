<script setup lang="ts">
import {
  SUPPORTED_NETWORKS,
  NETWORK_STORAGE_KEY,
  type NetworkId,
} from '~/lib/networks'
import { useWallet as useBindingWallet } from '@xrpl-commons/xrpl-connect-vue'

const { selectedNetwork, selectedNetworkId, setSelectedNetworkId } = useNetworkSelection()
const { manager } = useBindingWallet()
const { showStatus } = useWallet()
const isSwitching = ref(false)

async function handleNetworkChange(event: Event) {
  const nextNetworkId = (event.target as HTMLSelectElement).value as NetworkId
  if (nextNetworkId === selectedNetworkId.value || isSwitching.value) return

  isSwitching.value = true
  const previousNetworkId = selectedNetworkId.value
  let shouldReload = false
  try {
    // v1 has no generic setNetwork method. Disconnect first, persist the
    // selection, and reload so the client plugin creates a manager with the
    // selected network as its authoritative default.
    await manager.disconnect()
    if (import.meta.client) {
      window.localStorage.setItem(NETWORK_STORAGE_KEY, nextNetworkId)
      setSelectedNetworkId(nextNetworkId)
      shouldReload = true
      window.location.reload()
    } else {
      setSelectedNetworkId(nextNetworkId)
    }
  } catch (error) {
    setSelectedNetworkId(previousNetworkId)
    const message = error instanceof Error ? error.message : String(error)
    showStatus(`Could not switch network: ${message}`, 'error')
  } finally {
    if (!shouldReload) isSwitching.value = false
  }
}
</script>

<template>
  <label class="flex items-center gap-2 text-xs text-muted-foreground">
    <span>Network</span>
    <select
      aria-label="XRPL network"
      class="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
      :value="selectedNetwork.id"
      :disabled="isSwitching"
      @change="handleNetworkChange"
    >
      <option v-for="network in SUPPORTED_NETWORKS" :key="network.id" :value="network.id">
        {{ network.name }}
      </option>
    </select>
  </label>
</template>
