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
  return Array.from(str)
    .map((c) => c.charCodeAt(0).toString(16).padStart(2, '0'))
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

    // Add function arguments if provided
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
  <div class="card">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-bold">Interact with Contract</h2>
      <button @click="loadCounterExample" class="text-sm text-accent hover:underline">
        Load Counter Example
      </button>
    </div>

    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Contract Address
        </label>
        <input
          v-model="contractAddress"
          type="text"
          placeholder="rAddress..."
          class="input"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Function Name</label>
        <input
          v-model="functionName"
          type="text"
          placeholder="e.g., increment, get_value"
          class="input"
        />
        <div v-if="functionName" class="mt-1 text-xs text-gray-500">
          Hex: {{ functionNameHex }}
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Function Arguments (optional)
        </label>
        <input
          v-model="functionArgs"
          type="text"
          placeholder="e.g., 5, hello"
          class="input"
        />
        <div v-if="functionArgs" class="mt-1 text-xs text-gray-500">
          Hex: {{ functionArgsHex }}
        </div>
      </div>

      <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
        <strong>Example Counter Contract Functions:</strong>
        <ul class="list-disc list-inside mt-1 space-y-1">
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
        class="w-full bg-accent text-white py-2 px-4 rounded-lg font-semibold hover:bg-accent/90 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {{ isCalling ? 'Calling Contract...' : 'Call Contract' }}
      </button>

      <div
        v-if="!isConnected"
        class="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800"
      >
        <strong>Connect your wallet</strong> to interact with contracts
      </div>

      <div
        v-if="callResult"
        :class="[
          'p-4 rounded-lg',
          callResult.success
            ? 'bg-green-50 border border-green-200'
            : 'bg-red-50 border border-red-200'
        ]"
      >
        <template v-if="callResult.success">
          <h3 class="font-bold text-green-800 mb-2">Contract Called!</h3>
          <p class="text-sm text-green-700">
            <strong>Hash:</strong> {{ callResult.hash }}
          </p>
          <p v-if="callResult.id" class="text-sm text-green-700">
            <strong>ID:</strong> {{ callResult.id }}
          </p>
          <p class="text-xs text-green-600 mt-2">
            Contract function has been called successfully
          </p>
        </template>
        <template v-else>
          <h3 class="font-bold text-red-800 mb-2">Call Failed</h3>
          <p class="text-sm text-red-700">{{ callResult.error }}</p>
        </template>
      </div>
    </div>
  </div>
</template>
