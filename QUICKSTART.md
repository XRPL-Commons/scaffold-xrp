# Quick Start Guide

Get started with Scaffold-XRP in 5 minutes!

## Prerequisites

- Node.js 18 or higher
- pnpm 8 or higher

## Installation

```bash
# Clone the repository
git clone https://github.com/XRPL-Commons/scaffold-xrp.git
cd scaffold-xrp

# Install dependencies
pnpm install

# Start the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## First Steps

### 1. Connect Your Wallet

Click the "Connect Wallet" button in the header and choose:
- **Xaman** - If you have Xaman wallet extension
- **Crossmark** - If you have Crossmark wallet extension
- **GemWallet** - If you have GemWallet extension
- **Manual** - Enter any XRPL address to view (read-only)

### 2. Get Test XRP

1. Make sure you're on **AlphaNet** (check the network switcher in the header)
2. Scroll to the "Faucet" section
3. Click "Request Test XRP"
4. Wait a few seconds for your balance to update

You'll receive 1000 XRP on AlphaNet for testing!

### 3. Deploy Your First Contract

The project includes a sample counter contract in `packages/bedrock/`, built according to the [XLS-101d specification](https://github.com/XRPLF/XRPL-Standards/discussions/271) for XRPL smart contracts.

#### Build the Contract

```bash
# Install Rust (if not already installed)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup target add wasm32-unknown-unknown

# Build the counter contract
cd packages/bedrock
bedrock build --release
```

The compiled WASM file will be at:
```
packages/bedrock/contract/target/wasm32-unknown-unknown/release/bedrock.wasm
```

#### Deploy via UI

1. Go to the "Deploy Contract" section
2. Click "Upload WASM File" and select `counter.wasm`
3. Review the contract code (displayed in hex)
4. Click "Deploy Contract"
5. Approve the transaction in your wallet (requires 100 XRP fee)
6. Copy the contract address from the confirmation

### 4. Interact with Your Contract

The counter contract exposes functions via XLS-101 ContractCall transactions:

1. Go to the "Interact with Contract" section
2. Paste your contract address
3. Click "Load Counter Example" or enter a function name:
   - `get_count` - Get current counter value
   - `increment` - Increase counter by 1
   - `decrement` - Decrease counter by 1
   - `set_count` - Set counter to a specific value (pass value as argument)
   - `add` - Add an amount to counter (pass amount as argument)
   - `subtract` - Subtract an amount from counter (pass amount as argument)
   - `reset` - Reset to 0
4. Click "Call Contract Function"
5. Approve the transaction in your wallet

See [docs/xls-101-reference.md](docs/xls-101-reference.md) for full specification details.

### 5. Explore the Debug Panel

The debug panel on the right shows:
- Current network information
- Your wallet details
- Connection status

Try executing custom XRPL commands:
1. Click one of the example buttons (Server Info, Account Info, Ledger)
2. Or write your own JSON command
3. Click "Execute Command"
4. View the results

## What's Next?

- Read the [full README](README.md) for detailed documentation
- Check out [packages/bedrock/README.md](packages/bedrock/README.md) for contract development
- Explore the source code in `apps/web/components/`
- Switch networks using the network switcher
- View your transaction history with explorer links

## Need Help?

- Check the [XRPL Documentation](https://xrpl.org/)
- Read the [XLS-101 Reference](docs/xls-101-reference.md)
- Visit the [Bedrock GitHub](https://github.com/XRPL-Commons/Bedrock)
- Review the [Contributing Guide](CONTRIBUTING.md)

## Common Issues

### Wallet Not Detected
Make sure you have the wallet extension installed and unlocked.

### Transaction Failed
- Check you have sufficient XRP balance
- Verify you're on the correct network
- Try refreshing your balance

### Build Errors
```bash
# Clean and reinstall
pnpm clean
rm -rf node_modules
pnpm install
```

Happy building on XRPL! 🚀
