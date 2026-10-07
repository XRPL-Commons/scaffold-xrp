<script setup lang="ts">
import { useWallet as useBindingWallet } from '@xrpl-commons/xrpl-connect-vue'

const { statusMessage } = useWallet()
const { error: walletError } = useBindingWallet()

const statusVariant = computed(() => {
  if (!statusMessage.value) return ''
  const type = statusMessage.value.type
  if (type === 'success') return 'bg-emerald-100 text-emerald-800'
  if (type === 'error') return 'bg-destructive/10 text-destructive'
  if (type === 'warning') return 'bg-amber-100 text-amber-800'
  return 'bg-secondary text-secondary-foreground'
})
</script>

<template>
  <header class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
    <div class="container flex min-h-14 flex-wrap items-center gap-3 py-2">
      <div class="flex items-center gap-2">
        <div class="flex h-8 w-8 items-center justify-center rounded-md bg-foreground text-background">
          <span class="font-semibold text-sm">X</span>
        </div>
        <span class="font-semibold">Scaffold-XRP</span>
      </div>

      <div class="ml-auto flex flex-wrap items-center justify-end gap-3">
        <NetworkSelector />
        <span
          v-if="statusMessage"
          :class="['inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold', statusVariant]"
        >
          {{ statusMessage.message }}
        </span>
        <span
          v-else-if="walletError"
          class="inline-flex max-w-[18rem] items-center rounded-md border border-destructive/30 bg-destructive/10 px-2.5 py-1 text-xs text-destructive"
        >
          {{ walletError.message }}
        </span>
        <WalletConnector />
      </div>
    </div>
  </header>
</template>
