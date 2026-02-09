# Scaffold-XRP

A starter kit for building decentralized applications on the XRP Ledger. Inspired by Scaffold-ETH-2.

## Features

- **Multi-Wallet Support** - Connect with Xaman, Crossmark, GemWallet, or manual address
- **Network Switching** - Easy switching between AlphaNet, Testnet, and Devnet
- **XRPL Integration** - Full XRPL client with WebSocket support
- **Faucet Integration** - Request test XRP directly from the UI
- **Transaction History** - View your transaction history with explorer links

## Quick Start

### Prerequisites

- Node.js 18+

### Installation

```
# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000)

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

### Sending Transactions

1. Connect your wallet
2. Enter a destination address and amount
3. Click "Send XRP"
4. Approve the transaction in your wallet

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

## Resources

- [XRPL Documentation](https://xrpl.org/)
- [Scaffold-ETH-2](https://github.com/scaffold-eth/scaffold-eth-2)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details

## Acknowledgments

- Inspired by [Scaffold-ETH-2](https://github.com/scaffold-eth/scaffold-eth-2)
- Built for the XRPL community
