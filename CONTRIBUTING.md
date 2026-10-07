# Contributing

## Setup

Use Node.js 22.18+ on the 22.x line, or Node.js 24.11+, and the pnpm version pinned in `package.json`.

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm --filter web dev
# or: pnpm --filter web-nuxt dev
```

Next and Nuxt should provide the same default wallet/account/payment experience. Experimental features belong behind the CLI opt-in and should not appear in the default template.

## Verification

```sh
pnpm lint
pnpm type-check
pnpm test
pnpm build
```

Use meaningful regression tests for transaction validation, wallet lifecycle, and CLI generation. Never claim an external wallet flow was verified solely because a build or mocked test passed.

The CLI build packages templates from the repository's current app sources. CLI builds and generation tests are not cached, so changes to either app always appear in the next generated project and its verification.

## Check the distributable

Build the CLI, pack it, and test the resulting tarball from an empty temporary directory. Test both Next.js and Nuxt using the normal non-experimental path. Install dependencies and run each generated app's lint, type check, tests, and production build. Check that the project README and environment example match the chosen framework.

The packaged starter smoke test accepts the framework, package manager, and an optional pnpm version:

```sh
node scripts/verify-starter.mjs nextjs npm
node scripts/verify-starter.mjs nuxt npm
node scripts/verify-starter.mjs nextjs pnpm 10.34.6
```

For pnpm checks, the requested version is installed in a temporary directory and placed first on the child process `PATH`; the global pnpm installation is unchanged. The test verifies the generated lockfile and pnpm workspace build approvals before running lint, type checking, tests, and the production build. CI runs both frameworks with npm, pnpm 10.34.6, and pnpm 11.22.0.

Also test the experimental opt-in with Bedrock available: selected components and a Bedrock project should be created, while an ordinary starter should contain neither. A failed setup or dependency installation must exit with a failure and must not claim that project creation succeeded.

Verify the browser UI disconnected and connected, switching Testnet/Devnet, signing cancellation, and failed submissions. A live wallet check needs the configured Xaman/WalletConnect app identifiers or an installed GemWallet extension.

## Pull requests and releases

Keep changes focused, explain the resulting behavior, and include exact verification results and any unverified external integrations. Preserve user changes when working in shared checkouts.

Before publishing, rerun the distributable checks from the final commit and inspect the package contents for generated build artifacts or private environment files. Publish only with explicit release authorization.

Contributions are licensed under the repository's MIT license.
