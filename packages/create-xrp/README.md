# create-xrp

CLI tool to scaffold polished XRPL payment apps with Next.js or Nuxt.

The default project contains account, payment, and header components. Experimental
Bedrock primitives are opt-in so a new project does not depend on experimental
network support.

## Usage

```bash
npx create-xrp my-app
```

The CLI asks whether to enable experimental features. Answering no creates the
standard payment starter. To choose every option non-interactively:

```bash
# Standard starter
npx create-xrp my-app --framework nextjs --pm npm --no-experimental

# Experimental starter with selected Bedrock primitives
npx create-xrp my-app --framework nextjs --pm pnpm \
  --experimental --primitives contract,vault
```

`--experimental` is required before `--primitives`. Available primitives are
`contract`, `vault`, and `escrow`. Experimental contracts require a Bedrock-
compatible local network or AlphaNet; standard XRPL Testnet and Devnet may
reject them. Use `--skip-install` when dependencies will be installed later.

Or use any package manager:

```bash
# npm
npx create-xrp my-app

# pnpm
pnpm create xrp my-app

# yarn
yarn create xrp my-app
```

## What it does

1. Prompts for project name, framework, package manager, and experimental features
2. Copies the packaged scaffold snapshot (without fetching a GitHub branch)
3. Removes the CLI package and unselected feature modules
4. Updates package.json with your project name
5. Installs dependencies unless `--skip-install` is set
6. Initializes a new git repository

## Development

To test locally:

```bash
# Build the CLI
pnpm build

# Link it globally
npm link

# Test it
create-xrp test-project --framework nextjs --pm npm --no-experimental
```

`pnpm build` refreshes the packaged snapshot from the repository before compiling
the CLI. The snapshot is included in the npm tarball so published generations
are reproducible.

## Publishing

```bash
# Build
pnpm build

# Publish to npm
npm publish
```

## License

MIT
