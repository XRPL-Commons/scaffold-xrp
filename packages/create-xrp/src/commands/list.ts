/**
 * 'list' command - List available and installed modules
 */

import chalk from 'chalk';
import {
  fetchRegistry,
  listInstalledModules,
  isScaffoldXrpProject,
  detectFramework,
} from '../modules.js';

export async function listCommand(options: { remote?: boolean }): Promise<void> {
  const projectDir = process.cwd();
  const isProject = isScaffoldXrpProject(projectDir);

  // Show installed modules if in a project
  if (isProject) {
    const framework = detectFramework(projectDir);
    console.log(chalk.cyan.bold('\nInstalled Modules:\n'));

    const installed = listInstalledModules(projectDir);
    const installedNames = Object.keys(installed);

    if (installedNames.length === 0) {
      console.log(chalk.gray('  No modules installed yet.\n'));
    } else {
      for (const [name, info] of Object.entries(installed)) {
        console.log(chalk.white(`  ${chalk.bold(name)} v${info.version}`));
        console.log(chalk.gray(`    Source: ${info.source}`));
        console.log(chalk.gray(`    Installed: ${new Date(info.installedAt).toLocaleDateString()}\n`));
      }
    }

    if (framework) {
      console.log(chalk.gray(`  Framework: ${framework}\n`));
    }
  }

  // Show remote modules from registry
  if (options.remote || !isProject) {
    console.log(chalk.cyan.bold('\nAvailable Modules (Registry):\n'));

    const registry = await fetchRegistry();
    const moduleNames = Object.keys(registry.modules);

    if (moduleNames.length === 0) {
      console.log(chalk.gray('  No modules available in the registry.'));
      console.log(chalk.gray('  You can still install modules using direct git URLs:\n'));
      console.log(chalk.white('    npx create-xrp add https://github.com/user/repo\n'));
    } else {
      const installedModules = isProject ? listInstalledModules(projectDir) : {};

      for (const [name, info] of Object.entries(registry.modules)) {
        const isInstalled = !!installedModules[name];
        const statusBadge = isInstalled ? chalk.green(' [installed]') : '';

        console.log(chalk.white(`  ${chalk.bold(name)}${statusBadge}`));
        console.log(chalk.gray(`    ${info.description}`));
        if (info.author) {
          console.log(chalk.gray(`    Author: ${info.author}`));
        }
        console.log(chalk.gray(`    ${info.repo}\n`));
      }
    }
  }

  // Show help
  if (!isProject) {
    console.log(chalk.yellow('\nNote: Run this command inside a scaffold-xrp project to see installed modules.\n'));
  } else {
    console.log(chalk.gray('To install a module: ') + chalk.white('npx create-xrp add <module-name>'));
    console.log(chalk.gray('To see all available: ') + chalk.white('npx create-xrp list --remote\n'));
  }
}
