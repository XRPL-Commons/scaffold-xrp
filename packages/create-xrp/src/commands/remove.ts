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
import { CliError } from '../errors.js';

export async function removeCommand(moduleName?: string): Promise<void> {
  const projectDir = process.cwd();

  // Check if we're in a scaffold-xrp project
  if (!isScaffoldXrpProject(projectDir)) {
    throw new CliError('Not in a scaffold-xrp project directory.\nRun this command from the root of your scaffold-xrp project.');
  }

  // Get installed modules
  const installed = listInstalledModules(projectDir);
  const installedNames = Object.keys(installed);

  if (installedNames.length === 0) {
    console.log(chalk.yellow('\nNo modules are currently installed.\n'));
    return;
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

  if (!selectedModule) {
    throw new CliError('No module selected');
  }

  // Check if module is installed
  if (!installed[selectedModule]) {
    const moduleList = installedNames.map((name) => `  - ${name}`).join('\n');
    throw new CliError(`Module "${selectedModule}" is not installed.\n\nInstalled modules:\n${moduleList}`);
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
    return;
  }

  // Remove the module
  const result = removeModule(projectDir, selectedModule);

  if (!result.success) {
    throw new CliError(`Failed to remove module: ${result.error}`);
  }

  console.log(chalk.green.bold(`\nModule "${selectedModule}" has been removed.\n`));
  console.log(chalk.yellow('Note: npm dependencies installed by this module were not removed.'));
  console.log(chalk.gray('You may want to clean up unused dependencies manually.\n'));
}
