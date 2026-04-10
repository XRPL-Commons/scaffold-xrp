<script setup lang="ts">
const RIPPLE_EPOCH_OFFSET = 946684800

const { walletManager, isConnected, addEvent, showStatus } = useWallet()

const action = ref<'create' | 'finish' | 'cancel'>('finish')
const owner = ref('')
const escrowId = ref('')
const destination = ref('')
const amount = ref('')
const finishAfter = ref('')
const cancelAfter = ref('')
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

  try {
    isSubmitting.value = true
    result.value = null

    let transaction: Record<string, unknown>

    if (action.value === 'create') {
      if (!destination.value || !amount.value) {
        showStatus('Please provide destination and amount', 'error')
        isSubmitting.value = false
        return
      }
      const parsedAmount = Number(amount.value)
      if (!Number.isInteger(parsedAmount) || parsedAmount <= 0) {
        showStatus('Amount must be a positive integer (drops)', 'error')
        isSubmitting.value = false
        return
      }
      if (!finishAfter.value && !cancelAfter.value) {
        showStatus('Please provide at least one of Finish After or Cancel After', 'error')
        isSubmitting.value = false
        return
      }
      if (finishAfter.value && cancelAfter.value && parseInt(cancelAfter.value, 10) <= parseInt(finishAfter.value, 10)) {
        showStatus('Cancel After must be greater than Finish After', 'error')
        isSubmitting.value = false
        return
      }
      const nowRipple = Math.floor(Date.now() / 1000) - RIPPLE_EPOCH_OFFSET
      transaction = {
        TransactionType: 'EscrowCreate',
        Account: walletManager.value.account.address,
        Destination: destination.value,
        Amount: String(parsedAmount),
      }
      if (finishAfter.value) {
        transaction.FinishAfter = nowRipple + parseInt(finishAfter.value, 10)
      }
      if (cancelAfter.value) {
        transaction.CancelAfter = nowRipple + parseInt(cancelAfter.value, 10)
      }
    } else if (action.value === 'finish') {
      if (!owner.value || !escrowId.value) {
        showStatus('Please provide owner and escrow ID', 'error')
        isSubmitting.value = false
        return
      }
      transaction = {
        TransactionType: 'EscrowFinish',
        Account: walletManager.value.account.address,
        Owner: owner.value,
        EscrowID: escrowId.value,
      }
    } else {
      if (!owner.value || !escrowId.value) {
        showStatus('Please provide owner and escrow ID', 'error')
        isSubmitting.value = false
        return
      }
      transaction = {
        TransactionType: 'EscrowCancel',
        Account: walletManager.value.account.address,
        Owner: owner.value,
        EscrowID: escrowId.value,
      }
    }

    const txResult = await walletManager.value.signAndSubmit(transaction as any)

    result.value = {
      success: true,
      hash: txResult.hash || 'Pending',
      id: txResult.id,
    }

    showStatus(`Escrow ${action.value} successful!`, 'success')
    addEvent(`Escrow ${action.value}`, txResult)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    result.value = {
      success: false,
      error: message,
    }
    showStatus(`Escrow ${action.value} failed: ${message}`, 'error')
    addEvent(`Escrow ${action.value} Failed`, error)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="rounded-lg border bg-card text-card-foreground shadow-sm">
    <div class="p-6 pb-3">
      <h3 class="text-base font-semibold leading-none tracking-tight">Escrow Interaction</h3>
      <p class="text-sm text-muted-foreground">Create and manage smart escrows</p>
    </div>

    <div class="p-6 pt-0 space-y-4">
      <div class="space-y-2">
        <label class="text-sm font-medium leading-none">Action</label>
        <div class="flex gap-2">
          <button
            @click="action = 'create'"
            :class="[
              'inline-flex items-center justify-center rounded-md text-sm font-medium h-8 px-3',
              action === 'create'
                ? 'bg-primary text-primary-foreground shadow hover:bg-primary/90'
                : 'border border-input bg-background hover:bg-accent hover:text-accent-foreground'
            ]"
          >
            Create
          </button>
          <button
            @click="action = 'finish'"
            :class="[
              'inline-flex items-center justify-center rounded-md text-sm font-medium h-8 px-3',
              action === 'finish'
                ? 'bg-primary text-primary-foreground shadow hover:bg-primary/90'
                : 'border border-input bg-background hover:bg-accent hover:text-accent-foreground'
            ]"
          >
            Finish
          </button>
          <button
            @click="action = 'cancel'"
            :class="[
              'inline-flex items-center justify-center rounded-md text-sm font-medium h-8 px-3',
              action === 'cancel'
                ? 'bg-primary text-primary-foreground shadow hover:bg-primary/90'
                : 'border border-input bg-background hover:bg-accent hover:text-accent-foreground'
            ]"
          >
            Cancel
          </button>
        </div>
      </div>

      <template v-if="action === 'create'">
        <div class="space-y-2">
          <label for="escrowDestination" class="text-sm font-medium leading-none">Destination</label>
          <input
            id="escrowDestination"
            v-model="destination"
            type="text"
            placeholder="rAddress..."
            class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <div class="space-y-2">
          <label for="escrowAmount" class="text-sm font-medium leading-none">Amount (drops)</label>
          <input
            id="escrowAmount"
            v-model="amount"
            type="text"
            placeholder="e.g., 1000000"
            class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <div class="space-y-2">
          <label for="escrowFinishAfter" class="text-sm font-medium leading-none">Finish After (seconds from now)</label>
          <input
            id="escrowFinishAfter"
            v-model="finishAfter"
            type="text"
            placeholder="e.g., 60"
            class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <div class="space-y-2">
          <label for="escrowCancelAfter" class="text-sm font-medium leading-none">Cancel After (seconds from now)</label>
          <input
            id="escrowCancelAfter"
            v-model="cancelAfter"
            type="text"
            placeholder="e.g., 3600"
            class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
      </template>

      <template v-if="action === 'finish' || action === 'cancel'">
        <div class="space-y-2">
          <label for="escrowOwner" class="text-sm font-medium leading-none">Owner</label>
          <input
            id="escrowOwner"
            v-model="owner"
            type="text"
            placeholder="rAddress..."
            class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <div class="space-y-2">
          <label for="escrowId" class="text-sm font-medium leading-none">Escrow ID</label>
          <input
            id="escrowId"
            v-model="escrowId"
            type="text"
            placeholder="Escrow ledger ID..."
            class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
      </template>

      <div class="rounded-md border p-3 text-sm">
        <p class="font-medium mb-2">Smart Escrow Entry Point</p>
        <ul class="text-muted-foreground space-y-1 text-xs">
          <li>finish() - WASM condition checked on EscrowFinish</li>
          <li>Returns 1 to release funds, 0 to keep locked</li>
        </ul>
      </div>

      <button
        v-if="isConnected"
        @click="handleSubmit"
        :disabled="isSubmitting"
        class="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
      >
        {{ isSubmitting ? 'Submitting...' : `Escrow ${action.charAt(0).toUpperCase() + action.slice(1)}` }}
      </button>

      <div
        v-if="!isConnected"
        class="rounded-lg border p-4"
      >
        <p class="text-sm text-muted-foreground">Connect your wallet to interact with escrows</p>
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
