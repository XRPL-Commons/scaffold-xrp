# XLS-101d: XRPL Smart Contracts Reference

Specification discussion: https://github.com/XRPLF/XRPL-Standards/discussions/271

## Overview

XLS-101d defines WebAssembly (WASM) smart contracts for the XRP Ledger. Contracts are compiled to WASM, deployed as pseudo-accounts, and invoked through dedicated transaction types. The specification covers contract lifecycle, state management, parameter passing, immutability controls, event emission, and gas metering.

## Transaction Types

### ContractCreate

Deploys a new contract by uploading WASM bytecode and creating a pseudo-account.

| Field | Type | Description |
|---|---|---|
| `TransactionType` | String | `"ContractCreate"` |
| `Account` | AccountID | Deployer account |
| `ContractOwner` | AccountID | Optional owner (defaults to Account) |
| `ContractCode` | Blob | WASM bytecode |
| `ContractHash` | Hash256 | Reference to existing ContractSource (alternative to ContractCode) |
| `Functions` | STArray | Function signatures (ABI) |
| `InstanceParameters` | STParameters | Deployment-specific parameter definitions |
| `InstanceParameterValues` | STParameterValues | Initial parameter values |
| `Flags` | UInt32 | Immutability flags |

### ContractCall

Invokes a function on a deployed contract.

| Field | Type | Description |
|---|---|---|
| `TransactionType` | String | `"ContractCall"` |
| `Account` | AccountID | Caller |
| `ContractAccount` | AccountID | Target contract pseudo-account |
| `FunctionName` | String | Function to invoke (hex-encoded) |
| `FunctionArguments` | String | Optional arguments (hex-encoded) |
| `ComputationAllowance` | String | Gas budget in drops |
| `Fee` | String | Transaction fee in drops |

### ContractModify

Updates contract code or instance parameters. Requires owner authorization.

| Field | Type | Description |
|---|---|---|
| `TransactionType` | String | `"ContractModify"` |
| `Account` | AccountID | Owner account |
| `ContractAccount` | AccountID | Target contract |
| `ContractCode` / `ContractHash` | Blob / Hash256 | New code |
| `InstanceParameterValues` | STParameterValues | Updated parameters |

### ContractDelete

Removes a contract and its pseudo-account.

| Field | Type | Description |
|---|---|---|
| `TransactionType` | String | `"ContractDelete"` |
| `Account` | AccountID | Owner or contract itself |
| `ContractAccount` | AccountID | Contract to delete |

### ContractUserDelete

Allows users to remove their contract-specific data. Triggers the optional `user_delete` callback.

| Field | Type | Description |
|---|---|---|
| `TransactionType` | String | `"ContractUserDelete"` |
| `Account` | AccountID | User removing data |
| `ContractAccount` | AccountID | Target contract |

### ContractClawback

Enables token issuers to claw back funds from contracts. Triggers the optional `clawback` callback.

| Field | Type | Description |
|---|---|---|
| `TransactionType` | String | `"ContractClawback"` |
| `Account` | AccountID | Token issuer |
| `ContractAccount` | AccountID | Target contract |
| `Amount` | Amount | Clawback amount |

## Ledger Objects

### ContractSource

Shared code storage that deduplicates identical contract deployments.

| Field | Type | Description |
|---|---|---|
| `LedgerEntryType` | String | `"ContractSource"` |
| `ContractHash` | Hash256 | Hash of the WASM bytecode |
| `ContractCode` | Blob | WASM bytecode |
| `InstanceParameters` | STParameters | Parameter definitions |
| `Functions` | STArray | Function signatures |
| `ReferenceCount` | UInt32 | Number of contracts using this source |

### Contract

Contract metadata and state reference.

| Field | Type | Description |
|---|---|---|
| `LedgerEntryType` | String | `"Contract"` |
| `ContractAccount` | AccountID | Pseudo-account hosting the contract |
| `Owner` | AccountID | Contract controller |
| `Flags` | UInt32 | Immutability settings |
| `Sequence` | UInt16 | Version identifier |
| `ContractHash` | Hash256 | Reference to ContractSource |
| `InstanceParameterValues` | STParameterValues | Active parameter values |
| `URI` | Blob | Optional source code location |

### ContractData

Persistent key-value storage for contract state and per-user data.

| Field | Type | Description |
|---|---|---|
| `LedgerEntryType` | String | `"ContractData"` |
| `Owner` | AccountID | Data owner |
| `ContractAccount` | AccountID | Controlling contract |
| `Data` | STData | Serialized key-value pairs |

Reserve model: one reserve per 256 bytes of stored data.

## STParameters and STParameterValues

STParameters define function parameter schemas. STParameterValues carry actual parameter data at call time.

### Constraints

- Maximum **4 parameters** per function
- All parameters are mandatory (no overloading)
- Complex types (STObjects, STArrays) are not allowed
- All parameter types must be valid XRPL STypes

### Supported STypes

| Type | Description |
|---|---|
| `UInt8` | Unsigned 8-bit integer |
| `UInt16` | Unsigned 16-bit integer |
| `UInt32` | Unsigned 32-bit integer |
| `UInt64` | Unsigned 64-bit integer |
| `Hash128` | 128-bit hash |
| `Hash256` | 256-bit hash |
| `Amount` | XRPL amount (XRP or token) |
| `Blob` | Variable-length binary data |
| `AccountID` | XRPL account address |

### Parameter Flags

| Flag | Value | Description |
|---|---|---|
| `tfSendAmount` | `0x00000001` | Transfers specified amount to the contract |
| `tfSendNFToken` | `0x00000002` | Transfers NFToken to the contract |
| `tfAuthorizeTokenHolding` | `0x00000004` | Auto-creates trustlines or MPToken authorization |

## Lifecycle Callbacks

Lifecycle callbacks are optional `extern "C"` functions exported from the WASM module. They are invoked automatically by the ledger in response to specific transaction types.

### `init()`

Called during `ContractCreate`. Use it to initialize contract state.

```rust
#[wasm_export]
fn init() -> i32 {
    // Initialize state
    0 // SUCCESS
}
```

### `user_delete()`

Called during `ContractUserDelete`. Allows cleanup when a user removes their data.

```rust
#[wasm_export]
fn user_delete() -> i32 {
    // Handle user data removal
    0 // SUCCESS
}
```

### `clawback()`

Called during `ContractClawback`. Allows contracts to respond to token clawbacks.

```rust
#[wasm_export]
fn clawback() -> i32 {
    // Handle token clawback
    0 // SUCCESS
}
```

## Immutability Flags

A contract can have at most one of `lsfImmutable`, `lsfCodeImmutable`, and `lsfABIImmutable` enabled.

| Flag | Value | Description |
|---|---|---|
| `tfImmutable` | `0x00000001` | Code and parameters permanently locked |
| `tfCodeImmutable` | `0x00000002` | Code locked; parameters modifiable |
| `tfABIImmutable` | `0x00000004` | Code modifiable; function signatures locked |
| `tfUndeletable` | `0x00000008` | Contract cannot be deleted |

## Gas Metering

Computation is metered via the `ComputationAllowance` field on `ContractCall` transactions. Key parameters (governed by UNL voting):

- Drops per instruction executed
- Maximum instructions per transaction
- Memory limits and costs

If a callback (`user_delete`, `clawback`) exhausts the computational budget, the transaction fails.

## Event Emission

Contracts can emit events that are stored in transaction metadata and are queryable.

```rust
// Conceptual API (stdlib-dependent)
emit_event("counter_updated", data);
```

Events can be subscribed to in real-time via the `eventEmitted` WebSocket subscription or queried historically via `event_history`.

## RPC Methods

### `contract_info`

Fetches contract ABI and metadata.

```json
{
  "command": "contract_info",
  "contract_account": "rContractAddress..."
}
```

Response includes: `contract_account`, `code`, `account_info`, `functions`, `source_code_uri`, `contract_data`, `user_data`.

### `event_history`

Retrieves historical event emissions.

```json
{
  "command": "event_history",
  "contract_account": "rContractAddress...",
  "events": ["counter_updated"],
  "limit": 100
}
```

### `eventEmitted` (WebSocket subscription)

Real-time event stream.

```json
{
  "command": "subscribe",
  "streams": ["eventEmitted"],
  "contract_account": "rContractAddress..."
}
```

## Contract Structure Requirements

XRPL smart contracts are Rust libraries compiled to `wasm32-unknown-unknown`. The `#[wasm_export]` macro from `xrpl-wasm-macros` handles export boilerplate, generating `extern "C"` wrappers with `#[unsafe(no_mangle)]` and automatic STParameter extraction:

```rust
#![cfg_attr(target_arch = "wasm32", no_std)]

use xrpl_wasm_macros::wasm_export;

#[wasm_export]
fn my_function(param: u32) -> i32 {
    // param is automatically extracted from STParameterValues
    0
}
```

The `[lib]` section in `Cargo.toml` must specify `crate-type = ["cdylib"]`.

## Related Specifications

| Spec | Description |
|---|---|
| [XLS-100](https://github.com/XRPLF/XRPL-Standards/discussions/270) | Smart Escrows (WASM-based escrow conditions) |
| [XLS-102](https://github.com/XRPLF/XRPL-Standards/discussions/272) | Inter-contract communication |
| [XLS-64](https://github.com/XRPLF/XRPL-Standards/discussions/188) | Multi-Purpose Tokens (MPTokens) |

## Developer Resources

- **WASM Standard Library**: https://github.com/Transia-RnD/craft (dangell/smart-contracts branch)
- **AlphaNet**: wss://alphanet.nerdnest.xyz (Network ID: 21465)
- **Faucet**: https://alphanet.faucet.nerdnest.xyz/accounts
- **Explorer**: https://alphanet.xrpl.org
- **Bedrock CLI**: https://github.com/XRPL-Commons/Bedrock
