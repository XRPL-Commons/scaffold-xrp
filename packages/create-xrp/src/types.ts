/**
 * Type definitions for the scaffold-xrp CLI and module system
 */

export interface Answers {
  projectName: string;
  framework: 'nextjs' | 'nuxt';
  packageManager: 'pnpm' | 'npm' | 'yarn';
  modules?: string[];
}

export interface ModuleConfig {
  name: string;
  version: string;
  description: string;
  author?: string;
  compatibility?: {
    'scaffold-xrp'?: string;
    frameworks?: ('nextjs' | 'nuxt')[];
  };
  files?: {
    components?: string[];
    hooks?: string[];
    composables?: string[];
    lib?: string[];
    contracts?: string[];
    pages?: string[];
    data?: string[];
  };
  dependencies?: {
    npm?: string[];
    modules?: string[];
  };
  postInstall?: string;
}

export interface RegistryModule {
  repo: string;
  description: string;
  author?: string;
  tags?: string[];
}

export interface Registry {
  version: string;
  modules: Record<string, RegistryModule>;
}

export interface InstalledModule {
  version: string;
  source: string;
  installedAt: string;
  framework: 'nextjs' | 'nuxt';
}

export interface ScaffoldConfig {
  framework: 'nextjs' | 'nuxt';
  installedModules: Record<string, InstalledModule>;
}

export interface InstallModuleOptions {
  projectDir: string;
  moduleSource: string;
  framework: 'nextjs' | 'nuxt';
  packageManager: 'pnpm' | 'npm' | 'yarn';
  silent?: boolean;
}
