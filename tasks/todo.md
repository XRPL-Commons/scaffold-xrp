# Hackathon starter implementation

## Agreed scope

Create a polished, simple Next.js or Nuxt project with XRP payments, Xaman, GemWallet, and WalletConnect. Default to Testnet and offer Devnet. The CLI asks whether to use experimental features (default no), then asks which smart primitives to include and sets up Bedrock when selected. No in-app experimental toggle.

## Plan

- [x] Migrate Next to xrpl-connect v1 React bindings; clean payment UI, network handling, validation, and wallet setup.
- [x] Migrate Nuxt to xrpl-connect v1 Vue bindings with equivalent behavior.
- [x] Fix CLI experimental selection, reproducible template packaging, generated documentation, error handling, and type errors.
- [x] Align dependencies, Node requirements, lint/type-check commands, lockfile, and contributor documentation.
- [x] Verify clean installs, builds, lint, type checks, CLI generation, regression tests, and production HTTP responses; document unavailable browser verification.
- [x] Review integrated diff and prepare commits.
- [x] Push signed commits and open [PR #16](https://github.com/XRPL-Commons/scaffold-xrp/pull/16).

## Verification requirements

Verify both framework starters generated from the packaged CLI. Default output must omit smart UI and Bedrock. Experimental selection must produce selected smart UI and Bedrock setup, clearly explaining experimental network limitations. Setup/install errors must fail honestly. Wallet setup must handle missing configuration, connection cancellation, account/network changes, and submission errors without falsely claiming ledger success.

## Review

Implemented in an isolated worktree. The original checkout and its uncommitted CLI version edit remain preserved.

Passed:

- Frozen workspace install, lint, type checks, regression tests, and production builds.
- Next payment tests (11), Nuxt payment tests (12), and CLI packaging/generation/error tests (8).
- Fresh Next and Nuxt projects generated from the packed CLI: npm install, lint, applicable type checks, tests, and production builds.
- Actual Bedrock initialization with contract, vault, and escrow; generated experimental Next project install, lint, and build.
- Production HTTP responses from both apps; Next contains the payment UI and network choices. Nuxt serves its client-rendered application shell. Next output includes page metadata.
- Production dependency audit: zero reported advisories.

Limits:

- Browser runtime had no connections (`agent.browsers.list()` returned an empty list). Interactive browser behavior and real Xaman, GemWallet, and WalletConnect signing/approvals have not been verified.
- Full dependency audit still reports four high and two critical development-tool advisories through Nuxt tooling and the Next ESLint plugin. Compatible dependency overrides were applied. Nuxt devtools are disabled; forcing patched simple-git v4 broke Nuxt initialization and was reverted. The remaining node-forge and braces advisories had no patched version available in the installed dependency paths. A clean production dependency audit does not imply a clean development dependency audit.
