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

## pnpm installation regression

- [x] Reproduce installation with pnpm 11.22.0: ignored overrides plus ERR_PNPM_IGNORED_BUILDS on hidden stdout.
- [x] Preserve pnpm-workspace.yaml settings for flat projects, use allowBuilds, and stream installer output.
- [x] Verify fresh Next/Nuxt installs using pnpm. Additional CI coverage is prepared in an isolated branch; integration and pushes are held for the user’s manual review.

## Next wallet hydration regression

- [x] Identify the custom-element SSR boundary behind the reported derived-style mismatch.
- [x] Load the connector with SSR disabled; lint/build pass and production HTML contains the loading placeholder with no wallet custom element. Applied to existing manual-test projects as well.

## Next TypeScript starter

- [x] Convert Next application code to strict TypeScript, preserving the official React provider.
- [x] Update CLI generation, module detection, documentation, and checks for TypeScript files.
- [x] Verify CLI regression tests and freshly generated TypeScript default/experimental starters locally. PR updates remain on hold for manual developer-experience review.

Fresh Next and Nuxt projects now install through the CLI with pnpm 11.22.0 and pass lint, type checks where applicable, tests, and builds. Repaired the pnpm settings and installation in `/tmp/xrp-cli-testing/test` without changing application files.

Manual developer-experience review takes priority: finish and verify the local CLI, then wait for user feedback before further pushes or CI runs.

Local TypeScript verification: CLI tests (8) and type check passed. Generated default Next starter using pnpm 11.22.0 passed type check, lint, payment tests (11), and production build. Generated experimental Next starter using pnpm 10.34.6 and actual Bedrock initialization passed type check, lint, and production build. The rebuilt local CLI is ready at `packages/create-xrp/dist/index.js`; the default manual-test project is `/tmp/xrp-cli-testing/typescript-next`. No additional CI was triggered and no post-review changes were pushed.
