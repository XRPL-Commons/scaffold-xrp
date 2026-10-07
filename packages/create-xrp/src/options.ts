import { CliError } from './errors.js';
import type { Primitive } from './types.js';

export const ALL_PRIMITIVES: readonly Primitive[] = ['contract', 'vault', 'escrow'];

export type Framework = 'nextjs' | 'nuxt';
export type PackageManager = 'pnpm' | 'npm' | 'yarn';

export interface CliOptions {
  modules?: string;
  framework?: string;
  pm?: string;
  primitives?: string;
  experimental?: boolean;
  skipInstall?: boolean;
}

export function parseFramework(value?: string): Framework | undefined {
  if (value === undefined) return undefined;
  if (value === 'nextjs' || value === 'nuxt') return value;
  throw new CliError(`Invalid framework "${value}". Choose nextjs or nuxt.`);
}

export function parsePackageManager(value?: string): PackageManager | undefined {
  if (value === undefined) return undefined;
  if (value === 'pnpm' || value === 'npm' || value === 'yarn') return value;
  throw new CliError(`Invalid package manager "${value}". Choose pnpm, npm, or yarn.`);
}

export function parsePrimitives(value: string | undefined, experimental: boolean): Primitive[] | undefined {
  if (value === undefined) return undefined;
  if (!experimental) {
    throw new CliError('--primitives requires --experimental. Experimental features are opt-in.');
  }

  const raw = value.split(',').map((primitive) => primitive.trim()).filter(Boolean);
  if (raw.length === 0) {
    throw new CliError('--primitives requires at least one primitive. Choose contract, vault, or escrow.');
  }
  const invalid = raw.filter((primitive) => !ALL_PRIMITIVES.includes(primitive as Primitive));
  if (invalid.length > 0) {
    throw new CliError(`Unknown primitives: ${invalid.join(', ')}. Valid primitives: ${ALL_PRIMITIVES.join(', ')}`);
  }
  const duplicates = raw.filter((primitive, index) => raw.indexOf(primitive) !== index);
  if (duplicates.length > 0) {
    throw new CliError(`Duplicate primitives: ${[...new Set(duplicates)].join(', ')}.`);
  }

  return raw as Primitive[];
}

export function hasAllNonInteractiveOptions(
  projectName: string | undefined,
  options: CliOptions,
): boolean {
  return Boolean(projectName && options.framework && options.pm);
}

export function shouldPromptExperimental(
  projectName: string | undefined,
  options: CliOptions,
): boolean {
  return options.experimental === undefined && !hasAllNonInteractiveOptions(projectName, options);
}

export function validateExperimentalPrimitives(
  experimental: boolean,
  primitives: Primitive[],
): Primitive[] {
  if (experimental && primitives.length === 0) {
    throw new CliError(
      'Select at least one experimental primitive, or answer no to experimental features.',
    );
  }
  return primitives;
}
