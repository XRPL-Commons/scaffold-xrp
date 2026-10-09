<script setup lang="ts">
import { useWallet as useBindingWallet } from '@xrpl-commons/xrpl-connect-vue'

const { connected, account, network, manager } = useBindingWallet()
const { selectedNetwork } = useNetworkSelection()
</script>

<template>
  <section class="min-w-0 rounded-xl border bg-card p-6 text-card-foreground shadow-sm md:p-8">
    <div class="space-y-1">
      <h2 class="text-xl font-semibold tracking-tight">Account</h2>
      <p class="text-sm text-muted-foreground">
        {{ connected ? 'Your connected wallet.' : 'Your connected wallet will appear here.' }}
      </p>
    </div>

    <div class="mt-6">
      <template v-if="connected && account">
        <dl class="divide-y text-sm">
          <div class="space-y-2 pb-5">
            <dt class="text-muted-foreground">Address</dt>
            <dd class="break-all font-mono text-xs leading-relaxed">{{ account.address }}</dd>
          </div>
          <div class="flex items-center justify-between gap-3 py-4">
            <dt class="text-muted-foreground">Network</dt>
            <dd>{{ network?.name || account.network.name }}</dd>
          </div>
          <div class="flex items-center justify-between gap-3 pt-4">
            <dt class="text-muted-foreground">Wallet</dt>
            <dd>{{ manager.wallet?.name || 'Wallet' }}</dd>
          </div>
        </dl>
        <div
          v-if="account.network.id !== selectedNetwork.id"
          role="alert"
          class="mt-5 rounded-lg bg-amber-50 p-3 text-sm text-amber-900"
        >
          Switch the wallet to {{ selectedNetwork.name }} before sending a payment.
        </div>
      </template>

      <div
        v-else
        class="flex min-h-40 items-center gap-5 rounded-xl bg-muted/60 p-6 md:p-8"
      >
        <svg
          aria-hidden="true"
          class="h-9 w-9 shrink-0 text-muted-foreground"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 7.5h16.5v10.125A2.625 2.625 0 0 1 17.625 20.25H6.375a2.625 2.625 0 0 1-2.625-2.625V7.5Z" />
          <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 7.5V5.625A1.875 1.875 0 0 1 5.625 3.75h10.5A1.875 1.875 0 0 1 18 5.625V7.5M15.75 13.5h.008v.008h-.008V13.5Z" />
        </svg>
        <div>
          <p class="font-medium">Not connected</p>
          <p class="mt-1 text-sm leading-relaxed text-muted-foreground">
            Connect your wallet above to get started.
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
