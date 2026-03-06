// XLS-101d Smart Contract specification constants and utilities.
// Reference: https://github.com/XRPLF/XRPL-Standards/discussions/271

import { stringToHex } from "./utils";

// -- Transaction types --

export const TX_TYPES = {
  CONTRACT_CREATE: "ContractCreate",
  CONTRACT_CALL: "ContractCall",
  CONTRACT_MODIFY: "ContractModify",
  CONTRACT_DELETE: "ContractDelete",
  CONTRACT_USER_DELETE: "ContractUserDelete",
  CONTRACT_CLAWBACK: "ContractClawback",
};

// -- Immutability flags (ContractCreate / ContractModify) --

export const CONTRACT_FLAGS = {
  tfImmutable: 0x00000001,
  tfCodeImmutable: 0x00000002,
  tfABIImmutable: 0x00000004,
  tfUndeletable: 0x00000008,
};

// -- Parameter flags (STParameters) --

export const PARAM_FLAGS = {
  tfSendAmount: 0x00000001,
  tfSendNFToken: 0x00000002,
  tfAuthorizeTokenHolding: 0x00000004,
};

// -- Supported SType identifiers --

export const STYPES = {
  UInt8: "UInt8",
  UInt16: "UInt16",
  UInt32: "UInt32",
  UInt64: "UInt64",
  Hash128: "Hash128",
  Hash256: "Hash256",
  Amount: "Amount",
  Blob: "Blob",
  AccountID: "AccountID",
  Int8: "Int8",
  Int16: "Int16",
  Int32: "Int32",
  Int64: "Int64",
};

const MAX_PARAMS_PER_FUNCTION = 4;

const VALID_STYPES = new Set(Object.values(STYPES));

/**
 * Build a ContractCall transaction.
 *
 * @param {Object} options
 * @param {string} options.account - Sender address.
 * @param {string} options.contractAccount - Target contract pseudo-account.
 * @param {string} options.functionName - Function to invoke (plain text).
 * @param {string} [options.functionArgs] - Optional arguments (plain text).
 * @param {string} [options.fee="1000000"] - Fee in drops.
 * @param {string} [options.computationAllowance="1000000"] - Gas budget.
 * @returns {Object} Transaction object ready for signAndSubmit.
 */
export function buildContractCall({
  account,
  contractAccount,
  functionName,
  functionArgs,
  fee = "1000000",
  computationAllowance = "1000000",
}) {
  const tx = {
    TransactionType: TX_TYPES.CONTRACT_CALL,
    Account: account,
    ContractAccount: contractAccount,
    Fee: fee,
    FunctionName: stringToHex(functionName),
    ComputationAllowance: computationAllowance,
  };

  if (functionArgs) {
    tx.FunctionArguments = stringToHex(functionArgs);
  }

  return tx;
}

/**
 * Build a ContractCreate transaction.
 *
 * @param {Object} options
 * @param {string} options.account - Deployer address.
 * @param {string} options.contractCode - Hex-encoded WASM bytecode.
 * @param {string} [options.fee="1000000"] - Fee in drops.
 * @param {number} [options.flags=0] - Contract flags (tfImmutable, etc.).
 * @returns {Object} Transaction object ready for signAndSubmit.
 */
export function buildContractCreate({
  account,
  contractCode,
  fee = "1000000",
  flags = 0,
}) {
  return {
    TransactionType: TX_TYPES.CONTRACT_CREATE,
    Account: account,
    ContractCode: contractCode,
    Fee: fee,
    Flags: flags,
  };
}

/**
 * Build a ContractDelete transaction.
 *
 * @param {Object} options
 * @param {string} options.account - Owner address.
 * @param {string} options.contractAccount - Contract to delete.
 * @param {string} [options.fee="1000000"] - Fee in drops.
 * @returns {Object} Transaction object ready for signAndSubmit.
 */
export function buildContractDelete({
  account,
  contractAccount,
  fee = "1000000",
}) {
  return {
    TransactionType: TX_TYPES.CONTRACT_DELETE,
    Account: account,
    ContractAccount: contractAccount,
    Fee: fee,
  };
}

/**
 * Validate an ABI object against XLS-101 rules.
 *
 * @param {Object} abi - The ABI to validate.
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateABI(abi) {
  const errors = [];

  if (!abi.contract_name) {
    errors.push("Missing required field: contract_name");
  }

  if (!Array.isArray(abi.functions)) {
    errors.push("Missing or invalid field: functions (must be an array)");
    return { valid: false, errors };
  }

  for (const fn of abi.functions) {
    if (!fn.name) {
      errors.push("Function missing required field: name");
      continue;
    }

    if (!Array.isArray(fn.parameters)) {
      errors.push(`Function "${fn.name}": parameters must be an array`);
      continue;
    }

    if (fn.parameters.length > MAX_PARAMS_PER_FUNCTION) {
      errors.push(
        `Function "${fn.name}": exceeds maximum of ${MAX_PARAMS_PER_FUNCTION} parameters`
      );
    }

    for (const param of fn.parameters) {
      if (!param.name) {
        errors.push(`Function "${fn.name}": parameter missing name`);
      }
      if (!param.type) {
        errors.push(
          `Function "${fn.name}": parameter "${param.name || "?"}" missing type`
        );
      } else if (!VALID_STYPES.has(param.type)) {
        errors.push(
          `Function "${fn.name}": parameter "${param.name}" has invalid type "${param.type}"`
        );
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
