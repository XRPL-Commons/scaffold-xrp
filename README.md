# Scaffold-XRP

A Next.js-based development stack for building decentralized applications on XRPL with smart contracts. Built with Turborepo, inspired by Scaffold-ETH-2.

## Features

- **Next.js 14** - Modern React framework with App Router
- **Turborepo** - High-performance build system for monorepos
- **XRPL Integration** - Full XRPL client with WebSocket support
- **Multi-Wallet Support** - Connect with Xaman, Crossmark, GemWallet, or manual address
- **Network Switching** - Easy switching between AlphaNet, Testnet, and Devnet
- **Smart Contract Tools** - Deploy and interact with XRPL smart contracts
- **Faucet Integration** - Request test XRP directly from the UI
- **Transaction History** - View your transaction history with explorer links
- **Debug Panel** - Execute custom XRPL commands and view network info
- **Sample Contract** - Counter contract example in Rust

## Quick Start

### Prerequisites

- Node.js 18+ and pnpm 8+
- Rust (optional, for building contracts)

### Installation

\`\`\`bash
# Clone the repository
git clone https://github.com/yourusername/scaffold-xrp.git
cd scaffold-xrp

# Install dependencies
pnpm install

# Start the development server
pnpm dev
\`\`\`

The app will be available at [http://localhost:3000](http://localhost:3000)

## Project Structure

\`\`\`
scaffold-xrp/
├── apps/
│   └── web/                 # Next.js application
│       ├── app/             # Next.js App Router
│       ├── components/      # React components
│       └── lib/             # Utilities and configurations
├── packages/
│   └── bedrock/             # Smart contracts (Rust)
│       ├── src/
│       │   └── lib.rs       # Counter contract example
│       └── Cargo.toml
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
\`\`\`

## Usage

### Connecting Your Wallet

1. Click "Connect Wallet" in the header
2. Choose your wallet (Xaman, Crossmark, GemWallet) or enter address manually
3. Approve the connection in your wallet extension

### Getting Test XRP

1. Connect your wallet
2. Go to the "Faucet" section
3. Click "Request Test XRP"
4. Wait for the transaction to complete

### Deploying a Smart Contract

1. Build your contract (see [Building Contracts](#building-contracts))
2. Go to "Deploy Contract"
3. Upload your `.wasm` file
4. Confirm the transaction (requires 100 XRP fee)
5. Copy the contract address from the confirmation

### Interacting with Contracts

1. Go to "Interact with Contract"
2. Enter the contract address
3. Enter the function name (e.g., `increment`)
4. Add arguments if needed
5. Click "Call Contract Function"
6. Confirm the transaction in your wallet

## Building Contracts

### Install Rust

\`\`\`bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup target add wasm32-unknown-unknown
\`\`\`

### Build the Counter Contract

\`\`\`bash
cd packages/bedrock
cargo build --target wasm32-unknown-unknown --release
\`\`\`

The compiled WASM file will be at:
\`\`\`
target/wasm32-unknown-unknown/release/counter.wasm
\`\`\`

See [packages/bedrock/README.md](packages/bedrock/README.md) for more details.

## Development

### Available Commands

\`\`\`bash
pnpm dev          # Start development server
pnpm build        # Build all packages
pnpm lint         # Lint all packages
pnpm format       # Format code with Prettier
pnpm clean        # Clean build artifacts
\`\`\`

### Environment Variables

Create a `.env.local` file in `apps/web/`:

\`\`\`env
# Optional: Configure default network
NEXT_PUBLIC_DEFAULT_NETWORK=alphanet
\`\`\`

## Networks

### AlphaNet (Default)
- **WebSocket:** wss://alphanet.nerdnest.xyz
- **Network ID:** 21465
- **Faucet:** https://alphanet.faucet.nerdnest.xyz/accounts
- **Explorer:** https://alphanet.xrpl.org

### Testnet
- **WebSocket:** wss://s.altnet.rippletest.net:51233
- **Network ID:** 1
- **Faucet:** https://faucet.altnet.rippletest.net/accounts
- **Explorer:** https://testnet.xrpl.org

### Devnet
- **WebSocket:** wss://s.devnet.rippletest.net:51233
- **Network ID:** 2
- **Faucet:** https://faucet.devnet.rippletest.net/accounts
- **Explorer:** https://devnet.xrpl.org

## Components

### Core Components

- **Header** - Navigation with wallet connection and network switching
- **AccountInfo** - Display wallet address and balance
- **FaucetRequest** - Request test XRP from network faucet
- **ContractDeployment** - Upload and deploy WASM contracts
- **ContractInteraction** - Call contract functions
- **TransactionHistory** - View transaction history
- **DebugPanel** - Execute custom XRPL commands

### Providers

- **XRPLProvider** - Global state for XRPL connection, wallet, and network

## Technologies

- [Next.js 14](https://nextjs.org/)
- [React 18](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Turborepo](https://turbo.build/)
- [xrpl.js](https://js.xrpl.org/)
- [Bedrock](https://github.com/XRPL-Commons/Bedrock)

## Resources

- [XRPL Documentation](https://xrpl.org/)
- [XRPL Smart Contracts Guide](https://xrpl.org/docs.html)
- [Bedrock GitHub](https://github.com/XRPL-Commons/Bedrock)
- [Scaffold-ETH-2](https://github.com/scaffold-eth/scaffold-eth-2)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details

## Acknowledgments

- Inspired by [Scaffold-ETH-2](https://github.com/scaffold-eth/scaffold-eth-2)
- Built for the XRPL community
- Uses [Bedrock](https://github.com/XRPL-Commons/Bedrock) for smart contract development
