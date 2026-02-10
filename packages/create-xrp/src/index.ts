#!/usr/bin/env node

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { execSync } from 'child_process';
import { existsSync, rmSync, readFileSync, renameSync, writeFileSync, cpSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import validateProjectName from 'validate-npm-package-name';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'));

const program = new Command();

interface Answers {
  projectName: string;
  framework: 'nextjs' | 'nuxt';
  smartContract: boolean;
  packageManager: 'pnpm' | 'npm' | 'yarn';
}

async function main() {
  console.log(chalk.cyan.bold('\nWelcome to Scaffold-XRP!\n'));
  console.log(chalk.gray('Create a dApp for the XRP Ledger\n'));

  program
    .name('create-xrp')
    .version(packageJson.version, '-v, --version', 'Output the current version')
    .description('Scaffold a new XRPL dApp project')
    .argument('[project-name]', 'Name of your project')
    .action(async (projectName?: string) => {
      const answers = await promptUser(projectName);
      await scaffoldProject(answers);
    });

  await program.parseAsync(process.argv);
}

async function promptUser(providedName?: string): Promise<Answers> {
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

  questions.push({
    type: 'confirm',
    name: 'smartContract',
    message: 'Do you want to include smart contract support?',
    default: true,
  });

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

  const answers = await inquirer.prompt<Partial<Answers>>(questions);

  return {
    projectName: providedName || answers.projectName as string,
    framework: answers.framework as Answers['framework'],
    smartContract: answers.smartContract as boolean,
    packageManager: answers.packageManager as Answers['packageManager'],
  };
}

async function scaffoldProject(answers: Answers) {
  const { projectName, framework, smartContract, packageManager } = answers;
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

    const webDir = join(appsDir, 'web');

    if (smartContract) {
      // With smart contracts: keep monorepo structure, clean up variant files
      const variantFiles = [
        framework === 'nextjs'
          ? join(webDir, 'app', 'page-without-sc.js')
          : join(webDir, 'pages', 'index-without-sc.vue'),
        join(targetDir, 'README-without-sc.md'),
      ];
      if (framework === 'nuxt') {
        variantFiles.push(join(webDir, 'nuxt.config-without-sc.ts'));
      }
      for (const file of variantFiles) {
        if (existsSync(file)) {
          rmSync(file);
        }
      }

      // Update root package.json name
      const packageJsonPath = join(targetDir, 'package.json');
      if (existsSync(packageJsonPath)) {
        const rootPkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
        rootPkg.name = projectName;
        writeFileSync(packageJsonPath, JSON.stringify(rootPkg, null, 2) + '\n');
      }
    } else {
      // Without smart contracts: flatten to a simple project

      // 1. Swap page variant files
      if (framework === 'nextjs') {
        const pagePath = join(webDir, 'app', 'page.js');
        const noScPagePath = join(webDir, 'app', 'page-without-sc.js');
        if (existsSync(noScPagePath)) {
          rmSync(pagePath);
          renameSync(noScPagePath, pagePath);
        }
      } else {
        const indexPath = join(webDir, 'pages', 'index.vue');
        const noScIndexPath = join(webDir, 'pages', 'index-without-sc.vue');
        if (existsSync(noScIndexPath)) {
          rmSync(indexPath);
          renameSync(noScIndexPath, indexPath);
        }
        // Swap nuxt.config variant
        const nuxtConfigPath = join(webDir, 'nuxt.config.ts');
        const noScNuxtConfigPath = join(webDir, 'nuxt.config-without-sc.ts');
        if (existsSync(noScNuxtConfigPath)) {
          rmSync(nuxtConfigPath);
          renameSync(noScNuxtConfigPath, nuxtConfigPath);
        }
      }

      // 2. Remove ContractInteraction component
      const contractComponentName = framework === 'nextjs'
        ? 'ContractInteraction.js'
        : 'ContractInteraction.vue';
      const contractComponent = join(webDir, 'components', contractComponentName);
      if (existsSync(contractComponent)) {
        rmSync(contractComponent);
      }

      // 3. Remove packages directory (bedrock)
      const packagesDir = join(targetDir, 'packages');
      if (existsSync(packagesDir)) {
        rmSync(packagesDir, { recursive: true, force: true });
      }

      // 4. Swap README and remove monorepo-specific docs
      const readmeNoScPath = join(targetDir, 'README-without-sc.md');
      const readmePath = join(targetDir, 'README.md');
      if (existsSync(readmeNoScPath)) {
        rmSync(readmePath);
        renameSync(readmeNoScPath, readmePath);
      }
      const monorepoDocFiles = ['QUICKSTART.md', 'CONTRIBUTING.md'];
      for (const file of monorepoDocFiles) {
        const filePath = join(targetDir, file);
        if (existsSync(filePath)) {
          rmSync(filePath);
        }
      }

      // 5. Flatten: move web app contents to project root
      // First, remove monorepo config files from root
      const monorepoConfigFiles = ['pnpm-workspace.yaml', 'turbo.json'];
      for (const file of monorepoConfigFiles) {
        const filePath = join(targetDir, file);
        if (existsSync(filePath)) {
          rmSync(filePath);
        }
      }

      // Remove root package.json (will be replaced by web app's)
      const rootPkgPath = join(targetDir, 'package.json');
      if (existsSync(rootPkgPath)) {
        rmSync(rootPkgPath);
      }

      // Copy all web app contents to project root
      const webContents = readdirSync(webDir);
      for (const item of webContents) {
        const src = join(webDir, item);
        const dest = join(targetDir, item);
        cpSync(src, dest, { recursive: true });
      }

      // Remove apps directory
      rmSync(appsDir, { recursive: true, force: true });

      // Update the web app's package.json (now at root) with project name
      const newPkgPath = join(targetDir, 'package.json');
      if (existsSync(newPkgPath)) {
        const webPkg = JSON.parse(readFileSync(newPkgPath, 'utf-8'));
        webPkg.name = projectName;
        writeFileSync(newPkgPath, JSON.stringify(webPkg, null, 2) + '\n');
      }
    }

    cleanSpinner.succeed('Project set up');
  } catch (error) {
    cleanSpinner.fail('Failed to set up project');
    console.log(chalk.yellow('\nWarning: Some setup steps failed\n'));
  }

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
  const devCommand = packageManager === 'npm' ? 'npm run' : packageManager;
  console.log(chalk.white(`  ${devCommand} dev\n`));
  console.log(chalk.gray('Your app will be running at http://localhost:3000\n'));
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
