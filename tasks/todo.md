# Hackathon starter implementation

## Agreed scope

Create a polished, simple Next.js or Nuxt project with XRP payments, Xaman, GemWallet, and WalletConnect. Default to Testnet and offer Devnet. The CLI asks whether to use experimental features (default no), then asks which smart primitives to include and sets up Bedrock when selected. No in-app experimental toggle.

## Plan

- [ ] Migrate Next to xrpl-connect v1 React bindings; clean payment UI, network handling, validation, and wallet setup.
- [ ] Migrate Nuxt to xrpl-connect v1 Vue bindings with equivalent behavior.
- [ ] Fix CLI experimental selection, reproducible template packaging, generated documentation, error handling, and type errors.
- [ ] Align dependencies, Node requirements, lint/type-check commands, lockfile, and contributor documentation.
- [ ] Verify clean installs, builds, lint, type checks, CLI generation, meaningful regression tests, and browser behavior.
- [ ] Review integrated diff, commit, push, and open a pull request.

## Verification requirements

Verify both framework starters generated from the packaged CLI. Default output must omit smart UI and Bedrock. Experimental selection must produce selected smart UI and Bedrock setup, clearly explaining experimental network limitations. Setup/install errors must fail honestly. Wallet setup must handle missing configuration, connection cancellation, account/network changes, and submission errors without falsely claiming ledger success.

## Review

Implementation in progress in an isolated worktree. Original checkout and its uncommitted CLI version edit remain preserved.
