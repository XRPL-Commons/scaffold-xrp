# create-xrp

CLI tool to scaffold XRPL dApps with Next.js and smart contracts.

## Usage

```bash
npx create-xrp my-app
```

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

1. Prompts for project name and package manager preference
2. Clones the scaffold-xrp template from GitHub
3. Removes git history and CLI package
4. Updates package.json with your project name
5. Installs dependencies
6. Initializes a new git repository

## Development

To test locally:

```bash
# Build the CLI
pnpm build

# Link it globally
npm link

# Test it
create-xrp test-project
```

## Publishing

```bash
# Build
pnpm build

# Publish to npm
npm publish
```

## License

MIT
