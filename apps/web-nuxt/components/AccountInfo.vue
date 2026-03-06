<script setup lang="ts">
const { isConnected, accountInfo } = useWallet()
</script>

<template>
  <div v-if="isConnected && accountInfo" class="rounded-lg border bg-card text-card-foreground shadow-sm">
    <div class="flex flex-col space-y-1.5 p-6 pb-3">
      <h3 class="text-base font-semibold leading-none tracking-tight">Account</h3>
      <p class="text-sm text-muted-foreground">Your connected wallet details</p>
    </div>
    <div class="p-6 pt-0 space-y-3">
      <div class="flex items-center justify-between rounded-md border p-3">
        <span class="text-sm text-muted-foreground">Address</span>
        <code class="text-xs font-mono">{{ accountInfo.address }}</code>
      </div>
      <div class="flex items-center justify-between rounded-md border p-3">
        <span class="text-sm text-muted-foreground">Network</span>
        <span class="text-sm">{{ accountInfo.network }}</span>
      </div>
      <div class="flex items-center justify-between rounded-md border p-3">
        <span class="text-sm text-muted-foreground">Wallet</span>
        <span class="text-sm">{{ accountInfo.walletName }}</span>
      </div>
      <p class="text-xs text-muted-foreground">
        Click your address in the header to disconnect
      </p>
    </div>
  </div>
</template>
