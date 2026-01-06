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

export function useWallet() {
  // Global state using useState (persists across components)
  const walletManager = useState<WalletManager | null>('walletManager', () => null)
  const isConnected = useState<boolean>('isConnected', () => false)
  const accountInfo = useState<AccountInfo | null>('accountInfo', () => null)
  const events = useState<WalletEvent[]>('events', () => [])
  const statusMessage = useState<StatusMessage | null>('statusMessage', () => null)

  function setWalletManager(manager: WalletManager | null) {
    walletManager.value = manager
  }

  function setIsConnected(connected: boolean) {
    isConnected.value = connected
  }

  function setAccountInfo(info: AccountInfo | null) {
    accountInfo.value = info
  }

  function addEvent(name: string, data: unknown) {
    const timestamp = new Date().toLocaleTimeString()
    events.value = [{ timestamp, name, data }, ...events.value]
  }

  function clearEvents() {
    events.value = []
  }

  function showStatus(message: string, type: StatusMessage['type']) {
    statusMessage.value = { message, type }
    setTimeout(() => {
      statusMessage.value = null
    }, 5000)
  }

  return {
    walletManager,
    isConnected,
    accountInfo,
    events,
    statusMessage,
    setWalletManager,
    setIsConnected,
    setAccountInfo,
    addEvent,
    clearEvents,
    showStatus,
  }
}
