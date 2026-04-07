/**
 * Bedrock CLI detection, installation, and project initialization
 */

import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { execFileSync, execSync } from 'child_process';
import { join } from 'path';
import { mkdirSync, existsSync } from 'fs';
import type { Primitive } from './types.js';

const BEDROCK_INSTALL_URL =
  'https://raw.githubusercontent.com/XRPL-Commons/Bedrock/main/install.sh';

/**
 * Check if Bedrock CLI is installed and available in PATH
 */
export function isBedrockInstalled(): boolean {
  try {
    execFileSync('bedrock', ['--version'], { stdio: 'pipe' });
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

  const spinner = ora('Installing Bedrock CLI...').start();
  try {
    execSync(`curl -sSfL ${BEDROCK_INSTALL_URL} | sh`, {
      stdio: 'inherit',
    });

    if (isBedrockInstalled()) {
      spinner.succeed('Bedrock CLI installed');
      return true;
    } else {
      spinner.fail('Bedrock CLI installation failed');
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
    // Init with the first primitive
    const [first, ...rest] = primitives;
    execFileSync(
      'bedrock',
      ['init', 'bedrock', '--primitives', first],
      { cwd: packagesDir, stdio: 'pipe' }
    );

    // Add remaining primitives
    for (const p of rest) {
      execFileSync('bedrock', ['add', p], {
        cwd: bedrockDir,
        stdio: 'pipe',
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
