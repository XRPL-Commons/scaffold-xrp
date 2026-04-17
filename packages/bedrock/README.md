# bedrock

XRPL Smart Contract project aligned with [XLS-101d](https://github.com/XRPLF/XRPL-Standards/discussions/271).

## Getting Started

### Build the contract
```bash
bedrock build --release
```

### Start local node
```bash
bedrock node start
```

### Deploy
```bash
bedrock deploy --network local
```

## Project Structure

- `contract/` - Smart contract source code (Rust, compiled to WASM)
- `bedrock.toml` - Project configuration
- `.bedrock/node-config/` - Local node configuration (genesis, validators, xrpld.cfg)
- `.wallets/` - Local wallet storage (git-ignored)

## XLS-101 Compliance

This contract follows the [XLS-101d specification](https://github.com/XRPLF/XRPL-Standards/discussions/271) for XRPL smart contracts.

### Contract Structure

All exported functions use the `#[wasm_export]` macro from `xrpl-wasm-macros`, which generates the required `extern "C"` wrapper with `#[unsafe(no_mangle)]` and automatic STParameter extraction:

```rust
use xrpl_wasm_macros::wasm_export;

#[wasm_export]
fn my_function(param: u32) -> i32 {
    // Parameters are automatically extracted from STParameterValues
    0 // SUCCESS
}
```

The crate type must be `cdylib` in `Cargo.toml`:
```toml
[lib]
crate-type = ["cdylib"]
```

### ABI Format

The ABI is generated at build time to `contract/build/abi.json`. It uses the XLS-101 STParameters format with typed parameters:

```json
{
  "spec": "XLS-101d",
  "contract_name": "bedrock",
  "lifecycle": ["init", "user_delete", "clawback"],
  "functions": [
    {
      "name": "add",
      "description": "Adds a specific amount to the counter.",
      "parameters": [
        { "name": "amount", "type": "UInt32", "description": "The amount to add." }
      ],
      "returns": "Int32"
    }
  ]
}
```

Constraints: maximum 4 parameters per function, all parameters mandatory, only valid XRPL STypes allowed.

### Lifecycle Callbacks

The contract implements three optional lifecycle callbacks:

| Callback | Triggered By | Purpose |
|---|---|---|
| `init()` | ContractCreate | Initialize contract state on deployment |
| `user_delete()` | ContractUserDelete | Handle user data removal |
| `clawback()` | ContractClawback | Respond to token clawbacks |

### WASM Standard Library

This contract uses `xrpl-wasm-std` and `xrpl-wasm-macros` from [Transia-RnD/craft](https://github.com/Transia-RnD/craft) (dangell/smart-contracts branch), which provides:

- `#[wasm_export]` macro for automatic function export and parameter extraction
- `get_current_contract_call()` - Access current transaction context
- `get_data()` / `set_data()` - Persistent ContractData storage
- `trace()` - Debug logging

See [docs/xls-101-reference.md](../../docs/xls-101-reference.md) for the full specification reference.
