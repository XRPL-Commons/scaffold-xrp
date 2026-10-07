<script setup lang="ts">
import {
  useSigner,
  useWallet as useBindingWallet,
  useWalletModal,
} from '@xrpl-commons/xrpl-connect-vue'
import { isWalletError, WalletErrorCode } from 'xrpl-connect'
import { isValidClassicAddress } from 'xrpl'
import {
  buildPaymentTransaction,
  normalizeSubmittedPayment,
  parseXrpAmount,
} from '~/lib/payment.mjs'

type PaymentResult =
  | { status: 'submitted' | 'validated'; hash: string; id?: string }
  | { status: 'cancelled' | 'error'; error: string }

const { connected, account, connecting } = useBindingWallet()
const { signAndSubmit } = useSigner()
const { ready, open } = useWalletModal()
const { selectedNetwork, addEvent, showStatus } = useWallet()

const destination = ref('')
const amountXrp = ref('')
const destinationTag = ref('')
const result = ref<PaymentResult | null>(null)
const isSubmitting = ref(false)

const dropsPreview = computed(() => {
  if (!amountXrp.value.trim()) return null
  try {
    return parseXrpAmount(amountXrp.value)
  } catch {
    return null
  }
})

const networkMismatch = computed(
  () => Boolean(account.value && account.value.network.id !== selectedNetwork.value.id),
)
const failureMessage = computed(() =>
  result.value && 'error' in result.value ? result.value.error : null,
)
const paymentCancelled = computed(() => result.value?.status === 'cancelled')

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}

function isCancelledWalletAction(error: unknown) {
  return (
    isWalletError(error) &&
    [WalletErrorCode.SIGN_REJECTED, WalletErrorCode.CONNECTION_REJECTED].includes(error.code)
  )
}

async function openWallet() {
  try {
    await open()
  } catch (error) {
    const message = getErrorMessage(error)
    showStatus(`Could not open wallet selection: ${message}`, 'error')
  }
}

async function handleSubmit() {
  if (isSubmitting.value) return

  if (!connected.value || !account.value) {
    showStatus('Connect a wallet before sending XRP.', 'error')
    return
  }

  isSubmitting.value = true
  result.value = null

  try {
    const transaction = buildPaymentTransaction({
      accountAddress: account.value.address,
      accountNetworkId: account.value.network.id,
      selectedNetworkId: selectedNetwork.value.id,
      destination: destination.value,
      amountXrp: amountXrp.value,
      destinationTag: destinationTag.value,
      isValidAddress: isValidClassicAddress,
    })
    const submittedTransaction = await signAndSubmit(
      transaction as Parameters<typeof signAndSubmit>[0],
    )
    const nextResult = normalizeSubmittedPayment(submittedTransaction) as Extract<
      PaymentResult,
      { status: 'submitted' | 'validated' }
    >

    result.value = nextResult
    showStatus(
      nextResult.status === 'validated'
        ? 'Payment validated on the ledger.'
        : 'Payment submitted; validation is pending.',
      'success',
    )
    addEvent('Payment Submitted', submittedTransaction)
    destination.value = ''
    amountXrp.value = ''
    destinationTag.value = ''
  } catch (error) {
    const cancelled = isCancelledWalletAction(error)
    const message = cancelled ? 'Transaction signing was cancelled.' : getErrorMessage(error)
    result.value = { status: cancelled ? 'cancelled' : 'error', error: message }

    if (cancelled) {
      showStatus(message, 'info')
    } else {
      showStatus(`Payment failed: ${message}`, 'error')
      addEvent('Payment Failed', error)
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <section class="rounded-lg border bg-card text-card-foreground shadow-sm">
    <div class="flex flex-col space-y-1.5 p-6 pb-3">
      <h2 class="text-base font-semibold leading-none tracking-tight">Send XRP</h2>
      <p class="text-sm text-muted-foreground">
        Send XRP on {{ selectedNetwork.name }}. Amounts are converted to drops exactly.
      </p>
    </div>

    <div class="p-6 pt-0">
      <div
        v-if="!connected"
        class="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-md border p-3 text-sm"
      >
        <span class="text-muted-foreground">Connect a wallet to sign this payment.</span>
        <button
          type="button"
          class="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
          :disabled="!ready || connecting"
          @click="openWallet"
        >
          {{ connecting ? 'Connecting…' : 'Connect wallet' }}
        </button>
      </div>

      <div
        v-if="networkMismatch"
        class="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
      >
        Your wallet is on {{ account?.network.name }}. Switch it to {{ selectedNetwork.name }}
        before sending.
      </div>

      <form class="space-y-4" @submit.prevent="handleSubmit">
        <div class="space-y-2">
          <label for="destination" class="text-sm font-medium leading-none">
            Destination address
          </label>
          <input
            id="destination"
            v-model="destination"
            type="text"
            autocomplete="off"
            placeholder="rN7n7otQDd6FczFgLdlqtyMVrn3HMfXoQT"
            class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            required
          />
        </div>

        <div class="space-y-2">
          <label for="destinationTag" class="text-sm font-medium leading-none">
            Destination tag <span class="font-normal text-muted-foreground">(optional)</span>
          </label>
          <input
            id="destinationTag"
            v-model="destinationTag"
            type="text"
            inputmode="numeric"
            autocomplete="off"
            placeholder="e.g. 12345"
            class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <p class="text-xs text-muted-foreground">
            Include a tag when the recipient provides one, such as an exchange deposit.
          </p>
        </div>

        <div class="space-y-2">
          <label for="amountXrp" class="text-sm font-medium leading-none">Amount (XRP)</label>
          <input
            id="amountXrp"
            v-model="amountXrp"
            type="text"
            inputmode="decimal"
            autocomplete="off"
            placeholder="1.5"
            class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            required
          />
          <p class="text-xs text-muted-foreground">
            {{ dropsPreview ? `${dropsPreview} drops` : 'Up to six decimal places' }} · 1 XRP = 1,000,000 drops
          </p>
        </div>

        <button
          type="submit"
          :disabled="!connected || connecting || networkMismatch || isSubmitting"
          class="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
        >
          {{ isSubmitting ? 'Waiting for wallet…' : 'Sign & submit payment' }}
        </button>
      </form>

      <div
        v-if="result?.status === 'submitted' || result?.status === 'validated'"
        class="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-800"
      >
        <h3 class="mb-1 font-medium">
          {{ result.status === 'validated' ? 'Payment validated' : 'Payment submitted' }}
        </h3>
        <p class="break-all font-mono text-xs">Hash: {{ result.hash }}</p>
        <p v-if="result.id" class="mt-1 text-xs">ID: {{ result.id }}</p>
        <p v-if="result.status === 'submitted'" class="mt-1 text-xs">
          The ledger has not reported validation yet.
        </p>
      </div>

      <div
        v-else-if="failureMessage"
          :class="[
          'mt-4 rounded-lg border p-4',
          paymentCancelled
            ? 'border-amber-200 bg-amber-50 text-amber-900'
            : 'border-destructive/50 bg-destructive/10 text-destructive',
        ]"
      >
        <h3 class="mb-1 font-medium">
          {{ paymentCancelled ? 'Payment cancelled' : 'Payment failed' }}
        </h3>
        <p class="text-sm">{{ failureMessage }}</p>
      </div>
    </div>
  </section>
</template>
