import { existsSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import type { Framework, PackageManager } from './options.js';
import type { Primitive } from './types.js';

interface ProjectDocumentationOptions {
  projectDir: string;
  projectName: string;
  framework: Framework;
  packageManager: PackageManager;
  primitives: Primitive[];
  flattened: boolean;
}

interface EnvironmentDocumentation {
  networkExample: string;
  walletExample: string;
  runtimeFile: string;
  networkKey: string;
  walletKeys: [string, string];
  networkValue: string;
}

function runCommand(packageManager: PackageManager): string {
  return packageManager === 'npm' ? 'npm run' : packageManager;
}

function appPath(options: ProjectDocumentationOptions): string {
  return options.flattened ? '.' : 'apps/web';
}

function frameworkName(framework: Framework): string {
  return framework === 'nextjs' ? 'Next.js' : 'Nuxt';
}

function environmentDocumentation(options: ProjectDocumentationOptions): EnvironmentDocumentation {
  const app = appPath(options);
  const prefix = app === '.' ? '' : `${app}/`;
  const next = options.framework === 'nextjs';

  return {
    networkExample: `${prefix}.env.example`,
    walletExample: `${prefix}.env.local.example`,
    runtimeFile: next ? `${prefix}.env.local` : `${prefix}.env`,
    networkKey: next ? 'NEXT_PUBLIC_DEFAULT_NETWORK' : 'VITE_DEFAULT_NETWORK',
    walletKeys: next
      ? ['NEXT_PUBLIC_XAMAN_API_KEY', 'NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID']
      : ['VITE_XAMAN_API_KEY', 'VITE_WALLETCONNECT_PROJECT_ID'],
    networkValue: 'alphanet',
  };
}

function experimentalSection(primitives: Primitive[]): string {
  if (primitives.length === 0) return '';
  const names: Record<Primitive, string> = {
    contract: 'smart contract calls',
    vault: 'Bedrock smart vaults',
    escrow: 'Bedrock programmable escrow',
  };
  const commands = primitives
    .map((primitive) => `- ${names[primitive]}`)
    .join('\n');

  return `
## Experimental features

This project explicitly opted into the following experimental features:

${commands}

These transaction types require a Bedrock-compatible local or AlphaNet environment. Standard XRPL Testnet and Devnet may reject experimental contract, vault, or programmable escrow transactions. Review every transaction in your wallet before signing.

Build and deploy contracts from \`packages/bedrock\` with the Bedrock CLI. The generated UI is a starting point and does not validate contract ABI or network support for you.
`;
}

function scriptsSection(run: string, framework: Framework): string {
  const scripts = framework === 'nextjs'
    ? [
        [`${run} dev`, 'start the development server'],
        [`${run} build`, 'create a production build'],
        [`${run} start`, 'serve the production build'],
        [`${run} lint`, 'run the linter'],
      ]
    : [
        [`${run} dev`, 'start the development server'],
        [`${run} build`, 'create a production build'],
        [`${run} generate`, 'generate a static site'],
        [`${run} preview`, 'preview the production build'],
        [`${run} lint`, 'run the linter'],
      ];

  return `## Scripts\n\n${scripts.map(([command, description]) => `- \`${command}\` - ${description}`).join('\n')}\n`;
}

export function writeProjectDocumentation(options: ProjectDocumentationOptions): void {
  const { projectDir, projectName, packageManager, primitives, flattened } = options;
  const app = appPath(options);
  const run = runCommand(packageManager);
  const install = `${packageManager} install`;
  const framework = frameworkName(options.framework);
  const environment = environmentDocumentation(options);
  const experimental = experimentalSection(primitives);
  const scripts = scriptsSection(run, options.framework);

  const readme = `# ${projectName}

Build an XRP Ledger dApp with ${framework} and Scaffold-XRP.

Requires Node.js \`^22.18.0 || >=24.11.0\`.

## Quick start

~~~bash
${install}
${run} dev
~~~

Open [http://localhost:3000](http://localhost:3000).

The starter includes wallet connection, account details, and an XRP payment form. The payment amount is entered in drops (\`1 XRP = 1,000,000 drops\`). When a recipient requires a \`DestinationTag\`, include it in the Payment payload and preserve the exchange or custodian's value exactly before signing.

${scripts}

## Wallets and environment

The wallet header supports Xaman, GemWallet, and WalletConnect. Xaman uses \`${environment.walletKeys[0]}\`; WalletConnect uses \`${environment.walletKeys[1]}\`; GemWallet is a browser wallet and does not require an API key. Crossmark and Otsu are also available when their browser extensions are installed.

The generated examples use these files:

- Network settings: \`${environment.networkExample}\` (\`${environment.networkKey}=...\`, optional AlphaNet endpoint variables are documented there).
- Wallet settings: \`${environment.walletExample}\` (\`${environment.walletKeys[0]}\` and \`${environment.walletKeys[1]}\`).
- Runtime environment: \`${environment.runtimeFile}\` (${options.framework === 'nuxt' ? 'Nuxt reads `.env` while running.' : 'Next.js reads `.env.local` while running.'})

Start with the network example, then add the wallet values to the runtime file:

~~~bash
cp ${environment.networkExample} ${environment.runtimeFile}
${environment.networkKey}=${environment.networkValue}
${environment.walletKeys[0]}=your_xaman_api_key_here
${environment.walletKeys[1]}=your_walletconnect_project_id_here
~~~

The conventional XRP payment starter can use XRPL Testnet or Devnet with test funds. Confirm the selected network in the wallet before signing. Keep wallet seeds and API keys out of source control.

${experimental ? 'Experimental features are opt-in and described below.' : 'Advanced contract features are omitted from this starter. Re-run create-xrp with --experimental and --primitives to include them.'}
${experimental}
## Project structure

- \`${app}/\` - ${framework} application
${flattened ? '' : '- \`packages/\` - supporting packages and optional Bedrock contracts\n'}- \`.scaffold-xrp.json\` - generated framework and feature metadata
`;

  const quickstart = `# Quick start

Requires Node.js \`^22.18.0 || >=24.11.0\`.

Install dependencies and start the ${framework} app:

~~~bash
${install}
${run} dev
~~~

Configure \`${environment.runtimeFile}\` with \`${environment.networkKey}\`, \`${environment.walletKeys[0]}\`, and \`${environment.walletKeys[1]}\`. Xaman and WalletConnect need those credentials; GemWallet works through its browser extension. Use test funds on XRPL Testnet or Devnet, and verify the destination, amount in drops, and any DestinationTag before signing.

${experimental ? 'This project includes experimental primitives. Use a Bedrock-compatible local or AlphaNet network for those transaction types; standard XRPL Testnet and Devnet may reject them.\n' : 'This project contains only conventional XRP Ledger starter functionality.\n'}
`;

  writeFileSync(join(projectDir, 'README.md'), readme);
  writeFileSync(join(projectDir, 'QUICKSTART.md'), quickstart);

  const staleReadme = join(projectDir, 'README-without-sc.md');
  if (existsSync(staleReadme)) rmSync(staleReadme);
}
