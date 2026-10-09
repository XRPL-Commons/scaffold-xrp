<script setup lang="ts">
import { useWallet as useBindingWallet } from '@xrpl-commons/xrpl-connect-vue'

const { statusMessage } = useWallet()
const { error: walletError } = useBindingWallet()

const statusTone = computed(() => {
  if (statusMessage.value?.type === 'error' || walletError.value) {
    return 'text-destructive'
  }
  if (statusMessage.value?.type === 'warning') {
    return 'text-amber-700'
  }
  return 'text-muted-foreground'
})
</script>

<template>
  <header class="w-full">
    <div
      class="mx-auto flex min-h-24 w-full max-w-6xl flex-wrap items-center gap-4 px-4 py-5 sm:px-6"
    >
      <NuxtLink to="/" class="flex items-center gap-3" aria-label="Scaffold-XRP home">
        <span
          aria-hidden="true"
          class="flex h-10 w-10 items-center justify-center rounded-lg bg-foreground text-background"
        >
          <img
            src="/xrpl-logo.png"
            alt=""
            width="28"
            height="24"
            class="object-contain brightness-0 invert"
          >
        </span>
        <span class="text-lg font-semibold tracking-tight">Scaffold-XRP</span>
      </NuxtLink>

      <div class="ml-auto flex max-w-full flex-wrap items-center justify-end gap-3">
        <NetworkSelector />
        <WalletConnector />
      </div>
    </div>

    <div
      v-if="statusMessage || walletError"
      class="mx-auto w-full max-w-6xl px-4 pb-1 text-right text-sm sm:px-6"
      :class="statusTone"
      aria-live="polite"
      :role="statusMessage?.type === 'error' || walletError ? 'alert' : 'status'"
    >
      {{ statusMessage?.message || walletError?.message }}
    </div>
  </header>
</template>
