export const DROPS_PER_XRP = 1_000_000n;
export const MAX_XRP_DROPS = 100_000_000_000n * DROPS_PER_XRP;
export const MAX_DESTINATION_TAG = 4_294_967_295n;

export class PaymentInputError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "PaymentInputError";
    this.code = code;
  }
}

/**
 * Convert a decimal XRP input to drops without going through a floating point
 * number. XRP amounts accept at most six decimal places.
 */
export function parseXrpAmount(value) {
  const input = String(value ?? "").trim();
  const match = /^(\d+)(?:\.(\d{1,6}))?$/.exec(input);

  if (!match) {
    throw new PaymentInputError(
      "INVALID_AMOUNT",
      "Enter an XRP amount with up to six decimal places."
    );
  }

  const whole = BigInt(match[1]);
  const fraction = BigInt((match[2] ?? "").padEnd(6, "0") || "0");
  const drops = whole * DROPS_PER_XRP + fraction;

  if (drops <= 0n) {
    throw new PaymentInputError("INVALID_AMOUNT", "Amount must be greater than zero.");
  }

  if (drops > MAX_XRP_DROPS) {
    throw new PaymentInputError("INVALID_AMOUNT", "Amount exceeds the XRP supply limit.");
  }

  return drops.toString();
}

export function parseDestinationTag(value) {
  const input = String(value ?? "").trim();
  if (input === "") return undefined;

  if (!/^\d+$/.test(input)) {
    throw new PaymentInputError("INVALID_TAG", "Destination tag must be a whole number.");
  }

  const tag = BigInt(input);
  if (tag > MAX_DESTINATION_TAG) {
    throw new PaymentInputError(
      "INVALID_TAG",
      "Destination tag must be between 0 and 4,294,967,295."
    );
  }

  return Number(tag);
}

export function validateDestination(destination, isValidAddress) {
  const normalized = String(destination ?? "").trim();
  if (!normalized) {
    throw new PaymentInputError("INVALID_DESTINATION", "Enter a destination address.");
  }

  if (typeof isValidAddress !== "function" || !isValidAddress(normalized)) {
    throw new PaymentInputError("INVALID_DESTINATION", "Enter a valid XRPL account address.");
  }

  return normalized;
}

export function buildPaymentTransaction({
  accountAddress,
  accountNetworkId,
  selectedNetworkId,
  destination,
  amountXrp,
  destinationTag,
  isValidAddress,
}) {
  const account = String(accountAddress ?? "").trim();
  if (!account) {
    throw new PaymentInputError("MISSING_ACCOUNT", "Connect a wallet before sending XRP.");
  }

  if (
    selectedNetworkId &&
    accountNetworkId &&
    selectedNetworkId !== accountNetworkId
  ) {
    throw new PaymentInputError(
      "NETWORK_MISMATCH",
      `Wallet is connected to ${accountNetworkId}; switch it to ${selectedNetworkId} before sending.`
    );
  }

  const transaction = {
    TransactionType: "Payment",
    Account: account,
    Destination: validateDestination(destination, isValidAddress),
    Amount: parseXrpAmount(amountXrp),
  };

  const parsedTag = parseDestinationTag(destinationTag);
  if (parsedTag !== undefined) transaction.DestinationTag = parsedTag;

  return transaction;
}

/**
 * @returns {{status: "submitted"|"validated", hash: string, id?: string}}
 */
export function normalizeSubmittedPayment(result) {
  const hash = typeof result?.hash === "string" ? result.hash.trim() : "";
  if (!hash) {
    throw new PaymentInputError(
      "SUBMISSION_FAILED",
      "The wallet did not return a transaction hash. The payment was not confirmed as submitted."
    );
  }

  const resultCode =
    result?.meta?.TransactionResult ??
    result?.tx_json?.meta?.TransactionResult ??
    result?.engine_result;
  const isQueued = typeof resultCode === "string" && resultCode.startsWith("ter");
  const isRejected =
    typeof resultCode === "string" &&
    resultCode !== "tesSUCCESS" &&
    !isQueued;

  if (isRejected) {
    throw new PaymentInputError(
      "LEDGER_REJECTED",
      `The ledger rejected the payment (${resultCode}).`
    );
  }

  return {
    status: result?.validated === true ? "validated" : "submitted",
    hash,
    id: typeof result?.id === "string" ? result.id : undefined,
  };
}
