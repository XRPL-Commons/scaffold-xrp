<script setup lang="ts">
const { walletManager, isConnected, addEvent, showStatus } = useWallet()

const vaultId = ref('')
const amount = ref('')
const action = ref<'deposit' | 'withdraw'>('deposit')
const isSubmitting = ref(false)
const result = ref<{
  success: boolean
  hash?: string
  id?: string
  error?: string
} | null>(null)

const handleSubmit = async () => {
  if (!walletManager.value || !walletManager.value.account) {
    showStatus('Please connect a wallet first', 'error')
    return
  }

  if (!vaultId.value || !amount.value) {
    showStatus('Please provide vault ID and amount', 'error')
    return
  }

  const parsedAmount = Number(amount.value)
  if (!Number.isInteger(parsedAmount) || parsedAmount <= 0) {
    showStatus('Amount must be a positive integer (drops)', 'error')
    return
  }

  try {
    isSubmitting.value = true
    result.value = null

    const transaction: Record<string, unknown> = {
      TransactionType: action.value === 'deposit' ? 'VaultDeposit' : 'VaultWithdraw',
      Account: walletManager.value.account.address,
      VaultID: vaultId.value,
      Amount: String(parsedAmount),
      ComputationAllowance: 1000000,
      Fee: '1000000',
    }

    const txResult = await walletManager.value.signAndSubmit(transaction as any)

    result.value = {
      success: true,
      hash: txResult.hash || 'Pending',
      id: txResult.id,
    }

    showStatus(`Vault ${action.value} successful!`, 'success')
    addEvent(`Vault ${action.value}`, txResult)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    result.value = {
      success: false,
      error: message,
    }
    showStatus(`Vault ${action.value} failed: ${message}`, 'error')
    addEvent(`Vault ${action.value} Failed`, error)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="rounded-lg border bg-card text-card-foreground shadow-sm">
    <div class="p-6 pb-3">
      <h3 class="text-base font-semibold leading-none tracking-tight">Vault Interaction</h3>
      <p class="text-sm text-muted-foreground">Deposit and withdraw from smart vaults</p>
    </div>

    <div class="p-6 pt-0 space-y-4">
      <div class="space-y-2">
        <label for="vaultId" class="text-sm font-medium leading-none">Vault ID</label>
        <input
          id="vaultId"
          v-model="vaultId"
          type="text"
          placeholder="Vault ledger ID..."
          class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>

      <div class="space-y-2">
        <label class="text-sm font-medium leading-none">Action</label>
        <div class="flex gap-2">
          <button
            @click="action = 'deposit'"
            :class="[
              'inline-flex items-center justify-center rounded-md text-sm font-medium h-8 px-3',
              action === 'deposit'
                ? 'bg-primary text-primary-foreground shadow hover:bg-primary/90'
                : 'border border-input bg-background hover:bg-accent hover:text-accent-foreground'
            ]"
          >
            Deposit
          </button>
          <button
            @click="action = 'withdraw'"
            :class="[
              'inline-flex items-center justify-center rounded-md text-sm font-medium h-8 px-3',
              action === 'withdraw'
                ? 'bg-primary text-primary-foreground shadow hover:bg-primary/90'
                : 'border border-input bg-background hover:bg-accent hover:text-accent-foreground'
            ]"
          >
            Withdraw
          </button>
        </div>
      </div>

      <div class="space-y-2">
        <label for="vaultAmount" class="text-sm font-medium leading-none">Amount (drops)</label>
        <input
          id="vaultAmount"
          v-model="amount"
          type="text"
          placeholder="e.g., 1000000"
          class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>

      <div class="rounded-md border p-3 text-sm">
        <p class="font-medium mb-2">Smart Vault Entry Points</p>
        <ul class="text-muted-foreground space-y-1 text-xs">
          <li>on_deposit() - Called when assets are deposited</li>
          <li>on_withdraw() - Called when assets are withdrawn</li>
        </ul>
      </div>

      <button
        v-if="isConnected"
        @click="handleSubmit"
        :disabled="isSubmitting"
        class="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
      >
        {{ isSubmitting ? 'Submitting...' : (action === 'deposit' ? 'Deposit' : 'Withdraw') }}
      </button>

      <div
        v-if="!isConnected"
        class="rounded-lg border p-4"
      >
        <p class="text-sm text-muted-foreground">Connect your wallet to interact with vaults</p>
      </div>

      <div
        v-if="result"
        :class="[
          'rounded-lg border p-4',
          result.success
            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
            : 'border-destructive/50 bg-destructive/10 text-destructive'
        ]"
      >
        <template v-if="result.success">
          <h4 class="mb-1 font-medium">Transaction Sent</h4>
          <p class="font-mono text-xs break-all">Hash: {{ result.hash }}</p>
          <p v-if="result.id" class="text-xs mt-1">ID: {{ result.id }}</p>
        </template>
        <template v-else>
          <h4 class="mb-1 font-medium">Transaction Failed</h4>
          <p class="text-sm">{{ result.error }}</p>
        </template>
      </div>
    </div>
  </div>
</template>
