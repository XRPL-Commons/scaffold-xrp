import type { SubmittableTransaction } from "xrpl";
import type { SubmittedTransaction } from "xrpl-connect";

export interface ExperimentalTransactionBase {
  TransactionType: string;
  Account: string;
  [field: string]: unknown;
}

export interface ContractCallTransaction extends ExperimentalTransactionBase {
  TransactionType: "ContractCall";
  ContractAccount: string;
  Fee: string;
  FunctionName: string;
  FunctionArguments?: string;
  ComputationAllowance: string;
}

export interface EscrowCreateTransaction extends ExperimentalTransactionBase {
  TransactionType: "EscrowCreate";
  Destination: string;
  Amount: string;
  FinishAfter?: number;
  CancelAfter?: number;
}

export interface EscrowFinishTransaction extends ExperimentalTransactionBase {
  TransactionType: "EscrowFinish";
  Owner: string;
  EscrowID: string;
}

export interface EscrowCancelTransaction extends ExperimentalTransactionBase {
  TransactionType: "EscrowCancel";
  Owner: string;
  EscrowID: string;
}

export interface VaultTransaction extends ExperimentalTransactionBase {
  TransactionType: "VaultDeposit" | "VaultWithdraw";
  VaultID: string;
  Amount: string;
  ComputationAllowance: number;
  Fee: string;
}

export interface MPTokenAuthorizeTransaction extends ExperimentalTransactionBase {
  TransactionType: "MPTokenAuthorize";
  MPTokenIssuanceID: string;
  Flags: number;
}

export interface MPTokenIssuanceCreateTransaction extends ExperimentalTransactionBase {
  TransactionType: "MPTokenIssuanceCreate";
  AssetScale: number;
  Flags: number;
  MPTokenMetadata: string;
  MaximumAmount?: string;
}

export interface MPTokenPaymentTransaction extends ExperimentalTransactionBase {
  TransactionType: "Payment";
  Destination: string;
  Amount: {
    mpt_issuance_id: string;
    value: string;
  };
}

export type AppTransaction =
  | SubmittableTransaction
  | ContractCallTransaction
  | EscrowCreateTransaction
  | EscrowFinishTransaction
  | EscrowCancelTransaction
  | VaultTransaction
  | MPTokenAuthorizeTransaction
  | MPTokenIssuanceCreateTransaction
  | MPTokenPaymentTransaction;

export type AppSubmittedTransaction = SubmittedTransaction;

export interface TransactionSuccessResult {
  success: true;
  hash: string;
  id?: string;
}

export interface TransactionFailureResult {
  success: false;
  error: string;
}

export type TransactionResult = TransactionSuccessResult | TransactionFailureResult;
