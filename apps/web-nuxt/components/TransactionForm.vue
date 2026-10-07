<script setup lang="ts">
import {
  useSigner,
  useWallet as useBindingWallet,
} from '@xrpl-commons/xrpl-connect-vue'
import { isWalletError, WalletErrorCode } from 'xrpl-connect'
import { isValidClassicAddress } from 'xrpl'
import { buildPaymentTransaction, normalizeSubmittedPaymentResult } from '~/lib/payment.mjs'

type PaymentResult =
  | {
      status: 'submitted' | 'validated'
      hash: string
      id?: string
      resultCode?: string
    }
  | {
      status: 'cancelled' | 'error'
      hash?: string
      id?: string
      resultCode?: string
      error: string
    }

const { connected, account, connecting } = useBindingWallet()
const { signAndSubmit } = useSigner()
const { selectedNetwork, addEvent, showStatus } = useWallet()

const destination = ref('')
const amountXrp = ref('')
const destinationTag = ref('')
const result = ref<PaymentResult | null>(null)
const isSubmitting = ref(false)

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
    const nextResult = normalizeSubmittedPaymentResult(submittedTransaction) as PaymentResult

    if (nextResult.status === 'error') {
      result.value = nextResult
      showStatus(`Payment failed: ${nextResult.error}`, 'error')
      addEvent('Payment Failed', nextResult)
      return
    }

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
  <section class="rounded-xl border bg-card p-6 text-card-foreground shadow-sm md:p-8">
    <div class="space-y-1">
      <h2 class="text-lg font-semibold tracking-tight">Send XRP</h2>
      <p class="text-sm text-muted-foreground">Send XRP on {{ selectedNetwork.name }}.</p>
    </div>

    <div class="mt-6">
      <div
        v-if="networkMismatch"
        role="alert"
        class="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
      >
        Your wallet is on {{ account?.network.name }}. Switch it to {{ selectedNetwork.name }}
        before sending.
      </div>

      <form class="space-y-6" @submit.prevent="handleSubmit">
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
            class="flex h-12 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            required
          >
        </div>

        <div class="space-y-2">
          <label for="amountXrp" class="text-sm font-medium leading-none">Amount (XRP)</label>
          <div class="relative">
            <input
              id="amountXrp"
              v-model="amountXrp"
              type="text"
              inputmode="decimal"
              autocomplete="off"
              placeholder="1.5"
              aria-describedby="amount-help"
              class="flex h-12 w-full rounded-md border border-input bg-transparent px-3 py-1 pr-16 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              required
            >
            <span
              aria-hidden="true"
              class="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm text-muted-foreground"
            >
              XRP
            </span>
          </div>
          <p id="amount-help" class="text-xs text-muted-foreground">Up to six decimal places.</p>
        </div>

        <details class="group">
          <summary
            class="flex cursor-pointer list-none items-center gap-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring [&::-webkit-details-marker]:hidden"
          >
            <svg
              aria-hidden="true"
              class="h-4 w-4 shrink-0 transition-transform group-open:rotate-180"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="m6 9 6 6 6-6" />
            </svg>
            <span v-if="destinationTag.trim()">
              Destination tag: {{ destinationTag.trim() }}
            </span>
            <template v-else>
              <span>Add destination tag</span>
              <span class="font-normal text-muted-foreground">(optional)</span>
            </template>
          </summary>
          <div class="mt-4 space-y-2">
            <label for="destinationTag" class="text-sm font-medium leading-none">
              Destination tag
            </label>
            <input
              id="destinationTag"
              v-model="destinationTag"
              type="text"
              inputmode="numeric"
              autocomplete="off"
              placeholder="e.g. 12345"
              class="flex h-12 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
            <p class="text-xs text-muted-foreground">
              Include the tag if the recipient requires one.
            </p>
          </div>
        </details>

        <button
          type="submit"
          :disabled="!connected || connecting || networkMismatch || isSubmitting"
          class="inline-flex h-12 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
        >
          {{ isSubmitting ? 'Waiting for wallet…' : 'Sign & submit payment' }}
        </button>
      </form>

      <div
        v-if="result?.status === 'submitted' || result?.status === 'validated'"
        role="status"
        aria-live="polite"
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
        role="alert"
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
