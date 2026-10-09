#!/usr/bin/env node

import { cpSync, existsSync, mkdirSync, readdirSync, renameSync, rmSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoDir = resolve(packageDir, '../..');
const templateDir = join(packageDir, 'template');

const rootFiles = [
  '.gitignore',
  'CONTRIBUTING.md',
  'LICENSE',
  'QUICKSTART.md',
  'README.md',
  'README-without-sc.md',
  'package.json',
  'pnpm-workspace.yaml',
  'turbo.json',
];
const rootDirectories = ['apps', 'packages/bedrock'];
const excludedNames = new Set([
  '.git',
  '.next',
  '.nuxt',
  '.output',
  '.pnpm-store',
  '.turbo',
  'build',
  'coverage',
  'dist',
  'node_modules',
  'target',
  'tasks',
]);
const excludedFiles = new Set([
  'Cargo.lock',
  'next-env.d.ts',
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
]);

export function shouldCopy(sourcePath) {
  const name = basename(sourcePath);
  if (!name) return true;
  if (excludedNames.has(name) || excludedFiles.has(name)) return false;
  if (name.endsWith('.tsbuildinfo')) return false;
  if (name.startsWith('.env') && !name.endsWith('.example')) return false;
  return true;
}

function copyEntry(relativePath) {
  const sourcePath = join(repoDir, relativePath);
  if (!existsSync(sourcePath)) return;
  const destinationRelativePath = relativePath === '.gitignore' ? '_gitignore' : relativePath;
  const destinationPath = join(templateDir, destinationRelativePath);
  cpSync(sourcePath, destinationPath, {
    recursive: true,
    filter: shouldCopy,
  });
}

function renameGitignoreFiles(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const sourcePath = join(directory, entry.name);
    if (entry.isDirectory()) {
      renameGitignoreFiles(sourcePath);
    } else if (entry.name === '.gitignore') {
      renameSync(sourcePath, join(directory, '_gitignore'));
    }
  }
}

export function packageTemplate() {
  rmSync(templateDir, { recursive: true, force: true });
  mkdirSync(templateDir, { recursive: true });

  for (const relativePath of rootFiles) copyEntry(relativePath);
  for (const relativePath of rootDirectories) copyEntry(relativePath);
  renameGitignoreFiles(templateDir);

  console.log(`Packaged scaffold template at ${templateDir}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  packageTemplate();
}
