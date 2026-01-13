/**
 * Module management utilities for scaffold-xrp
 */

import chalk from 'chalk';
import ora from 'ora';
import { execSync } from 'child_process';
import {
  existsSync,
  rmSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  cpSync,
  readdirSync,
} from 'fs';
import { join, basename } from 'path';
import type {
  ModuleConfig,
  Registry,
  ScaffoldConfig,
  InstalledModule,
  InstallModuleOptions,
} from './types.js';

// Default registry URL - can be overridden via environment variable
const DEFAULT_REGISTRY_URL =
  process.env.SCAFFOLD_XRP_REGISTRY_URL ||
  'https://raw.githubusercontent.com/XRPL-Commons/scaffold-xrp-registry/main/registry.json';

const SCAFFOLD_CONFIG_FILE = '.scaffold-xrp.json';
const MODULE_CONFIG_FILE = 'module.json';

/**
 * Fetch the module registry
 */
export async function fetchRegistry(registryUrl?: string): Promise<Registry> {
  const url = registryUrl || DEFAULT_REGISTRY_URL;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch registry: ${response.statusText}`);
    }
    return (await response.json()) as Registry;
  } catch (error) {
    // Return empty registry if fetch fails
    console.log(
      chalk.yellow(`\nWarning: Could not fetch registry from ${url}`)
    );
    console.log(chalk.gray('You can still install modules using direct git URLs\n'));
    return { version: '0.0.0', modules: {} };
  }
}

/**
 * Read the scaffold config from a project directory
 */
export function readScaffoldConfig(projectDir: string): ScaffoldConfig | null {
  const configPath = join(projectDir, SCAFFOLD_CONFIG_FILE);
  if (!existsSync(configPath)) {
    return null;
  }
  try {
    return JSON.parse(readFileSync(configPath, 'utf-8'));
  } catch {
    return null;
  }
}

/**
 * Write the scaffold config to a project directory
 */
export function writeScaffoldConfig(
  projectDir: string,
  config: ScaffoldConfig
): void {
  const configPath = join(projectDir, SCAFFOLD_CONFIG_FILE);
  writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
}

/**
 * Initialize scaffold config for a new project
 */
export function initScaffoldConfig(
  projectDir: string,
  framework: 'nextjs' | 'nuxt'
): ScaffoldConfig {
  const config: ScaffoldConfig = {
    framework,
    installedModules: {},
  };
  writeScaffoldConfig(projectDir, config);
  return config;
}

/**
 * Detect the framework used in a project
 */
export function detectFramework(projectDir: string): 'nextjs' | 'nuxt' | null {
  // First check scaffold config
  const config = readScaffoldConfig(projectDir);
  if (config?.framework) {
    return config.framework;
  }

  // Check for framework-specific files
  const webDir = join(projectDir, 'apps', 'web');
  if (existsSync(join(webDir, 'nuxt.config.ts'))) {
    return 'nuxt';
  }
  if (existsSync(join(webDir, 'next.config.js')) || existsSync(join(webDir, 'next.config.mjs'))) {
    return 'nextjs';
  }

  return null;
}

/**
 * Detect the package manager used in a project
 */
export function detectPackageManager(
  projectDir: string
): 'pnpm' | 'npm' | 'yarn' {
  if (existsSync(join(projectDir, 'pnpm-lock.yaml'))) {
    return 'pnpm';
  }
  if (existsSync(join(projectDir, 'yarn.lock'))) {
    return 'yarn';
  }
  return 'npm';
}

/**
 * Resolve a module source to a git URL
 * Accepts either a module name (from registry) or a direct git URL
 */
export async function resolveModuleSource(
  source: string,
  registry?: Registry
): Promise<{ url: string; name: string } | null> {
  // Check if it's a git URL
  if (
    source.startsWith('https://') ||
    source.startsWith('git@') ||
    source.startsWith('git://')
  ) {
    // Extract name from URL
    const name = basename(source, '.git').replace(/^scaffold-xrp-module-/, '');
    return { url: source, name };
  }

  // Look up in registry
  const reg = registry || (await fetchRegistry());
  const moduleInfo = reg.modules[source];

  if (!moduleInfo) {
    return null;
  }

  return { url: moduleInfo.repo, name: source };
}

/**
 * Clone a module to a temporary directory
 */
function cloneModule(gitUrl: string, tempDir: string): boolean {
  try {
    rmSync(tempDir, { recursive: true, force: true });
    execSync(`git clone --depth 1 "${gitUrl}" "${tempDir}"`, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Read module config from cloned module
 */
function readModuleConfig(moduleDir: string): ModuleConfig | null {
  const configPath = join(moduleDir, MODULE_CONFIG_FILE);
  if (!existsSync(configPath)) {
    return null;
  }
  try {
    return JSON.parse(readFileSync(configPath, 'utf-8'));
  } catch {
    return null;
  }
}

/**
 * Copy module files to the project
 */
function copyModuleFiles(
  moduleDir: string,
  projectDir: string,
  moduleConfig: ModuleConfig,
  framework: 'nextjs' | 'nuxt'
): void {
  const webDir = join(projectDir, 'apps', 'web');
  const modulesDir = join(webDir, 'modules', moduleConfig.name);
  const bedrockModulesDir = join(
    projectDir,
    'packages',
    'bedrock',
    'modules',
    moduleConfig.name
  );

  // Ensure directories exist
  mkdirSync(modulesDir, { recursive: true });

  // Determine framework-specific source directories
  const frameworkDir = framework === 'nextjs' ? 'react' : 'vue';

  // Copy components
  if (moduleConfig.files?.components) {
    const componentsSrc = join(moduleDir, 'components', frameworkDir);
    const componentsDest = join(modulesDir, 'components');
    if (existsSync(componentsSrc)) {
      mkdirSync(componentsDest, { recursive: true });
      cpSync(componentsSrc, componentsDest, { recursive: true });
    }
  }

  // Copy hooks (React) or composables (Vue)
  if (framework === 'nextjs' && moduleConfig.files?.hooks) {
    const hooksSrc = join(moduleDir, 'hooks');
    const hooksDest = join(modulesDir, 'hooks');
    if (existsSync(hooksSrc)) {
      mkdirSync(hooksDest, { recursive: true });
      cpSync(hooksSrc, hooksDest, { recursive: true });
    }
  }

  if (framework === 'nuxt' && moduleConfig.files?.composables) {
    const composablesSrc = join(moduleDir, 'composables');
    const composablesDest = join(modulesDir, 'composables');
    if (existsSync(composablesSrc)) {
      mkdirSync(composablesDest, { recursive: true });
      cpSync(composablesSrc, composablesDest, { recursive: true });
    }
  }

  // Copy lib files
  if (moduleConfig.files?.lib) {
    const libSrc = join(moduleDir, 'lib');
    const libDest = join(modulesDir, 'lib');
    if (existsSync(libSrc)) {
      mkdirSync(libDest, { recursive: true });
      cpSync(libSrc, libDest, { recursive: true });
    }
  }

  // Copy pages
  if (moduleConfig.files?.pages) {
    const pagesSrc = join(moduleDir, 'pages', frameworkDir);
    const pagesDest = join(modulesDir, 'pages');
    if (existsSync(pagesSrc)) {
      mkdirSync(pagesDest, { recursive: true });
      cpSync(pagesSrc, pagesDest, { recursive: true });
    }
  }

  // Copy data files
  if (moduleConfig.files?.data) {
    const dataSrc = join(moduleDir, 'data');
    const dataDest = join(modulesDir, 'data');
    if (existsSync(dataSrc)) {
      mkdirSync(dataDest, { recursive: true });
      cpSync(dataSrc, dataDest, { recursive: true });
    }
  }

  // Copy contracts to bedrock
  if (moduleConfig.files?.contracts) {
    const contractsSrc = join(moduleDir, 'contracts');
    if (existsSync(contractsSrc)) {
      mkdirSync(bedrockModulesDir, { recursive: true });
      cpSync(contractsSrc, bedrockModulesDir, { recursive: true });
    }
  }

  // Copy module.json for reference
  const moduleConfigSrc = join(moduleDir, MODULE_CONFIG_FILE);
  if (existsSync(moduleConfigSrc)) {
    cpSync(moduleConfigSrc, join(modulesDir, MODULE_CONFIG_FILE));
  }
}

/**
 * Install npm dependencies for a module
 */
function installModuleDependencies(
  projectDir: string,
  dependencies: string[],
  packageManager: 'pnpm' | 'npm' | 'yarn'
): boolean {
  if (dependencies.length === 0) {
    return true;
  }

  try {
    const depsString = dependencies.join(' ');
    let command: string;

    switch (packageManager) {
      case 'pnpm':
        command = `pnpm add ${depsString}`;
        break;
      case 'yarn':
        command = `yarn add ${depsString}`;
        break;
      default:
        command = `npm install ${depsString}`;
    }

    // Install in the web app directory
    const webDir = join(projectDir, 'apps', 'web');
    execSync(command, { cwd: webDir, stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Run post-install script if it exists
 */
function runPostInstall(
  moduleDir: string,
  projectDir: string,
  framework: 'nextjs' | 'nuxt'
): boolean {
  const postInstallScript = join(moduleDir, 'install.js');
  if (!existsSync(postInstallScript)) {
    return true;
  }

  try {
    // Pass project info as environment variables
    execSync(`node "${postInstallScript}"`, {
      cwd: projectDir,
      stdio: 'pipe',
      env: {
        ...process.env,
        SCAFFOLD_XRP_PROJECT_DIR: projectDir,
        SCAFFOLD_XRP_FRAMEWORK: framework,
        SCAFFOLD_XRP_WEB_DIR: join(projectDir, 'apps', 'web'),
      },
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Install a module into a project
 */
export async function installModule(
  options: InstallModuleOptions
): Promise<{ success: boolean; moduleName?: string; error?: string }> {
  const { projectDir, moduleSource, framework, packageManager, silent } = options;

  const spinner = silent ? null : ora(`Resolving module: ${moduleSource}`).start();

  // Resolve module source
  const resolved = await resolveModuleSource(moduleSource);
  if (!resolved) {
    spinner?.fail(`Module not found: ${moduleSource}`);
    return {
      success: false,
      error: `Module "${moduleSource}" not found in registry. Use a direct git URL instead.`,
    };
  }

  if (spinner) spinner.text = `Cloning module: ${resolved.name}`;

  // Clone to temp directory
  const tempDir = join(projectDir, '.scaffold-xrp-temp', resolved.name);
  if (!cloneModule(resolved.url, tempDir)) {
    spinner?.fail(`Failed to clone module: ${resolved.name}`);
    rmSync(join(projectDir, '.scaffold-xrp-temp'), { recursive: true, force: true });
    return { success: false, error: `Failed to clone module from ${resolved.url}` };
  }

  // Read module config
  const moduleConfig = readModuleConfig(tempDir);
  if (!moduleConfig) {
    spinner?.fail(`Invalid module: ${resolved.name} (missing module.json)`);
    rmSync(join(projectDir, '.scaffold-xrp-temp'), { recursive: true, force: true });
    return { success: false, error: 'Module is missing module.json configuration file' };
  }

  // Check framework compatibility
  if (
    moduleConfig.compatibility?.frameworks &&
    !moduleConfig.compatibility.frameworks.includes(framework)
  ) {
    spinner?.fail(`Module ${resolved.name} is not compatible with ${framework}`);
    rmSync(join(projectDir, '.scaffold-xrp-temp'), { recursive: true, force: true });
    return {
      success: false,
      error: `Module is not compatible with ${framework}. Supported: ${moduleConfig.compatibility.frameworks.join(', ')}`,
    };
  }

  if (spinner) spinner.text = `Installing module: ${moduleConfig.name}`;

  // Copy files
  try {
    copyModuleFiles(tempDir, projectDir, moduleConfig, framework);
  } catch (error) {
    spinner?.fail(`Failed to copy module files`);
    rmSync(join(projectDir, '.scaffold-xrp-temp'), { recursive: true, force: true });
    return { success: false, error: 'Failed to copy module files' };
  }

  // Install npm dependencies
  if (moduleConfig.dependencies?.npm && moduleConfig.dependencies.npm.length > 0) {
    if (spinner) spinner.text = `Installing dependencies for: ${moduleConfig.name}`;
    if (!installModuleDependencies(projectDir, moduleConfig.dependencies.npm, packageManager)) {
      spinner?.warn(`Some dependencies may not have been installed`);
    }
  }

  // Run post-install script
  if (!runPostInstall(tempDir, projectDir, framework)) {
    spinner?.warn(`Post-install script failed for: ${moduleConfig.name}`);
  }

  // Update scaffold config
  const config = readScaffoldConfig(projectDir) || initScaffoldConfig(projectDir, framework);
  const installedModule: InstalledModule = {
    version: moduleConfig.version,
    source: resolved.url,
    installedAt: new Date().toISOString(),
    framework,
  };
  config.installedModules[moduleConfig.name] = installedModule;
  writeScaffoldConfig(projectDir, config);

  // Cleanup temp directory
  rmSync(join(projectDir, '.scaffold-xrp-temp'), { recursive: true, force: true });

  spinner?.succeed(`Installed module: ${moduleConfig.name} v${moduleConfig.version}`);

  return { success: true, moduleName: moduleConfig.name };
}

/**
 * Install multiple modules
 */
export async function installModules(
  projectDir: string,
  modulesSources: string[],
  framework: 'nextjs' | 'nuxt',
  packageManager: 'pnpm' | 'npm' | 'yarn'
): Promise<{ installed: string[]; failed: string[] }> {
  const installed: string[] = [];
  const failed: string[] = [];

  for (const source of modulesSources) {
    const result = await installModule({
      projectDir,
      moduleSource: source,
      framework,
      packageManager,
    });

    if (result.success && result.moduleName) {
      installed.push(result.moduleName);
    } else {
      failed.push(source);
    }
  }

  return { installed, failed };
}

/**
 * Remove a module from a project
 */
export function removeModule(
  projectDir: string,
  moduleName: string
): { success: boolean; error?: string } {
  const config = readScaffoldConfig(projectDir);
  if (!config) {
    return { success: false, error: 'Not a scaffold-xrp project (missing .scaffold-xrp.json)' };
  }

  if (!config.installedModules[moduleName]) {
    return { success: false, error: `Module "${moduleName}" is not installed` };
  }

  const spinner = ora(`Removing module: ${moduleName}`).start();

  try {
    // Remove module directory from web app
    const webModuleDir = join(projectDir, 'apps', 'web', 'modules', moduleName);
    if (existsSync(webModuleDir)) {
      rmSync(webModuleDir, { recursive: true, force: true });
    }

    // Remove module directory from bedrock
    const bedrockModuleDir = join(projectDir, 'packages', 'bedrock', 'modules', moduleName);
    if (existsSync(bedrockModuleDir)) {
      rmSync(bedrockModuleDir, { recursive: true, force: true });
    }

    // Update config
    delete config.installedModules[moduleName];
    writeScaffoldConfig(projectDir, config);

    spinner.succeed(`Removed module: ${moduleName}`);
    return { success: true };
  } catch (error) {
    spinner.fail(`Failed to remove module: ${moduleName}`);
    return { success: false, error: 'Failed to remove module files' };
  }
}

/**
 * List installed modules in a project
 */
export function listInstalledModules(projectDir: string): Record<string, InstalledModule> {
  const config = readScaffoldConfig(projectDir);
  return config?.installedModules || {};
}

/**
 * Check if running inside a scaffold-xrp project
 */
export function isScaffoldXrpProject(dir: string): boolean {
  // Check for scaffold config file
  if (existsSync(join(dir, SCAFFOLD_CONFIG_FILE))) {
    return true;
  }

  // Check for typical scaffold-xrp structure
  const hasAppsWeb = existsSync(join(dir, 'apps', 'web'));
  const hasPackagesBedrock = existsSync(join(dir, 'packages', 'bedrock'));
  const hasTurboJson = existsSync(join(dir, 'turbo.json'));

  return hasAppsWeb && hasPackagesBedrock && hasTurboJson;
}
