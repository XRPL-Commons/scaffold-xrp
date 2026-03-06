<script setup lang="ts">
const { walletManager, isConnected, addEvent, showStatus } = useWallet()

const destination = ref('')
const amount = ref('')
const result = ref<{
  success: boolean
  hash?: string
  id?: string
  error?: string
} | null>(null)
const isLoading = ref(false)

const handleSubmit = async () => {
  if (!walletManager.value || !walletManager.value.account) {
    showStatus('Please connect a wallet first', 'error')
    return
  }

  try {
    isLoading.value = true
    result.value = null

    const transaction = {
      TransactionType: 'Payment',
      Account: walletManager.value.account.address,
      Destination: destination.value,
      Amount: amount.value,
    }

    const txResult = await walletManager.value.signAndSubmit(transaction as any)

    result.value = {
      success: true,
      hash: txResult.hash || 'Pending',
      id: txResult.id,
    }

    showStatus('Transaction submitted successfully!', 'success')
    addEvent('Transaction Submitted', txResult)

    destination.value = ''
    amount.value = ''
  } catch (error: any) {
    result.value = {
      success: false,
      error: error.message,
    }
    showStatus(`Transaction failed: ${error.message}`, 'error')
    addEvent('Transaction Failed', error)
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div v-if="isConnected" class="rounded-lg border bg-card text-card-foreground shadow-sm">
    <div class="flex flex-col space-y-1.5 p-6 pb-3">
      <h3 class="text-base font-semibold leading-none tracking-tight">Send XRP</h3>
      <p class="text-sm text-muted-foreground">Transfer XRP to another address</p>
    </div>

    <div class="p-6 pt-0">
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div class="space-y-2">
          <label for="destination" class="text-sm font-medium leading-none">
            Destination Address
          </label>
          <input
            id="destination"
            v-model="destination"
            type="text"
            placeholder="rN7n7otQDd6FczFgLdlqtyMVrn3HMfXoQT"
            class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            required
          />
        </div>

        <div class="space-y-2">
          <label for="amount" class="text-sm font-medium leading-none">
            Amount (drops)
          </label>
          <input
            id="amount"
            v-model="amount"
            type="number"
            placeholder="1000000"
            min="1"
            class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            required
          />
          <p class="text-xs text-muted-foreground">1 XRP = 1,000,000 drops</p>
        </div>

        <button
          type="submit"
          :disabled="isLoading"
          class="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
        >
          {{ isLoading ? 'Signing & Submitting...' : 'Sign & Submit' }}
        </button>
      </form>

      <div
        v-if="result"
        :class="[
          'mt-4 rounded-lg border p-4',
          result.success
            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
            : 'border-destructive/50 bg-destructive/10 text-destructive'
        ]"
      >
        <template v-if="result.success">
          <h4 class="mb-1 font-medium">Transaction Submitted</h4>
          <p class="font-mono text-xs break-all">Hash: {{ result.hash }}</p>
          <p v-if="result.id" class="text-xs mt-1">ID: {{ result.id }}</p>
          <p class="text-xs mt-1">Transaction has been signed and submitted to the ledger</p>
        </template>
        <template v-else>
          <h4 class="mb-1 font-medium">Transaction Failed</h4>
          <p class="text-sm">{{ result.error }}</p>
        </template>
      </div>
    </div>
  </div>
</template>
