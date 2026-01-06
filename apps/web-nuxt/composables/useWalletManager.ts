// Configuration - Replace with your API keys
const XAMAN_API_KEY = import.meta.env.VITE_XAMAN_API_KEY || ''
const WALLETCONNECT_PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || ''

export function useWalletManager() {
  const {
    walletManager,
    setWalletManager,
    setIsConnected,
    setAccountInfo,
    addEvent,
    showStatus,
  } = useWallet()

  const updateConnectionState = (manager: any) => {
    const connected = manager.connected
    setIsConnected(connected)

    if (connected) {
      const account = manager.account
      const wallet = manager.wallet

      if (account && wallet) {
        setAccountInfo({
          address: account.address,
          network: `${account.network.name} (${account.network.id})`,
          walletName: wallet.name,
        })
      }
    } else {
      setAccountInfo(null)
    }
  }

  const initWalletManager = async () => {
    // Only run on client side
    if (import.meta.server) return

    try {
      const {
        WalletManager,
        XamanAdapter,
        WalletConnectAdapter,
        CrossmarkAdapter,
        GemWalletAdapter,
      } = await import('xrpl-connect')

      const adapters: any[] = []

      // Only add Xaman if API key is available
      if (XAMAN_API_KEY) {
        adapters.push(new XamanAdapter({ apiKey: XAMAN_API_KEY }))
      }

      // Only add WalletConnect if project ID is available
      if (WALLETCONNECT_PROJECT_ID) {
        adapters.push(new WalletConnectAdapter({ projectId: WALLETCONNECT_PROJECT_ID }))
      }

      // Add browser extension wallets (no config needed)
      adapters.push(new CrossmarkAdapter())
      adapters.push(new GemWalletAdapter())

      const manager = new WalletManager({
        adapters,
        network: 'testnet',
        autoConnect: true,
        logger: { level: 'info' },
      })

      setWalletManager(manager)

      // Event listeners
      manager.on('connect', (account: any) => {
        addEvent('Connected', account)
        updateConnectionState(manager)
      })

      manager.on('disconnect', () => {
        addEvent('Disconnected', null)
        updateConnectionState(manager)
      })

      manager.on('error', (error: any) => {
        addEvent('Error', error)
        showStatus(error.message, 'error')
      })

      // Check initial connection status
      if (!manager.connected) {
        showStatus('Please connect a wallet to get started', 'info')
      } else {
        showStatus('Wallet reconnected from previous session', 'success')
        updateConnectionState(manager)
      }

      console.log('XRPL Connect initialized', manager)
    } catch (error) {
      console.error('Failed to initialize wallet manager:', error)
      showStatus('Failed to initialize wallet connection', 'error')
    }
  }

  // Initialize on mount (client-side only)
  onMounted(() => {
    initWalletManager()
  })

  return { walletManager }
}
