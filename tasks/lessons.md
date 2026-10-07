# Lessons

- Experimental opt-in belongs in the CLI before smart primitive selection and Bedrock setup, not an in-app toggle.
- Keep the starter focused on XRP payments and Xaman, GemWallet, and WalletConnect; do not expand it into a feature showcase.
- The hackathon date does not drive scope. Verify the generated developer experience and supported workflows.

- Test generated projects with the recommended package manager as well as npm; repository pnpm pins can hide incompatibilities with the user’s global pnpm. Put pnpm settings in pnpm-workspace.yaml, not package.json.

- Web components can mutate their server-rendered attributes before React hydrates. Check third-party custom-element SSR compatibility and mount browser-only wallet widgets after hydration when necessary.

- Use TypeScript for the Next starter, including generated pages and application helpers; validate generated output with a type-check command.

- Let the user validate the generated developer experience before pushing further changes or triggering CI when they request that sequence. Keep fixes and verification local until their feedback.

- Treat the starter as a clean canvas: keep one clear wallet connection entry point, move setup instructions to the README, and avoid repeating onboarding text across cards.

- Show the network selector without a repeated visible “Network” label; retain its accessible name for screen readers.

- Reuse the provided XRP brand asset from the faucet project instead of approximating the logo with custom SVG paths.
