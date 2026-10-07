#!/usr/bin/env node

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { execFileSync } from 'child_process';
import { existsSync, rmSync, readFileSync, renameSync, writeFileSync, cpSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import validateProjectName from 'validate-npm-package-name';

import type { Answers, Primitive } from './types.js';
import { CliError } from './errors.js';
import { installModules, initScaffoldConfig } from './modules.js';
import { addCommand } from './commands/add.js';
import { listCommand } from './commands/list.js';
import { removeCommand } from './commands/remove.js';
import { ensureBedrock, initBedrockProject } from './bedrock.js';
import { generateNextJsPage, generateNuxtPage } from './page-generator.js';
import { updateXrplDependencies } from './dependencies.js';
import { copyBundledTemplate } from './template.js';
import { writeProjectDocumentation } from './project-docs.js';
import {
  hasAllNonInteractiveOptions,
  parseFramework,
  parsePackageManager,
  parsePrimitives,
  type CliOptions,
} from './options.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'));

const program = new Command();

async function main() {
  program
    .name('create-xrp')
    .version(packageJson.version, '-v, --version', 'Output the current version')
    .description('Scaffold a new XRPL dApp project');

  // Main scaffolding command
  program
    .argument('[project-name]', 'Name of your project')
    .option('-m, --modules <modules>', 'Comma-separated list of modules to install')
    .option('--framework <framework>', 'Framework to use (nextjs or nuxt)')
    .option('--pm <packageManager>', 'Package manager to use (pnpm, npm, or yarn)')
    .option('--experimental', 'Enable experimental contract, vault, and escrow features')
    .option('--no-experimental', 'Disable experimental contract, vault, and escrow features')
    .option('-p, --primitives <primitives>', 'Comma-separated experimental primitives (contract,vault,escrow)')
    .option('--skip-install', 'Skip dependency installation')
    .action(async (projectName?: string, options?: CliOptions) => {
      // If no project name and no subcommand, show welcome and prompt
      if (!projectName && !options?.modules) {
        console.log(chalk.cyan.bold('\nWelcome to Scaffold-XRP!\n'));
        console.log(chalk.gray('Create a dApp for the XRP Ledger\n'));
      }

      const answers = await promptUser(projectName, options);
      await scaffoldProject(answers, options?.modules, options?.skipInstall);
    });

  // Add module command
  program
    .command('add [module]')
    .description('Add a module to your project')
    .action(async (module?: string) => {
      await addCommand(module);
    });

  // List modules command
  program
    .command('list')
    .alias('ls')
    .description('List installed and available modules')
    .option('-r, --remote', 'Show modules from the remote registry')
    .action(async (options: { remote?: boolean }) => {
      await listCommand(options);
    });

  // Remove module command
  program
    .command('remove [module]')
    .alias('rm')
    .description('Remove an installed module')
    .action(async (module?: string) => {
      await removeCommand(module);
    });

  await program.parseAsync(process.argv);
}

async function promptUser(providedName?: string, options: CliOptions = {}): Promise<Answers> {
  const frameworkFlag = parseFramework(options.framework);
  const packageManagerFlag = parsePackageManager(options.pm);
  const primitiveFlag = parsePrimitives(options.primitives, options.experimental === true);

  let projectName = providedName;
  if (!projectName) {
    const answer = await inquirer.prompt<{ projectName: string }>([
      {
        type: 'input',
        name: 'projectName',
        message: 'What is your project name?',
        default: 'my-xrp-app',
        validate: (input: string) => {
          const validation = validateProjectName(input);
          if (!validation.validForNewPackages) {
            return validation.errors?.[0] || 'Invalid project name';
          }
          if (existsSync(input)) {
            return `Directory "${input}" already exists. Please choose a different name.`;
          }
          return true;
        },
      },
    ]);
    projectName = answer.projectName;
  }

  const validation = validateProjectName(projectName);
  if (!validation.validForNewPackages) {
    const errorMsg = validation.errors?.[0] || validation.warnings?.[0] || 'Invalid package name';
    throw new CliError(`Invalid project name: ${errorMsg}`);
  }
  if (existsSync(projectName)) {
    throw new CliError(`Directory "${projectName}" already exists.`);
  }

  let experimental = options.experimental === true;
  if (!options.experimental && !hasAllNonInteractiveOptions(projectName, options)) {
    const answer = await inquirer.prompt<{ experimental: boolean }>([
      {
        type: 'confirm',
        name: 'experimental',
        message: 'Use experimental features?',
        default: false,
      },
    ]);
    experimental = answer.experimental;
  }

  if (experimental && primitiveFlag === undefined && hasAllNonInteractiveOptions(projectName, options) && !process.stdin.isTTY) {
    throw new CliError('--experimental requires --primitives in non-interactive mode.');
  }

  let primitives = primitiveFlag;
  if (experimental && primitives === undefined) {
    const answer = await inquirer.prompt<{ primitives: Primitive[] }>([
      {
        type: 'checkbox',
        name: 'primitives',
        message: 'Which experimental primitives do you want to include?',
        choices: [
          { name: 'Contract  — programmable on-chain logic', value: 'contract' },
          { name: 'Vault     — programmable deposit/withdraw', value: 'vault' },
          { name: 'Escrow    — programmable conditional release', value: 'escrow' },
        ],
      },
    ]);
    primitives = answer.primitives;
  }

  let framework = frameworkFlag;
  if (!framework) {
    const answer = await inquirer.prompt<{ framework: 'nextjs' | 'nuxt' }>([
      {
        type: 'list',
        name: 'framework',
        message: 'Which framework do you want to use?',
        choices: [
          { name: 'Next.js (React)', value: 'nextjs' },
          { name: 'Nuxt (Vue)', value: 'nuxt' },
        ],
        default: 'nextjs',
      },
    ]);
    framework = answer.framework;
  }

  let packageManager = packageManagerFlag;
  if (!packageManager) {
    const answer = await inquirer.prompt<{ packageManager: 'pnpm' | 'npm' | 'yarn' }>([
      {
        type: 'list',
        name: 'packageManager',
        message: 'Which package manager do you want to use?',
        choices: [
          { name: 'pnpm (recommended)', value: 'pnpm' },
          { name: 'npm', value: 'npm' },
          { name: 'yarn', value: 'yarn' },
        ],
        default: 'pnpm',
      },
    ]);
    packageManager = answer.packageManager;
  }

  return {
    projectName,
    framework,
    experimental,
    primitives: primitives || [],
    packageManager,
  };
}

async function scaffoldProject(answers: Answers, modulesArg?: string, skipInstall = false) {
  const { projectName, framework, primitives, packageManager } = answers;
  const targetDir = join(process.cwd(), projectName);
  const hasPrimitives = primitives.length > 0;

  console.log(chalk.cyan(`\nCreating project in ${chalk.bold(targetDir)}\n`));
  if (hasPrimitives) {
    console.log(chalk.gray(`Primitives: ${primitives.join(', ')}\n`));
  }

  // Copy the immutable snapshot shipped in the CLI package.
  const templateSpinner = ora('Copying bundled template...').start();
  try {
    copyBundledTemplate(targetDir);
    templateSpinner.succeed('Template copied');
  } catch (error) {
    templateSpinner.fail('Failed to copy bundled template');
    throw error instanceof CliError
      ? error
      : new CliError(`Failed to copy bundled template: ${error instanceof Error ? error.message : String(error)}`);
  }

  // Clean up and set up project structure
  const cleanSpinner = ora('Setting up project...').start();
  try {
    // Remove .git directory
    const gitDir = join(targetDir, '.git');
    if (existsSync(gitDir)) {
      rmSync(gitDir, { recursive: true, force: true });
    }

    // Remove CLI package
    const cliDir = join(targetDir, 'packages', 'create-xrp');
    if (existsSync(cliDir)) {
      rmSync(cliDir, { recursive: true, force: true });
    }

    // Remove non-selected framework and rename if needed
    const appsDir = join(targetDir, 'apps');
    if (framework === 'nextjs') {
      const nuxtDir = join(appsDir, 'web-nuxt');
      if (existsSync(nuxtDir)) {
        rmSync(nuxtDir, { recursive: true, force: true });
      }
    } else {
      const nextDir = join(appsDir, 'web');
      if (existsSync(nextDir)) {
        rmSync(nextDir, { recursive: true, force: true });
      }
      const nuxtDir = join(appsDir, 'web-nuxt');
      if (existsSync(nuxtDir)) {
        renameSync(nuxtDir, join(appsDir, 'web'));
        const webPackageJsonPath = join(appsDir, 'web', 'package.json');
        if (existsSync(webPackageJsonPath)) {
          const webPackageJson = JSON.parse(readFileSync(webPackageJsonPath, 'utf-8'));
          webPackageJson.name = 'web';
          writeFileSync(webPackageJsonPath, JSON.stringify(webPackageJson, null, 2) + '\n');
        }
      }
    }

    const webDir = join(appsDir, 'web');

    // Remove old variant files (no longer needed — pages are generated dynamically)
    const variantFiles = [
      join(webDir, 'app', 'page-without-sc.js'),
      join(webDir, 'pages', 'index-without-sc.vue'),
      join(webDir, 'nuxt.config-without-sc.ts'),
      join(targetDir, 'README-without-sc.md'),
    ];
    for (const file of variantFiles) {
      if (existsSync(file)) rmSync(file);
    }

    // Remove the static bedrock package (will be recreated via bedrock init)
    const staticBedrockDir = join(targetDir, 'packages', 'bedrock');
    if (existsSync(staticBedrockDir)) {
      rmSync(staticBedrockDir, { recursive: true, force: true });
    }

    // Remove interaction components for primitives NOT selected
    const componentMap: Record<Primitive, string> = {
      contract: 'ContractInteraction',
      vault: 'VaultInteraction',
      escrow: 'EscrowInteraction',
    };
    const ext = framework === 'nextjs' ? '.js' : '.vue';
    for (const [prim, comp] of Object.entries(componentMap)) {
      if (!primitives.includes(prim as Primitive)) {
        const compPath = join(webDir, 'components', comp + ext);
        if (existsSync(compPath)) rmSync(compPath);
      }
    }

    // MPTokens are not part of the generated starter UI. Keep the feature out
    // of both the conventional and experimental templates until it has a
    // dedicated amendment/network opt-in flow.
    if (framework === 'nextjs') {
      const mpComponents = ['MPTokenCard', 'MPTokenCreate', 'MPTokenTransfer', 'MPTokenAuthorize'];
      for (const comp of mpComponents) {
        const compPath = join(webDir, 'components', comp + '.js');
        if (existsSync(compPath)) rmSync(compPath);
      }
    }

    // Generate page dynamically based on selected primitives
    const pagePath = framework === 'nextjs'
      ? join(webDir, 'app', 'page.js')
      : join(webDir, 'pages', 'index.vue');
    const pageContent = framework === 'nextjs'
      ? generateNextJsPage(primitives)
      : generateNuxtPage(primitives);
    writeFileSync(pagePath, pageContent);

    if (hasPrimitives) {
      // ── With primitives: keep monorepo structure ──

      // Update xrpl.js dependencies for the selected primitives
      const webPkgPath = join(webDir, 'package.json');
      if (existsSync(webPkgPath)) {
        updateXrplDependencies(webPkgPath, primitives);
      }

      // Update root package.json name
      const packageJsonPath = join(targetDir, 'package.json');
      if (existsSync(packageJsonPath)) {
        const rootPkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
        rootPkg.name = projectName;
        writeFileSync(packageJsonPath, JSON.stringify(rootPkg, null, 2) + '\n');
      }
    } else {
      // ── No primitives: flatten to simple project ──

      // Remove packages directory entirely
      const packagesDir = join(targetDir, 'packages');
      if (existsSync(packagesDir)) {
        rmSync(packagesDir, { recursive: true, force: true });
      }

      // Remove monorepo-specific docs
      const monorepoDocFiles = ['QUICKSTART.md', 'CONTRIBUTING.md'];
      for (const file of monorepoDocFiles) {
        const filePath = join(targetDir, file);
        if (existsSync(filePath)) rmSync(filePath);
      }

      // Flatten: remove monorepo config and move web app to root
      const monorepoConfigFiles = ['pnpm-workspace.yaml', 'turbo.json'];
      for (const file of monorepoConfigFiles) {
        const filePath = join(targetDir, file);
        if (existsSync(filePath)) rmSync(filePath);
      }

      const rootPkgPath = join(targetDir, 'package.json');
      const rootPkg = existsSync(rootPkgPath)
        ? JSON.parse(readFileSync(rootPkgPath, 'utf-8'))
        : {};
      if (existsSync(rootPkgPath)) rmSync(rootPkgPath);

      const webContents = readdirSync(webDir);
      for (const item of webContents) {
        const src = join(webDir, item);
        const dest = join(targetDir, item);
        cpSync(src, dest, { recursive: true });
      }

      rmSync(appsDir, { recursive: true, force: true });

      // Update package.json name and xrpl dependency
      const newPkgPath = join(targetDir, 'package.json');
      if (existsSync(newPkgPath)) {
        const webPkg = JSON.parse(readFileSync(newPkgPath, 'utf-8'));
        webPkg.name = projectName;
        if (packageManager === 'pnpm' && rootPkg.pnpm) {
          webPkg.pnpm = rootPkg.pnpm;
        }
        writeFileSync(newPkgPath, JSON.stringify(webPkg, null, 2) + '\n');
        updateXrplDependencies(newPkgPath, []);
      }

      // The source template intentionally ships without lockfiles. Remove any
      // lockfile copied by a future template update before generating a fresh
      // one with the selected package manager.
      for (const lockfile of ['pnpm-lock.yaml', 'package-lock.json', 'yarn.lock']) {
        const lockPath = join(targetDir, lockfile);
        if (existsSync(lockPath)) rmSync(lockPath);
      }
    }

    cleanSpinner.succeed('Project set up');
  } catch (error) {
    cleanSpinner.fail('Failed to set up project');
    throw new CliError(
      `Failed to set up project: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  writeProjectDocumentation({
    projectDir: targetDir,
    projectName,
    framework,
    packageManager,
    primitives,
    flattened: !hasPrimitives,
  });

  // Initialize Bedrock project if primitives selected
  if (hasPrimitives) {
    console.log(
      chalk.yellow(
        'Experimental primitives require a Bedrock-compatible local or AlphaNet network; standard Testnet and Devnet may reject these transactions.\n',
      ),
    );
    const bedrockReady = await ensureBedrock();
    if (!bedrockReady) {
      throw new CliError(
        'Bedrock CLI is required for experimental primitives. Install it and rerun create-xrp.',
      );
    }
    const initialized = initBedrockProject(targetDir, primitives);
    if (!initialized) {
      throw new CliError('Bedrock project setup failed. The project was not created successfully.');
    }
  }

  // Initialize scaffold config
  initScaffoldConfig(targetDir, framework, primitives);

  // Install dependencies
  if (!skipInstall) {
    const installSpinner = ora(`Installing dependencies with ${packageManager}...`).start();
    try {
      const installArgs = packageManager === 'yarn' ? [] : ['install'];
      execFileSync(packageManager, installArgs, { cwd: targetDir, stdio: 'pipe' });
      installSpinner.succeed('Dependencies installed');
    } catch (error) {
      installSpinner.fail('Failed to install dependencies');
      throw new CliError(
        `Failed to install dependencies with ${packageManager}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  } else {
    console.log(chalk.gray('Skipping dependency installation (--skip-install).\n'));
  }

  // Install modules if specified
  if (modulesArg) {
    const modulesList = modulesArg.split(',').map((m) => m.trim()).filter(Boolean);
    if (modulesList.length > 0) {
      console.log(chalk.cyan('\nInstalling modules...\n'));
      const result = await installModules(targetDir, modulesList, framework, packageManager);

      if (result.installed.length > 0) {
        console.log(chalk.green(`\nInstalled modules: ${result.installed.join(', ')}`));
      }
      if (result.failed.length > 0) {
        throw new CliError(`Failed to install modules: ${result.failed.join(', ')}`);
      }
    }
  }

  // Initialize git
  const gitSpinner = ora('Initializing git repository...').start();
  try {
    execFileSync('git', ['init'], { cwd: targetDir, stdio: 'pipe' });
    execFileSync('git', ['add', '.'], { cwd: targetDir, stdio: 'pipe' });
    execFileSync('git', ['commit', '-m', 'Initial commit from create-xrp'], { cwd: targetDir, stdio: 'pipe' });
    gitSpinner.succeed('Git repository initialized');
  } catch (error) {
    gitSpinner.fail('Failed to initialize git');
    throw new CliError(
      `Failed to initialize git: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  // Success message
  console.log(chalk.green.bold('\nProject created successfully!\n'));
  console.log(chalk.cyan('Next steps:\n'));
  console.log(chalk.white(`  cd ${projectName}`));
  const devCommand = packageManager === 'npm' ? 'npm run' : packageManager;
  console.log(chalk.white(`  ${devCommand} dev\n`));
  console.log(chalk.gray('Your app will be running at http://localhost:3000\n'));

  if (hasPrimitives) {
    console.log(chalk.cyan('Bedrock commands:\n'));
    if (primitives.includes('contract')) {
      console.log(chalk.white('  bedrock build --type contract   # Build contract'));
      console.log(chalk.white('  bedrock deploy --network local  # Deploy contract'));
    }
    if (primitives.includes('vault')) {
      console.log(chalk.white('  bedrock build --type vault      # Build vault WASM'));
      console.log(chalk.white('  bedrock vault deploy --asset XRP --wallet <seed> --network local'));
    }
    if (primitives.includes('escrow')) {
      console.log(chalk.white('  bedrock build --type escrow     # Build escrow WASM'));
      console.log(chalk.white('  bedrock escrow deploy --destination <addr> --amount <drops> --wallet <seed> --network local'));
    }
    console.log('');
  }

  // Module management info
  console.log(chalk.cyan('Module management:\n'));
  console.log(chalk.white('  npx create-xrp add <module>    # Add a module'));
  console.log(chalk.white('  npx create-xrp list            # List modules'));
  console.log(chalk.white('  npx create-xrp remove <module> # Remove a module\n'));

  console.log(chalk.cyan('Learn more:'));
  console.log(chalk.white('  Documentation: https://github.com/XRPL-Commons/scaffold-xrp'));
  console.log(chalk.white('  Discord: https://discord.gg/xrpl\n'));
  console.log(chalk.cyan.bold('Happy hacking!\n'));
}

main().catch((error) => {
  if (error instanceof CliError) {
    console.error(chalk.red(`\n${error.message}\n`));
    process.exit(error.exitCode);
  }
  console.error(chalk.red('\nAn unexpected error occurred:\n'));
  console.error(error);
  process.exit(1);
});
