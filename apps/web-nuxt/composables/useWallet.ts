import { useWallet as useBindingWallet } from '@xrpl-commons/xrpl-connect-vue'
import type { WalletManager } from 'xrpl-connect'

interface AccountInfo {
  address: string
  network: string
  walletName: string
}

interface WalletEvent {
  timestamp: string
  name: string
  data: unknown
}

interface StatusMessage {
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
}

/**
 * Compatibility bridge for optional Contract/Vault/Escrow components.
 * Wallet state and signing remain owned by xrpl-connect-vue; this composable
 * derives the old component shape and app status/event helpers.
 */
export function useWallet() {
  const binding = useBindingWallet()
  const { selectedNetwork } = useNetworkSelection()
  const events = useState<WalletEvent[]>('xrpl-wallet-events', () => [])
  const statusMessage = useState<StatusMessage | null>('xrpl-wallet-status', () => null)

  const walletManager = computed<WalletManager>(() => binding.manager)
  const isConnected = computed(() => binding.connected.value)
  const accountInfo = computed<AccountInfo | null>(() => {
    const account = binding.account.value
    if (!account) return null

    return {
      address: account.address,
      network: `${account.network.name} (${account.network.id})`,
      walletName: binding.manager.wallet?.name || 'Wallet',
    }
  })

  function addEvent(name: string, data: unknown) {
    const timestamp = new Date().toLocaleTimeString()
    events.value = [{ timestamp, name, data }, ...events.value]
  }

  function clearEvents() {
    events.value = []
  }

  function showStatus(message: string, type: StatusMessage['type'] = 'info') {
    statusMessage.value = { message, type }
    if (import.meta.client) {
      window.setTimeout(() => {
        if (statusMessage.value?.message === message) statusMessage.value = null
      }, 5000)
    }
  }

  return {
    walletManager,
    isConnected,
    accountInfo,
    account: binding.account,
    network: binding.network,
    connecting: binding.connecting,
    error: binding.error,
    selectedNetwork,
    events,
    statusMessage,
    addEvent,
    clearEvents,
    showStatus,
  }
}
