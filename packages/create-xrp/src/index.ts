#!/usr/bin/env node

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { execSync } from 'child_process';
import { existsSync, rmSync, readFileSync, renameSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import validateProjectName from 'validate-npm-package-name';

import type { Answers } from './types.js';
import { installModules, initScaffoldConfig } from './modules.js';
import { addCommand } from './commands/add.js';
import { listCommand } from './commands/list.js';
import { removeCommand } from './commands/remove.js';

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
    .action(async (projectName?: string, options?: { modules?: string; framework?: string; pm?: string }) => {
      // If no project name and no subcommand, show welcome and prompt
      if (!projectName && !options?.modules) {
        console.log(chalk.cyan.bold('\nWelcome to Scaffold-XRP!\n'));
        console.log(chalk.gray('Create a dApp for XRPL with smart contracts\n'));
      }

      const answers = await promptUser(projectName, options);
      await scaffoldProject(answers, options?.modules);
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

async function promptUser(
  providedName?: string,
  options?: { framework?: string; pm?: string }
): Promise<Answers> {
  const questions = [];

  if (!providedName) {
    questions.push({
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
    });
  } else {
    const validation = validateProjectName(providedName);
    if (!validation.validForNewPackages) {
      const errorMsg = validation.errors?.[0] || validation.warnings?.[0] || 'Invalid package name';
      console.log(chalk.red(`\nInvalid project name: ${errorMsg}\n`));
      console.log(chalk.gray('Package names must be lowercase and can only contain letters, numbers, and hyphens.\n'));
      process.exit(1);
    }
    if (existsSync(providedName)) {
      console.log(chalk.red(`\nDirectory "${providedName}" already exists.\n`));
      process.exit(1);
    }
  }

  // Framework selection
  if (options?.framework && ['nextjs', 'nuxt'].includes(options.framework)) {
    // Use provided framework
  } else {
    questions.push({
      type: 'list',
      name: 'framework',
      message: 'Which framework do you want to use?',
      choices: [
        { name: 'Next.js (React)', value: 'nextjs' },
        { name: 'Nuxt (Vue)', value: 'nuxt' },
      ],
      default: 'nextjs',
    });
  }

  // Package manager selection
  if (options?.pm && ['pnpm', 'npm', 'yarn'].includes(options.pm)) {
    // Use provided package manager
  } else {
    questions.push({
      type: 'list',
      name: 'packageManager',
      message: 'Which package manager do you want to use?',
      choices: [
        { name: 'pnpm (recommended)', value: 'pnpm' },
        { name: 'npm', value: 'npm' },
        { name: 'yarn', value: 'yarn' },
      ],
      default: 'pnpm',
    });
  }

  const answers = await inquirer.prompt(questions);

  return {
    projectName: providedName || answers.projectName,
    framework: (options?.framework as 'nextjs' | 'nuxt') || answers.framework,
    packageManager: (options?.pm as 'pnpm' | 'npm' | 'yarn') || answers.packageManager,
  };
}

async function scaffoldProject(answers: Answers, modulesArg?: string) {
  const { projectName, framework, packageManager } = answers;
  const targetDir = join(process.cwd(), projectName);

  console.log(chalk.cyan(`\nCreating project in ${chalk.bold(targetDir)}\n`));

  // Clone the template
  const cloneSpinner = ora('Cloning template...').start();
  try {
    execSync(
      `git clone --depth 1 https://github.com/XRPL-Commons/scaffold-xrp.git "${targetDir}"`,
      { stdio: 'pipe' }
    );
    cloneSpinner.succeed('Template cloned');
  } catch (error) {
    cloneSpinner.fail('Failed to clone template');
    console.log(chalk.red('\nError cloning repository. Please check your internet connection.\n'));
    process.exit(1);
  }

  // Clean up
  const cleanSpinner = ora('Cleaning up...').start();
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
      // Remove Nuxt app
      const nuxtDir = join(appsDir, 'web-nuxt');
      if (existsSync(nuxtDir)) {
        rmSync(nuxtDir, { recursive: true, force: true });
      }
    } else {
      // Remove Next.js app
      const nextDir = join(appsDir, 'web');
      if (existsSync(nextDir)) {
        rmSync(nextDir, { recursive: true, force: true });
      }
      // Rename Nuxt app to 'web'
      const nuxtDir = join(appsDir, 'web-nuxt');
      if (existsSync(nuxtDir)) {
        renameSync(nuxtDir, join(appsDir, 'web'));
        // Update the web app's package.json name from 'web-nuxt' to 'web'
        const webPackageJsonPath = join(appsDir, 'web', 'package.json');
        if (existsSync(webPackageJsonPath)) {
          const webPackageJson = JSON.parse(readFileSync(webPackageJsonPath, 'utf-8'));
          webPackageJson.name = 'web';
          writeFileSync(webPackageJsonPath, JSON.stringify(webPackageJson, null, 2) + '\n');
        }
      }
    }

    // Update package.json name
    const packageJsonPath = join(targetDir, 'package.json');
    if (existsSync(packageJsonPath)) {
      const pkgJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      pkgJson.name = projectName;
      writeFileSync(packageJsonPath, JSON.stringify(pkgJson, null, 2) + '\n');
    }

    cleanSpinner.succeed('Cleaned up template');
  } catch (error) {
    cleanSpinner.fail('Failed to clean up');
    console.log(chalk.yellow('\nWarning: Some cleanup steps failed\n'));
  }

  // Initialize scaffold config
  initScaffoldConfig(targetDir, framework);

  // Install dependencies
  const installSpinner = ora(`Installing dependencies with ${packageManager}...`).start();
  try {
    const installCommand = packageManager === 'yarn' ? 'yarn' : `${packageManager} install`;
    execSync(installCommand, { cwd: targetDir, stdio: 'pipe' });
    installSpinner.succeed('Dependencies installed');
  } catch (error) {
    installSpinner.fail('Failed to install dependencies');
    console.log(chalk.yellow('\nYou can install dependencies manually by running:'));
    console.log(chalk.cyan(`   cd ${projectName} && ${packageManager} install\n`));
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
        console.log(chalk.yellow(`\nFailed to install: ${result.failed.join(', ')}`));
      }
    }
  }

  // Initialize git
  const gitSpinner = ora('Initializing git repository...').start();
  try {
    execSync('git init', { cwd: targetDir, stdio: 'pipe' });
    execSync('git add .', { cwd: targetDir, stdio: 'pipe' });
    execSync('git commit -m "Initial commit from create-xrp"', { cwd: targetDir, stdio: 'pipe' });
    gitSpinner.succeed('Git repository initialized');
  } catch (error) {
    gitSpinner.fail('Failed to initialize git');
    console.log(chalk.yellow('\nYou can initialize git manually\n'));
  }

  // Success message
  console.log(chalk.green.bold('\nProject created successfully!\n'));
  console.log(chalk.cyan('Next steps:\n'));
  console.log(chalk.white(`  cd ${projectName}`));
  console.log(chalk.white(`  ${packageManager === 'npm' ? 'npm run' : packageManager} dev\n`));
  console.log(chalk.gray('Your app will be running at http://localhost:3000\n'));

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
  console.error(chalk.red('\nAn unexpected error occurred:\n'));
  console.error(error);
  process.exit(1);
});
