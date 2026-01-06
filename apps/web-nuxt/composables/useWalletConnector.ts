import type { Ref } from 'vue'
import type { WalletManager } from 'xrpl-connect'

export function useWalletConnector(walletManager: Ref<WalletManager | null>) {
  const walletConnectorRef = ref<HTMLElement | null>(null)
  const { addEvent, showStatus } = useWallet()

  const setupConnector = async () => {
    if (!walletConnectorRef.value || !walletManager.value) return

    // Wait for custom element to be defined and upgraded
    await customElements.whenDefined('xrpl-wallet-connector')

    // Small delay to ensure the element is fully initialized
    await new Promise((resolve) => setTimeout(resolve, 0))

    const element = walletConnectorRef.value as any
    if (element && typeof element.setWalletManager === 'function') {
      element.setWalletManager(walletManager.value)

      // Listen to connector events
      const handleConnecting = (e: CustomEvent) => {
        showStatus(`Connecting to ${e.detail.walletId}...`, 'info')
      }

      const handleConnected = (e: CustomEvent) => {
        showStatus('Connected successfully!', 'success')
        addEvent('Connected via Web Component', e.detail)
      }

      const handleError = (e: CustomEvent) => {
        showStatus(`Connection failed: ${e.detail.error.message}`, 'error')
        addEvent('Connection Error', e.detail)
      }

      element.addEventListener('connecting', handleConnecting)
      element.addEventListener('connected', handleConnected)
      element.addEventListener('error', handleError)

      // Return cleanup function
      return () => {
        if (element) {
          element.removeEventListener('connecting', handleConnecting)
          element.removeEventListener('connected', handleConnected)
          element.removeEventListener('error', handleError)
        }
      }
    }
  }

  // Watch for walletManager changes
  watch(
    [walletConnectorRef, walletManager],
    () => {
      setupConnector()
    },
    { immediate: true }
  )

  return walletConnectorRef
}
