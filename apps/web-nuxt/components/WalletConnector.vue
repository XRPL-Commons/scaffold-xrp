<script setup lang="ts">
import {
  WalletConnector as XrplWalletConnector,
  useWallet as useBindingWallet,
} from '@xrpl-commons/xrpl-connect-vue'

const { showStatus } = useWallet()
const { connected } = useBindingWallet()
const runtimeConfig = useRuntimeConfig()

const walletConfiguration = computed(() => {
  const publicConfig = runtimeConfig.public
  const missing: string[] = []
  if (!String(publicConfig.xamanApiKey || '').trim()) {
    missing.push('NUXT_PUBLIC_XAMAN_API_KEY for Xaman')
  }
  if (!String(publicConfig.walletConnectProjectId || '').trim()) {
    missing.push('NUXT_PUBLIC_WALLETCONNECT_PROJECT_ID for WalletConnect')
  }
  return missing
})

function handleConnecting(walletId: string) {
  showStatus(`Connecting to ${walletId}…`, 'info')
}

function handleConnected() {
  showStatus('Wallet connected', 'success')
}

function handleError(error: { message?: string }) {
  showStatus(error.message || 'Wallet connection failed', 'error')
}
</script>

<template>
  <div class="flex flex-col items-end gap-1">
    <XrplWalletConnector
      id="wallet-connector"
      aria-label="Choose an XRPL wallet"
      primary-wallet="xaman"
      :wallets="['xaman', 'gemwallet', 'walletconnect']"
      show-unavailable
      theme="light"
      :css-vars="{
        '--xc-font-family': 'inherit',
        '--xc-border-radius': '0.5rem',
        '--xc-connect-button-border-radius': '0.375rem',
      }"
      @connecting="handleConnecting"
      @connect="handleConnected"
      @error="handleError"
    />
    <details
      v-if="!connected && walletConfiguration.length"
      class="max-w-[18rem] text-right text-[0.65rem] leading-tight text-muted-foreground"
    >
      <summary class="cursor-pointer list-none hover:text-foreground">Hosted wallet setup</summary>
      <p class="mt-1">
        Add {{ walletConfiguration.join(' and ') }} to enable those hosted wallet flows. GemWallet
        works through its browser extension.
      </p>
    </details>
  </div>
</template>
