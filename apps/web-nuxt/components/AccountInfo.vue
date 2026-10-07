<script setup lang="ts">
import {
  useWallet as useBindingWallet,
  useWalletModal,
} from '@xrpl-commons/xrpl-connect-vue'

const { connected, account, network, manager, connecting } = useBindingWallet()
const { ready, open } = useWalletModal()
const { selectedNetwork } = useNetworkSelection()
const { showStatus } = useWallet()

async function openWallet() {
  try {
    await open()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    showStatus(`Could not open wallet selection: ${message}`, 'error')
  }
}
</script>

<template>
  <section class="rounded-lg border bg-card text-card-foreground shadow-sm">
    <div class="flex flex-col space-y-1.5 p-6 pb-3">
      <h2 class="text-base font-semibold leading-none tracking-tight">Account</h2>
      <p class="text-sm text-muted-foreground">
        {{ connected ? 'Your connected wallet details' : 'Connect a wallet to view account details' }}
      </p>
    </div>

    <div class="space-y-3 p-6 pt-0">
      <template v-if="connected && account">
        <div class="flex items-center justify-between gap-3 rounded-md border p-3">
          <span class="text-sm text-muted-foreground">Address</span>
          <code class="break-all text-right text-xs font-mono">{{ account.address }}</code>
        </div>
        <div class="flex items-center justify-between rounded-md border p-3">
          <span class="text-sm text-muted-foreground">Network</span>
          <span class="text-sm">{{ network?.name || account.network.name }}</span>
        </div>
        <div class="flex items-center justify-between rounded-md border p-3">
          <span class="text-sm text-muted-foreground">Wallet</span>
          <span class="text-sm">{{ manager.wallet?.name || 'Wallet' }}</span>
        </div>
        <div
          v-if="account.network.id !== selectedNetwork.id"
          class="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
        >
          Switch the wallet to {{ selectedNetwork.name }} before sending a payment.
        </div>
        <p class="text-xs text-muted-foreground">
          Use the wallet button above to view account actions or disconnect.
        </p>
      </template>

      <div v-else class="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3">
        <p class="text-sm text-muted-foreground">
          Your wallet address and network will appear here after connecting on {{ selectedNetwork.name }}.
        </p>
        <button
          type="button"
          class="inline-flex h-9 shrink-0 items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
          :disabled="!ready || connecting"
          @click="openWallet"
        >
          {{ connecting ? 'Connecting…' : 'Connect wallet' }}
        </button>
      </div>
    </div>
  </section>
</template>
