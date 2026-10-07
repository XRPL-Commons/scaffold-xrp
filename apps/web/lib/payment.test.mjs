import assert from "node:assert/strict";
import test from "node:test";

import {
  buildPaymentTransaction,
  parseDestinationTag,
  parseXrpAmount,
  PaymentInputError,
} from "./payment.mjs";

const validAddress = (value) => value === "rDestination";

test("converts XRP decimals to exact drops", () => {
  assert.equal(parseXrpAmount("1"), "1000000");
  assert.equal(parseXrpAmount("0.000001"), "1");
  assert.equal(parseXrpAmount("12.340500"), "12340500");
});

test("rejects fractional precision and non-positive amounts", () => {
  for (const value of ["0", "0.0000001", "1e-3", "-1"]) {
    assert.throws(() => parseXrpAmount(value), PaymentInputError);
  }
});

test("validates optional destination tags", () => {
  assert.equal(parseDestinationTag("0"), 0);
  assert.equal(parseDestinationTag("4294967295"), 4294967295);
  assert.equal(parseDestinationTag(""), undefined);
  assert.throws(() => parseDestinationTag("4294967296"), PaymentInputError);
});

test("builds a payment with drops and an optional tag", () => {
  assert.deepEqual(
    buildPaymentTransaction({
      accountAddress: "rSource",
      accountNetworkId: "testnet",
      selectedNetworkId: "testnet",
      destination: "rDestination",
      amountXrp: "2.5",
      destinationTag: "42",
      isValidAddress: validAddress,
    }),
    {
      TransactionType: "Payment",
      Account: "rSource",
      Destination: "rDestination",
      Amount: "2500000",
      DestinationTag: 42,
    }
  );
});

test("prevents a payment when the wallet network differs", () => {
  assert.throws(
    () =>
      buildPaymentTransaction({
        accountAddress: "rSource",
        accountNetworkId: "devnet",
        selectedNetworkId: "testnet",
        destination: "rDestination",
        amountXrp: "1",
        isValidAddress: validAddress,
      }),
    /switch it to testnet/
  );
});
