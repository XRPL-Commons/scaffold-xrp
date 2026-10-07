import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildPaymentTransaction,
  normalizeSubmittedPaymentResult,
  parseDestinationTag,
  parseXrpAmount,
  PaymentInputError,
} from './payment.mjs'

const validAddress = (value) => value === 'rDestination'

test('converts XRP decimals to exact drops', () => {
  assert.equal(parseXrpAmount('1'), '1000000')
  assert.equal(parseXrpAmount('0.000001'), '1')
  assert.equal(parseXrpAmount('12.340500'), '12340500')
})

test('rejects fractional precision and non-positive amounts', () => {
  for (const value of ['0', '0.0000001', '1e-3', '-1']) {
    assert.throws(() => parseXrpAmount(value), PaymentInputError)
  }
})

test('validates optional destination tags', () => {
  assert.equal(parseDestinationTag('0'), 0)
  assert.equal(parseDestinationTag('4294967295'), 4294967295)
  assert.equal(parseDestinationTag(''), undefined)
  assert.throws(() => parseDestinationTag('4294967296'), PaymentInputError)
})

test('builds a payment with drops and an optional tag', () => {
  assert.deepEqual(
    buildPaymentTransaction({
      accountAddress: 'rSource',
      accountNetworkId: 'testnet',
      selectedNetworkId: 'testnet',
      destination: 'rDestination',
      amountXrp: '2.5',
      destinationTag: '42',
      isValidAddress: validAddress,
    }),
    {
      TransactionType: 'Payment',
      Account: 'rSource',
      Destination: 'rDestination',
      Amount: '2500000',
      DestinationTag: 42,
    },
  )
})

test('prevents a payment when the wallet network differs', () => {
  assert.throws(
    () =>
      buildPaymentTransaction({
        accountAddress: 'rSource',
        accountNetworkId: 'devnet',
        selectedNetworkId: 'testnet',
        destination: 'rDestination',
        amountXrp: '1',
        isValidAddress: validAddress,
      }),
    /switch it to testnet/,
  )
})

test('requires ledger success metadata before showing validation', () => {
  assert.deepEqual(
    normalizeSubmittedPaymentResult({
      hash: 'ABC123',
      validated: true,
      meta: { TransactionResult: 'tesSUCCESS' },
    }),
    {
      status: 'validated',
      hash: 'ABC123',
      id: undefined,
      resultCode: 'tesSUCCESS',
    },
  )

  assert.equal(
    normalizeSubmittedPaymentResult({ hash: 'ABC123', validated: true }).status,
    'submitted',
  )
  assert.equal(
    normalizeSubmittedPaymentResult({
      hash: 'ABC123',
      validated: false,
      meta: { TransactionResult: 'tesSUCCESS' },
    }).status,
    'submitted',
  )
})

test('does not turn a rejected ledger result into a successful payment', () => {
  const result = normalizeSubmittedPaymentResult({
    hash: 'ABC123',
    validated: true,
    engine_result: 'tesSUCCESS',
    meta: { TransactionResult: 'tecNO_DST' },
  })

  assert.equal(result.status, 'error')
  assert.match(result.error, /tecNO_DST/)
})

test('inspects the adapter submitResult wrapper for ledger outcomes', () => {
  const result = normalizeSubmittedPaymentResult({
    hash: 'ABC123',
    submitResult: {
      result: {
        engine_result: 'tesSUCCESS',
        meta: { TransactionResult: 'tecNO_DST' },
      },
    },
  })

  assert.equal(result.status, 'error')
  assert.match(result.error, /tecNO_DST/)
})

test('keeps a hash-only adapter response submitted but unvalidated', () => {
  assert.deepEqual(normalizeSubmittedPaymentResult({ hash: 'ABC123' }), {
    status: 'submitted',
    hash: 'ABC123',
    id: undefined,
    resultCode: undefined,
  })
})

test('treats explicit adapter errors as failures even with a hash', () => {
  const result = normalizeSubmittedPaymentResult({
    hash: 'ABC123',
    submitResult: { error: 'Submission was rejected' },
  })

  assert.equal(result.status, 'error')
  assert.equal(result.error, 'Submission was rejected')
})

test('rejects empty or missing adapter results', () => {
  assert.equal(normalizeSubmittedPaymentResult(null).status, 'error')
  assert.equal(
    normalizeSubmittedPaymentResult({ validated: true }).status,
    'error',
  )
})

test('only treats terQUEUED as a queued engine result', () => {
  assert.equal(
    normalizeSubmittedPaymentResult({ hash: 'ABC123', engine_result: 'terQUEUED' }).status,
    'submitted',
  )
  assert.equal(
    normalizeSubmittedPaymentResult({ hash: 'ABC123', engine_result: 'terRETRY' }).status,
    'error',
  )
})
