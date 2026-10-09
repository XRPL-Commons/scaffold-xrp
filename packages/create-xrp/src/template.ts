import { cpSync, existsSync, readdirSync, renameSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { CliError } from './errors.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const TEMPLATE_DIR = join(__dirname, '../template');

function restoreGitignoreFiles(directory: string): void {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const sourcePath = join(directory, entry.name);
    if (entry.isDirectory()) {
      restoreGitignoreFiles(sourcePath);
    } else if (entry.name === '_gitignore') {
      renameSync(sourcePath, join(directory, '.gitignore'));
    }
  }
}

/**
 * Return the immutable scaffold snapshot shipped in the npm package.
 *
 * The build step creates this directory from the repository checkout. Runtime
 * scaffolding must never fetch a moving Git branch, so a missing snapshot is
 * treated as a packaging error.
 */
export function getTemplateDir(): string {
  if (!existsSync(join(TEMPLATE_DIR, 'package.json')) || !existsSync(join(TEMPLATE_DIR, '_gitignore'))) {
    throw new CliError(
      'The packaged scaffold template is missing. Rebuild create-xrp before running it.',
    );
  }
  return TEMPLATE_DIR;
}

export function copyBundledTemplate(targetDir: string): void {
  cpSync(getTemplateDir(), targetDir, { recursive: true, errorOnExist: true });
  restoreGitignoreFiles(targetDir);
}
