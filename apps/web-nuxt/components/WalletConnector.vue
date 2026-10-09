<script setup lang="ts">
import { WalletConnector as XrplWalletConnector } from '@xrpl-commons/xrpl-connect-vue'

const { showStatus } = useWallet()

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
  </div>
</template>
