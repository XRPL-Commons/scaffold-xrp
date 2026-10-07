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
    networkKey: next ? 'NEXT_PUBLIC_DEFAULT_NETWORK' : 'NUXT_PUBLIC_DEFAULT_NETWORK',
    walletKeys: next
      ? ['NEXT_PUBLIC_XAMAN_API_KEY', 'NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID']
      : ['NUXT_PUBLIC_XAMAN_API_KEY', 'NUXT_PUBLIC_WALLETCONNECT_PROJECT_ID'],
    networkValue: 'testnet',
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
        [`${run} test`, 'run payment regression tests'],
      ]
    : [
        [`${run} dev`, 'start the development server'],
        [`${run} build`, 'create a production build'],
        [`${run} generate`, 'generate a static site'],
        [`${run} preview`, 'preview the production build'],
        [`${run} lint`, 'run the linter'],
        [`${run} type-check`, 'check TypeScript and Vue types'],
        [`${run} test`, 'run payment regression tests'],
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

The starter includes wallet connection, account details, a Testnet/Devnet selector, and an XRP payment form. Enter the amount in XRP, with up to six decimal places; the form converts it to drops exactly. If the recipient requires a destination tag, enter it in the optional tag field.

${flattened ? '' : 'Run the application-specific scripts below from `apps/web`.\n'}
${scripts}

## Wallets and environment

The wallet header supports Xaman, GemWallet, and WalletConnect. Xaman uses \`${environment.walletKeys[0]}\`; WalletConnect uses \`${environment.walletKeys[1]}\`; GemWallet requires its browser extension and does not require an API key.

The generated examples use these files:

- Network and wallet settings: \`${environment.networkExample}\` (\`${environment.networkKey}=testnet\` or \`devnet\`).
- Wallet settings: \`${environment.walletExample}\` (\`${environment.walletKeys[0]}\` and \`${environment.walletKeys[1]}\`).
- Runtime environment: \`${environment.runtimeFile}\` (${options.framework === 'nuxt' ? 'Nuxt reads `.env` while running.' : 'Next.js reads `.env.local` while running.'})

Copy the example, then edit the runtime file:

~~~bash
cp ${environment.networkExample} ${environment.runtimeFile}
~~~

~~~dotenv
${environment.networkKey}=${environment.networkValue}
${environment.walletKeys[0]}=your_xaman_api_key_here
${environment.walletKeys[1]}=your_walletconnect_project_id_here
~~~

Testnet is the default; Devnet is also available. Fund your wallet using the [XRPL test faucets](https://xrpl.org/resources/dev-tools/xrp-faucets) and confirm the network before signing. These environment variables are public browser configuration. Never put API secrets or wallet seeds in them. Restart the development server after editing the environment file.

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

Configure \`${environment.runtimeFile}\` with \`${environment.networkKey}\`, \`${environment.walletKeys[0]}\`, and \`${environment.walletKeys[1]}\`. Xaman and WalletConnect need their public app identifiers; GemWallet works through its browser extension. Use test funds on XRPL Testnet or Devnet, and verify the destination, amount in XRP, and optional destination tag before signing.

${experimental ? 'This project includes experimental primitives. Use a Bedrock-compatible local or AlphaNet network for those transaction types; standard XRPL Testnet and Devnet may reject them.\n' : 'This project contains only conventional XRP Ledger starter functionality.\n'}
`;

  writeFileSync(join(projectDir, 'README.md'), readme);
  writeFileSync(join(projectDir, 'QUICKSTART.md'), quickstart);

  const staleReadme = join(projectDir, 'README-without-sc.md');
  if (existsSync(staleReadme)) rmSync(staleReadme);
}
