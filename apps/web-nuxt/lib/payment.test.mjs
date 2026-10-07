import test from "node:test";
import assert from "node:assert/strict";
import {
  PaymentInputError,
  buildPaymentTransaction,
  normalizeSubmittedPayment,
  parseDestinationTag,
  parseXrpAmount,
} from "./payment.mjs";

const validAddress = (value) => value.startsWith("r");

test("converts XRP to drops without floating point rounding", () => {
  assert.equal(parseXrpAmount("1.000001"), "1000001");
  assert.equal(parseXrpAmount("0.000001"), "1");
});

test("rejects invalid amounts and tags", () => {
  assert.throws(() => parseXrpAmount("1.0000001"), PaymentInputError);
  assert.throws(() => parseXrpAmount("0"), PaymentInputError);
  assert.throws(() => parseDestinationTag("12.5"), PaymentInputError);
  assert.throws(() => parseDestinationTag("4294967296"), PaymentInputError);
});

test("builds a payment with an optional destination tag", () => {
  assert.deepEqual(
    buildPaymentTransaction({
      accountAddress: "rSender",
      accountNetworkId: "testnet",
      selectedNetworkId: "testnet",
      destination: "rDestination",
      amountXrp: "2.5",
      destinationTag: "12345",
      isValidAddress: validAddress,
    }),
    {
      TransactionType: "Payment",
      Account: "rSender",
      Destination: "rDestination",
      Amount: "2500000",
      DestinationTag: 12345,
    },
  );
});

test("blocks payments when the wallet network differs from the selector", () => {
  assert.throws(
    () =>
      buildPaymentTransaction({
        accountAddress: "rSender",
        accountNetworkId: "testnet",
        selectedNetworkId: "devnet",
        destination: "rDestination",
        amountXrp: "1",
        isValidAddress: validAddress,
      }),
    (error) =>
      error instanceof PaymentInputError &&
      error.code === "NETWORK_MISMATCH",
  );
});

test("only reports submitted or validated payments with a hash and successful ledger result", () => {
  assert.deepEqual(
    normalizeSubmittedPayment({ hash: "ABC", engine_result: "tesSUCCESS" }),
    { status: "submitted", hash: "ABC", id: undefined },
  );
  assert.deepEqual(
    normalizeSubmittedPayment({
      hash: "DEF",
      validated: true,
      meta: { TransactionResult: "tesSUCCESS" },
    }),
    { status: "validated", hash: "DEF", id: undefined },
  );
  assert.throws(
    () => normalizeSubmittedPayment({ hash: "BAD", meta: { TransactionResult: "tecNO_DST" } }),
    PaymentInputError,
  );
  assert.throws(() => normalizeSubmittedPayment({ validated: true }), PaymentInputError);
});
