<script setup lang="ts">
const { isConnected, accountInfo } = useWallet()
</script>

<template>
  <div v-if="isConnected && accountInfo" class="card">
    <h2 class="text-xl font-bold mb-4">Account Info</h2>
    <div class="space-y-3">
      <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
        <span class="text-sm font-medium text-gray-600">Address:</span>
        <span class="text-sm font-mono text-gray-900">{{ accountInfo.address }}</span>
      </div>
      <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
        <span class="text-sm font-medium text-gray-600">Network:</span>
        <span class="text-sm text-gray-900">{{ accountInfo.network }}</span>
      </div>
      <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
        <span class="text-sm font-medium text-gray-600">Wallet:</span>
        <span class="text-sm text-gray-900">{{ accountInfo.walletName }}</span>
      </div>
    </div>
    <p class="mt-3 text-xs text-gray-500">
      Click the button showing your address to disconnect
    </p>
  </div>
</template>
