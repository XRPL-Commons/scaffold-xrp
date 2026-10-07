# Quick start

Use Node.js 22.18+ on the 22.x line, or Node.js 24.11+.

```sh
npx create-xrp my-app
cd my-app
```

Choose Next.js or Nuxt, choose your package manager, and leave experimental features disabled for the payment starter.

1. Follow the generated README to copy `.env.example` and configure a Xaman API key or WalletConnect project ID. GemWallet works without an app identifier when its browser extension is installed.
2. Start with `npm run dev`, `pnpm dev`, or `yarn dev`, matching the package manager you selected.
3. Open the local URL printed by the development server.
4. Choose Testnet or Devnet and connect a wallet on that network.
5. Fund the wallet with the [XRPL test faucets](https://xrpl.org/resources/dev-tools/xrp-faucets), then use **Send XRP**.

To work on experimental smart features, opt in during CLI setup and select the primitives you need. The CLI then sets up a Bedrock project. Experimental transactions require a compatible ledger; they are not supported merely by choosing Testnet or Devnet.

For repository development, wallet configuration, and verification commands, see [README.md](README.md).
