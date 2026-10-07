export const DROPS_PER_XRP = 1_000_000n;
export const MAX_XRP_DROPS = 100_000_000_000n * DROPS_PER_XRP;
export const MAX_DESTINATION_TAG = 4_294_967_295n;
const SUCCESS_RESULT = "TESSUCCESS";
const QUEUED_RESULT = "TERQUEUED";

export class PaymentInputError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "PaymentInputError";
    this.code = code;
  }
}

function nonEmptyString(value) {
  return typeof value === "string" && value.trim() !== "";
}

function normalizedResultCode(value) {
  return nonEmptyString(value) ? value.trim() : null;
}

function responseVariants(result) {
  const variants = [];
  const pending = [{ value: result, depth: 0 }];
  const seen = new Set();

  while (pending.length > 0) {
    const { value, depth } = pending.shift();
    if (!value || typeof value !== "object" || seen.has(value)) continue;
    seen.add(value);
    variants.push(value);

    if (depth >= 2) continue;
    for (const key of ["submitResult", "result", "tx_json"]) {
      if (value[key] && typeof value[key] === "object") {
        pending.push({ value: value[key], depth: depth + 1 });
      }
    }
  }

  return variants;
}

function resultCodes(result) {
  const variants = responseVariants(result);
  const metaCodes = variants
    .flatMap((variant) => [
      variant?.meta?.TransactionResult,
      variant?.TransactionResult,
    ])
    .map(normalizedResultCode)
    .filter(Boolean);
  const engineCodes = variants
    .flatMap((variant) => [variant?.engine_result, variant?.engineResult])
    .map(normalizedResultCode)
    .filter(Boolean);

  return { metaCodes, engineCodes, codes: [...metaCodes, ...engineCodes] };
}

/**
 * Normalize the intentionally small result contract shared by XRPL Connect
 * v1 adapters. A hash means a wallet handed back a submission identity; only
 * validated metadata proves that the ledger accepted it. An engine result is
 * useful submission evidence, but it is not validation evidence by itself.
 */
export function normalizeSubmittedPaymentResult(result) {
  if (!result || typeof result !== "object") {
    return {
      status: "error",
      error: "Wallet returned no payment result.",
    };
  }

  const variants = responseVariants(result);
  const hash = variants.map((variant) => variant.hash).find(nonEmptyString);
  if (!hash) {
    return {
      status: "error",
      error: "Wallet returned no transaction hash; the payment was not confirmed as submitted.",
    };
  }

  const { metaCodes, codes } = resultCodes(result);
  const failureCode = codes.find(
    (code) =>
      code.toUpperCase() !== SUCCESS_RESULT && code.toUpperCase() !== QUEUED_RESULT
  );
  if (failureCode) {
    const message = variants
      .map((variant) => variant.engine_result_message || variant.error_message)
      .find(nonEmptyString);
    return {
      status: "error",
      hash,
      id: result.id,
      resultCode: failureCode,
      error: message || `Ledger rejected the payment (${failureCode}).`,
    };
  }

  const explicitError = variants
    .map((variant) => variant.error)
    .find(nonEmptyString);
  if (explicitError) {
    return {
      status: "error",
      hash,
      id: result.id,
      error: explicitError,
    };
  }

  const validated = metaCodes.some(
    (code) => code.toUpperCase() === SUCCESS_RESULT
  );
  return {
    status: validated ? "validated" : "submitted",
    hash,
    id: result.id,
    resultCode: codes[0],
  };
}

/**
 * Convert a decimal XRP input to drops without going through a floating point
 * number. XRPL Payment amounts are integer drops and accept at most six
 * decimal places of XRP.
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
    throw new PaymentInputError("INVALID_TAG", "Destination tag must be between 0 and 4,294,967,295.");
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
