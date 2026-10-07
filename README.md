# Scaffold-XRP

Create a Next.js or Nuxt application for the XRP Ledger. The default starter includes wallet connection, account details, a Testnet/Devnet selector, and an XRP payment form.

## Create a project

Use Node.js 22.18+ on the 22.x line, or Node.js 24.11+. Choose npm, pnpm, or Yarn during setup.

```sh
npx create-xrp my-app
cd my-app
npm run dev # or pnpm dev / yarn dev, matching your selection
```

Choose your framework and package manager. Leave **Use experimental features?** disabled for the payment starter. The CLI installs dependencies and prints the command to start your app.

The CLI ships its template files with each release. Creating a project does not clone a moving GitHub branch.

## Configure wallets

The starter uses `xrpl-connect` v1 with its official React or Vue bindings. It supports **Xaman**, **GemWallet**, and **WalletConnect**.

Copy the generated `.env.example` to the environment file described in the project's README. Configure your own public app identifiers:

| Setting | Next.js | Nuxt |
| --- | --- | --- |
| Xaman API key | `NEXT_PUBLIC_XAMAN_API_KEY` | `NUXT_PUBLIC_XAMAN_API_KEY` |
| WalletConnect project ID | `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | `NUXT_PUBLIC_WALLETCONNECT_PROJECT_ID` |
| Default network | `NEXT_PUBLIC_DEFAULT_NETWORK` | `NUXT_PUBLIC_DEFAULT_NETWORK` |

GemWallet needs an installed browser extension and does not need an app identifier. Xaman and WalletConnect require their respective identifiers before they are available. These variables are public browser configuration: do not put API secrets or wallet seeds in them. Restart the development server after changing environment configuration.

See the [XRPL Connect setup guide](https://xrpl-commons.github.io/xrpl-connect/guide/getting-started.html) for wallet registration and configuration.

## Send a test payment

1. Start the app and choose **Testnet** (the default) or **Devnet**.
2. Connect a supported wallet configured for the same network.
3. Fund the wallet using the [XRPL test faucets](https://xrpl.org/resources/dev-tools/xrp-faucets).
4. Enter a destination address, an amount in XRP, and a destination tag if the recipient requires one.
5. Review the transaction in your wallet and approve it.

The UI reports submission separately from ledger validation. Testnet and Devnet XRP have no monetary value, and those networks may reset. Mainnet is not offered by this starter.

## Experimental smart features

Enable **Use experimental features?** in the CLI to choose smart contracts, vaults, or escrow and set up a Bedrock project. These projects keep an `apps/web` and `packages/bedrock` layout; ordinary payment projects are a single framework application.

Experimental selections require Bedrock and its build prerequisites. They use the XRPL Commons client fork and need a compatible experimental ledger. Selecting Testnet or Devnet does not enable smart-contract support. The generated README explains the selected setup; experimental components are starting points for development, not a compatibility guarantee for every wallet or network.

There is no experimental toggle in the running app. The CLI makes this project choice before generating files.

## Work on this repository

```sh
git clone https://github.com/XRPL-Commons/scaffold-xrp.git
cd scaffold-xrp
corepack enable
pnpm install --frozen-lockfile
pnpm --filter web dev       # Next.js
# or
pnpm --filter web-nuxt dev  # Nuxt
```

The repository pins pnpm in `package.json`. Run one app at a time on the default development port, or supply a different port when running both.

```sh
pnpm lint
pnpm type-check
pnpm test
pnpm build
```

- `apps/web`: Next.js starter and React bindings.
- `apps/web-nuxt`: Nuxt starter and Vue bindings.
- `packages/create-xrp`: CLI, template packaging, and generation tests.
- `packages/bedrock`: reference Bedrock project.

See [CONTRIBUTING.md](CONTRIBUTING.md) for package testing and the release checklist, and [QUICKSTART.md](QUICKSTART.md) for the shortest setup path.

## License

MIT. Inspired by Scaffold-ETH and built for the XRPL community.
