/**
 * Bedrock CLI detection, installation, and project initialization
 */

import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { execFileSync } from 'child_process';
import { join } from 'path';
import { mkdirSync, existsSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';
import type { Primitive } from './types.js';

const BEDROCK_INSTALL_URL =
  'https://raw.githubusercontent.com/XRPL-Commons/Bedrock/main/install.sh';

/**
 * Check if Bedrock CLI is installed and available in PATH
 */
export function isBedrockInstalled(): boolean {
  try {
    execFileSync('bedrock', ['help'], { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Prompt user and install Bedrock CLI via the official install script.
 * Returns true if bedrock is available after this function completes.
 */
export async function ensureBedrock(): Promise<boolean> {
  if (isBedrockInstalled()) {
    return true;
  }

  console.log(
    chalk.yellow(
      '\nBedrock CLI is required for smart contract, vault, and escrow support.'
    )
  );
  console.log(
    chalk.gray(
      `It will be installed from: ${BEDROCK_INSTALL_URL}\n`
    )
  );

  const { install } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'install',
      message: 'Install Bedrock CLI now? (may require sudo)',
      default: true,
    },
  ]);

  if (!install) {
    console.log(chalk.yellow('\nSkipping Bedrock installation.'));
    console.log(
      chalk.gray(
        'You can install it later with:\n  curl -sSfL ' +
          BEDROCK_INSTALL_URL +
          ' | sh\n'
      )
    );
    return false;
  }

  const spinner = ora('Downloading Bedrock installer...').start();
  const tmpScript = join(tmpdir(), `bedrock-install-${randomUUID()}.sh`);
  try {
    // Download to a temp file instead of piping curl | sh directly
    execFileSync('curl', ['-sSfL', BEDROCK_INSTALL_URL, '-o', tmpScript], {
      stdio: 'pipe',
      timeout: 30_000,
    });
    spinner.succeed('Installer downloaded');

    console.log(chalk.gray('Running install script (may prompt for sudo)...\n'));
    execFileSync('sh', [tmpScript], { stdio: 'inherit', timeout: 120_000 });

    if (isBedrockInstalled()) {
      console.log(chalk.green('Bedrock CLI installed successfully'));
      return true;
    } else {
      console.log(chalk.red('Bedrock CLI installation failed'));
      return false;
    }
  } catch {
    spinner.fail('Bedrock CLI installation failed');
    console.log(
      chalk.yellow(
        '\nYou can install it manually:\n  curl -sSfL ' +
          BEDROCK_INSTALL_URL +
          ' | sh\n'
      )
    );
    return false;
  } finally {
    // Clean up temp file
    try { rmSync(tmpScript); } catch { /* ignore */ }
  }
}

/**
 * Initialize a Bedrock project inside packages/bedrock/ with the selected primitives.
 *
 * Uses `bedrock init` for the first primitive and `bedrock add` for the rest.
 */
export function initBedrockProject(
  targetDir: string,
  primitives: Primitive[]
): boolean {
  if (primitives.length === 0) return true;

  const packagesDir = join(targetDir, 'packages');
  const bedrockDir = join(packagesDir, 'bedrock');

  // Ensure packages/ directory exists
  if (!existsSync(packagesDir)) {
    mkdirSync(packagesDir, { recursive: true });
  }

  const spinner = ora('Initializing Bedrock project...').start();

  try {
    // Init with the first primitive; rest (if any) are added via `bedrock add`
    const [first, ...rest] = primitives;
    execFileSync(
      'bedrock',
      ['init', 'bedrock', '--primitives', first],
      { cwd: packagesDir, stdio: 'pipe', timeout: 60_000 }
    );

    for (const p of rest) {
      execFileSync('bedrock', ['add', p], {
        cwd: bedrockDir,
        stdio: 'pipe',
        timeout: 60_000,
      });
    }

    spinner.succeed('Bedrock project initialized');
    return true;
  } catch (error) {
    spinner.fail('Failed to initialize Bedrock project');
    console.log(
      chalk.yellow(
        '\nYou can initialize it manually:\n  cd ' +
          bedrockDir +
          '\n  bedrock init . --primitives ' +
          primitives[0] +
          '\n'
      )
    );
    return false;
  }
}
