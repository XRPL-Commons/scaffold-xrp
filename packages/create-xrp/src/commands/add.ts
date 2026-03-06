/**
 * 'add' command - Install a module into an existing project
 */

import chalk from 'chalk';
import inquirer from 'inquirer';
import {
  installModule,
  fetchRegistry,
  detectFramework,
  detectPackageManager,
  isScaffoldXrpProject,
  readScaffoldConfig,
  initScaffoldConfig,
} from '../modules.js';
import { CliError } from '../errors.js';

export async function addCommand(moduleSource?: string): Promise<void> {
  const projectDir = process.cwd();

  // Check if we're in a scaffold-xrp project
  if (!isScaffoldXrpProject(projectDir)) {
    throw new CliError('Not in a scaffold-xrp project directory.\nRun this command from the root of your scaffold-xrp project.');
  }

  // Detect framework
  const framework = detectFramework(projectDir);
  if (!framework) {
    throw new CliError('Could not detect framework.\nMake sure apps/web exists with a Next.js or Nuxt configuration.');
  }

  // Ensure scaffold config exists
  let config = readScaffoldConfig(projectDir);
  if (!config) {
    config = initScaffoldConfig(projectDir, framework);
  }

  // Detect package manager
  const packageManager = detectPackageManager(projectDir);

  // If no module specified, show interactive selection
  let selectedModule = moduleSource;
  if (!selectedModule) {
    console.log(chalk.cyan('\nFetching available modules...\n'));
    const registry = await fetchRegistry();

    const moduleChoices = Object.entries(registry.modules).map(([name, info]) => ({
      name: `${name} - ${info.description}`,
      value: name,
    }));

    if (moduleChoices.length === 0) {
      console.log(chalk.yellow('No modules available in the registry.'));
      console.log(chalk.gray('You can install a module using a direct git URL:\n'));
      console.log(chalk.white('  npx create-xrp add https://github.com/user/repo\n'));
      return;
    }

    moduleChoices.push({
      name: chalk.gray('Enter a custom git URL...'),
      value: '__custom__',
    });

    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'module',
        message: 'Which module would you like to install?',
        choices: moduleChoices,
      },
    ]);

    if (answers.module === '__custom__') {
      const urlAnswer = await inquirer.prompt([
        {
          type: 'input',
          name: 'url',
          message: 'Enter the git URL for the module:',
          validate: (input: string) => {
            if (!input.startsWith('https://') && !input.startsWith('git@')) {
              return 'Please enter a valid git URL';
            }
            return true;
          },
        },
      ]);
      selectedModule = urlAnswer.url;
    } else {
      selectedModule = answers.module;
    }
  }

  if (!selectedModule) {
    throw new CliError('No module selected');
  }

  // Check if already installed
  if (config.installedModules[selectedModule]) {
    console.log(chalk.yellow(`\nModule "${selectedModule}" is already installed.`));
    const { reinstall } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'reinstall',
        message: 'Do you want to reinstall it?',
        default: false,
      },
    ]);
    if (!reinstall) {
      return;
    }
  }

  console.log(chalk.cyan(`\nInstalling module for ${framework}...\n`));

  const result = await installModule({
    projectDir,
    moduleSource: selectedModule,
    framework,
    packageManager,
  });

  if (!result.success) {
    throw new CliError(`Failed to install module: ${result.error}`);
  }

  console.log(chalk.green.bold('\nModule installed successfully!\n'));
  console.log(chalk.gray(`Module files are located in: apps/web/modules/${result.moduleName}/`));
  console.log(chalk.gray('You can now import and use the module in your application.\n'));
}
