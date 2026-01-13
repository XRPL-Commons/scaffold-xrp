/**
 * 'remove' command - Remove an installed module from a project
 */

import chalk from 'chalk';
import inquirer from 'inquirer';
import {
  removeModule,
  listInstalledModules,
  isScaffoldXrpProject,
} from '../modules.js';

export async function removeCommand(moduleName?: string): Promise<void> {
  const projectDir = process.cwd();

  // Check if we're in a scaffold-xrp project
  if (!isScaffoldXrpProject(projectDir)) {
    console.log(chalk.red('\nError: Not in a scaffold-xrp project directory.'));
    console.log(chalk.gray('Run this command from the root of your scaffold-xrp project.\n'));
    process.exit(1);
  }

  // Get installed modules
  const installed = listInstalledModules(projectDir);
  const installedNames = Object.keys(installed);

  if (installedNames.length === 0) {
    console.log(chalk.yellow('\nNo modules are currently installed.\n'));
    process.exit(0);
  }

  // If no module specified, show interactive selection
  let selectedModule = moduleName;
  if (!selectedModule) {
    const moduleChoices = installedNames.map((name) => ({
      name: `${name} v${installed[name].version}`,
      value: name,
    }));

    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'module',
        message: 'Which module would you like to remove?',
        choices: moduleChoices,
      },
    ]);

    selectedModule = answers.module;
  }

  // Check if module is installed
  if (!installed[selectedModule]) {
    console.log(chalk.red(`\nModule "${selectedModule}" is not installed.`));
    console.log(chalk.gray('\nInstalled modules:'));
    installedNames.forEach((name) => {
      console.log(chalk.gray(`  - ${name}`));
    });
    console.log('');
    process.exit(1);
  }

  // Confirm removal
  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: `Are you sure you want to remove "${selectedModule}"?`,
      default: false,
    },
  ]);

  if (!confirm) {
    console.log(chalk.gray('\nCancelled.\n'));
    process.exit(0);
  }

  // Remove the module
  const result = removeModule(projectDir, selectedModule);

  if (!result.success) {
    console.log(chalk.red(`\nFailed to remove module: ${result.error}\n`));
    process.exit(1);
  }

  console.log(chalk.green.bold(`\nModule "${selectedModule}" has been removed.\n`));
  console.log(chalk.yellow('Note: npm dependencies installed by this module were not removed.'));
  console.log(chalk.gray('You may want to clean up unused dependencies manually.\n'));
}
