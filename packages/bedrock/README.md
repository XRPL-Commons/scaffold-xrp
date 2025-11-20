# Bedrock Smart Contracts

This directory contains XRPL smart contracts written in Rust for deployment to the XRPL AlphaNet.

## Overview

Bedrock is a development tool for XRPL smart contracts, similar to Foundry for Ethereum. This package is a placeholder structure for when Bedrock becomes available.

## Counter Contract

The `counter` contract is a simple example that demonstrates:
- State storage
- Public functions for contract interaction
- WASM compilation for XRPL

### Functions

- `increment()` - Increases the counter by 1 and returns the new value
- `decrement()` - Decreases the counter by 1 (minimum 0) and returns the new value
- `get_value()` - Returns the current counter value
- `reset()` - Resets the counter to 0
- `set_value(value)` - Sets the counter to a specific value

## Building Contracts

### Prerequisites

Install Rust and the wasm32 target:

\`\`\`bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup target add wasm32-unknown-unknown
\`\`\`

### Build

\`\`\`bash
cd packages/bedrock
cargo build --target wasm32-unknown-unknown --release
\`\`\`

The compiled WASM file will be at:
\`\`\`
target/wasm32-unknown-unknown/release/counter.wasm
\`\`\`

### Optimize (Optional)

For smaller contract sizes, use wasm-opt:

\`\`\`bash
wasm-opt -Oz -o counter_optimized.wasm target/wasm32-unknown-unknown/release/counter.wasm
\`\`\`

## Deploying Contracts

1. Build your contract using the steps above
2. Go to the Scaffold-XRP web interface
3. Click on "Deploy Contract"
4. Upload your `.wasm` file
5. Confirm the transaction in your wallet

**Note:** Contract deployment requires 100 XRP as a fee on AlphaNet.

## Contract Interaction

After deploying, you can interact with your contract:

1. Copy the contract address from the deployment confirmation
2. Go to "Interact with Contract"
3. Enter the contract address
4. Enter a function name (e.g., `increment`)
5. Add arguments if needed (optional)
6. Confirm the transaction in your wallet

## Development Guidelines

### Contract Structure

All XRPL smart contracts should:
- Use `#![cfg_attr(target_arch = "wasm32", no_std)]` for no_std compilation
- Include a panic handler for wasm32 target
- Export functions with `#[no_mangle]` and `extern "C"`
- Be compiled to wasm32-unknown-unknown target

### Example Contract Template

\`\`\`rust
#![cfg_attr(target_arch = "wasm32", no_std)]

#[cfg(target_arch = "wasm32")]
use core::panic::PanicInfo;

#[cfg(target_arch = "wasm32")]
#[panic_handler]
fn panic(_info: &PanicInfo) -> ! {
    loop {}
}

#[no_mangle]
pub extern "C" fn my_function() -> u32 {
    // Your contract logic here
    42
}
\`\`\`

## Future Integration

When Bedrock is officially released, this package will be updated with:
- Bedrock CLI integration
- Testing framework
- Deployment scripts
- Contract templates
- Development tools

## Resources

- [XRPL Smart Contracts Documentation](https://xrpl.org/)
- [Bedrock GitHub](https://github.com/XRPL-Commons/Bedrock)
- [XRPL AlphaNet](https://alphanet.xrpl.org)

## Testing

Currently, testing is done manually through the web interface. Future versions will include:
- Unit tests
- Integration tests
- Local network testing
