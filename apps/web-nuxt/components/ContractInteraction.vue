<script setup lang="ts">
const { walletManager, isConnected, addEvent, showStatus } = useWallet()

const contractAddress = ref('')
const functionName = ref('')
const functionArgs = ref('')
const isCalling = ref(false)
const callResult = ref<{
  success: boolean
  hash?: string
  id?: string
  error?: string
} | null>(null)

const stringToHex = (str: string) => {
  return Array.from(new TextEncoder().encode(str))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()
}

const loadCounterExample = () => {
  functionName.value = 'increment'
  functionArgs.value = ''
  callResult.value = null
}

const handleCallContract = async () => {
  if (!walletManager.value || !walletManager.value.account) {
    showStatus('Please connect a wallet first', 'error')
    return
  }

  if (!contractAddress.value || !functionName.value) {
    showStatus('Please provide contract address and function name', 'error')
    return
  }

  try {
    isCalling.value = true
    callResult.value = null

    const transaction: Record<string, unknown> = {
      TransactionType: 'ContractCall',
      Account: walletManager.value.account.address,
      ContractAccount: contractAddress.value,
      Fee: '1000000', // 1 XRP in drops
      FunctionName: stringToHex(functionName.value),
      ComputationAllowance: '1000000',
    }

    if (functionArgs.value) {
      transaction.FunctionArguments = stringToHex(functionArgs.value)
    }

    const txResult = await walletManager.value.signAndSubmit(transaction as any)

    callResult.value = {
      success: true,
      hash: txResult.hash || 'Pending',
      id: txResult.id,
    }

    showStatus('Contract called successfully!', 'success')
    addEvent('Contract Called', txResult)
  } catch (error: any) {
    callResult.value = {
      success: false,
      error: error.message,
    }
    showStatus(`Contract call failed: ${error.message}`, 'error')
    addEvent('Contract Call Failed', error)
  } finally {
    isCalling.value = false
  }
}

const functionNameHex = computed(() => functionName.value ? stringToHex(functionName.value) : '')
const functionArgsHex = computed(() => functionArgs.value ? stringToHex(functionArgs.value) : '')
</script>

<template>
  <div class="rounded-lg border bg-card text-card-foreground shadow-sm">
    <div class="flex items-center justify-between p-6 pb-3">
      <div>
        <h3 class="text-base font-semibold leading-none tracking-tight">Contract Interaction</h3>
        <p class="text-sm text-muted-foreground">Call functions on deployed contracts</p>
      </div>
      <button
        @click="loadCounterExample"
        class="inline-flex items-center justify-center rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground h-8 px-3"
      >
        Load Example
      </button>
    </div>

    <div class="p-6 pt-0 space-y-4">
      <div class="space-y-2">
        <label for="contractAddress" class="text-sm font-medium leading-none">
          Contract Address
        </label>
        <input
          id="contractAddress"
          v-model="contractAddress"
          type="text"
          placeholder="rAddress..."
          class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>

      <div class="space-y-2">
        <label for="functionName" class="text-sm font-medium leading-none">Function Name</label>
        <input
          id="functionName"
          v-model="functionName"
          type="text"
          placeholder="e.g., increment, get_value"
          class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        <p v-if="functionName" class="text-xs text-muted-foreground">
          Hex: {{ functionNameHex }}
        </p>
      </div>

      <div class="space-y-2">
        <label for="functionArgs" class="text-sm font-medium leading-none">
          Arguments (optional)
        </label>
        <input
          id="functionArgs"
          v-model="functionArgs"
          type="text"
          placeholder="e.g., 5, hello"
          class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        <p v-if="functionArgs" class="text-xs text-muted-foreground">
          Hex: {{ functionArgsHex }}
        </p>
      </div>

      <div class="rounded-md border p-3 text-sm">
        <p class="font-medium mb-2">Counter Contract Functions</p>
        <ul class="text-muted-foreground space-y-1 text-xs">
          <li>increment - Increase counter by 1</li>
          <li>decrement - Decrease counter by 1</li>
          <li>get_value - Get current counter value</li>
          <li>reset - Reset counter to 0</li>
        </ul>
      </div>

      <button
        v-if="isConnected && contractAddress && functionName"
        @click="handleCallContract"
        :disabled="isCalling"
        class="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
      >
        {{ isCalling ? 'Calling Contract...' : 'Call Contract' }}
      </button>

      <div
        v-if="!isConnected"
        class="rounded-lg border p-4"
      >
        <p class="text-sm text-muted-foreground">Connect your wallet to interact with contracts</p>
      </div>

      <div
        v-if="callResult"
        :class="[
          'rounded-lg border p-4',
          callResult.success
            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
            : 'border-destructive/50 bg-destructive/10 text-destructive'
        ]"
      >
        <template v-if="callResult.success">
          <h4 class="mb-1 font-medium">Contract Called</h4>
          <p class="font-mono text-xs break-all">Hash: {{ callResult.hash }}</p>
          <p v-if="callResult.id" class="text-xs mt-1">ID: {{ callResult.id }}</p>
        </template>
        <template v-else>
          <h4 class="mb-1 font-medium">Call Failed</h4>
          <p class="text-sm">{{ callResult.error }}</p>
        </template>
      </div>
    </div>
  </div>
</template>
