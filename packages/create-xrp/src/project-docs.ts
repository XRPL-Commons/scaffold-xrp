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

function runCommand(packageManager: PackageManager): string {
  return packageManager === 'npm' ? 'npm run' : packageManager;
}

function appPath(options: ProjectDocumentationOptions): string {
  return options.flattened ? '.' : 'apps/web';
}

function frameworkName(framework: Framework): string {
  return framework === 'nextjs' ? 'Next.js' : 'Nuxt';
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

export function writeProjectDocumentation(options: ProjectDocumentationOptions): void {
  const { projectDir, projectName, packageManager, primitives, flattened } = options;
  const app = appPath(options);
  const run = runCommand(packageManager);
  const install = `${packageManager} install`;
  const envExample = app === '.' ? '.env.local.example' : `${app}/.env.local.example`;
  const envTarget = app === '.' ? '.env.local' : `${app}/.env.local`;
  const framework = frameworkName(options.framework);
  const experimental = experimentalSection(primitives);

  const readme = `# ${projectName}

Build an XRP Ledger dApp with ${framework} and Scaffold-XRP.

## Quick start

~~~bash
${install}
${run} dev
~~~

Open [http://localhost:3000](http://localhost:3000).

The starter includes wallet connection, account details, and an XRP payment form. Copy the example environment file before configuring optional wallet integrations:

~~~bash
cp ${envExample} ${envTarget}
~~~

${experimental ? 'Experimental features are opt-in and described below.' : 'Advanced contract features are omitted from this starter. Re-run create-xrp with --experimental and --primitives to include them.'}
${experimental}
## Project structure

- \`${app}/\` - ${framework} application
${flattened ? '' : '- \`packages/\` - supporting packages and optional Bedrock contracts\n'}- \`.scaffold-xrp.json\` - generated framework and feature metadata
`;

  const quickstart = `# Quick start

Install dependencies and start the ${framework} app:

~~~bash
${install}
${run} dev
~~~

Connect a wallet, verify the displayed network, and use the payment form with test funds. Keep wallet seeds and API keys out of source control.

${experimental ? 'This project includes experimental primitives. Use a Bedrock-compatible local or AlphaNet network for those transaction types; standard XRPL Testnet and Devnet may reject them.\n' : 'This project contains only conventional XRP Ledger starter functionality.\n'}
`;

  writeFileSync(join(projectDir, 'README.md'), readme);
  writeFileSync(join(projectDir, 'QUICKSTART.md'), quickstart);

  const staleReadme = join(projectDir, 'README-without-sc.md');
  if (existsSync(staleReadme)) rmSync(staleReadme);
}
