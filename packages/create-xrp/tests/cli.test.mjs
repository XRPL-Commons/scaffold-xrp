import assert from 'node:assert/strict';
import { chmodSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

import { parseFramework, parsePackageManager, parsePrimitives } from '../dist/options.js';
import { generateNextJsPage, generateNuxtPage } from '../dist/page-generator.js';

const packageDir = resolve(import.meta.dirname, '..');
const cliPath = join(packageDir, 'dist', 'index.js');

function createTempDirectory(prefix) {
  const path = join(tmpdir(), `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  mkdirSync(path, { recursive: true });
  return path;
}

function writeExecutable(path, contents) {
  writeFileSync(path, contents);
  chmodSync(path, 0o755);
}

function runCli(cwd, args, extraPath) {
  const env = {
    ...process.env,
    ...(extraPath ? { PATH: `${extraPath}:${process.env.PATH}` } : {}),
  };
  return spawnSync(process.execPath, [cliPath, ...args], {
    cwd,
    env,
    encoding: 'utf8',
  });
}

test('validates framework, package manager, and experimental primitive flags', () => {
  assert.equal(parseFramework('nextjs'), 'nextjs');
  assert.equal(parsePackageManager('npm'), 'npm');
  assert.deepEqual(parsePrimitives('contract,vault', true), ['contract', 'vault']);
  assert.throws(() => parseFramework('vite'), /Invalid framework/);
  assert.throws(() => parsePackageManager('bun'), /Invalid package manager/);
  assert.throws(() => parsePrimitives('contract', false), /requires --experimental/);
  assert.throws(() => parsePrimitives('unknown', true), /Unknown primitives/);
  assert.throws(() => parsePrimitives('', true), /requires at least one primitive/);
  assert.throws(() => parsePrimitives('contract,contract', true), /Duplicate primitives/);
});

test('generators omit MPTokens and keep the conventional starter minimal', () => {
  const nextPage = generateNextJsPage([]);
  const nuxtPage = generateNuxtPage([]);
  for (const page of [nextPage, nuxtPage]) {
    assert.match(page, /AccountInfo/);
    assert.match(page, /TransactionForm/);
    assert.doesNotMatch(page, /MPToken/);
    assert.doesNotMatch(page, /ContractInteraction/);
  }
});

test('build packages both framework templates without locks or the CLI source', () => {
  const templateDir = join(packageDir, 'template');
  assert.ok(existsSync(join(templateDir, 'package.json')));
  assert.ok(existsSync(join(templateDir, 'apps', 'web')));
  assert.ok(existsSync(join(templateDir, 'apps', 'web-nuxt')));
  assert.equal(existsSync(join(templateDir, 'packages', 'create-xrp')), false);

  const forbidden = new Set(['pnpm-lock.yaml', 'package-lock.json', 'yarn.lock']);
  const visit = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (forbidden.has(entry.name)) assert.fail(`packaged template contains stale lockfile: ${path}`);
      if (entry.isDirectory()) visit(path);
    }
  };
  visit(templateDir);
});

test('noninteractive default generation creates clean Next and Nuxt starters', () => {
  const cwd = createTempDirectory('create-xrp-default');
  for (const [name, framework] of [['next-app', 'nextjs'], ['nuxt-app', 'nuxt']]) {
    const result = runCli(cwd, [name, '--framework', framework, '--pm', 'npm', '--no-experimental', '--skip-install']);
    assert.equal(result.status, 0, result.stderr || result.stdout);
    const projectDir = join(cwd, name);
    const pagePath = framework === 'nextjs' ? join(projectDir, 'app', 'page.js') : join(projectDir, 'pages', 'index.vue');
    const page = readFileSync(pagePath, 'utf8');
    assert.match(page, /TransactionForm/);
    assert.doesNotMatch(page, /ContractInteraction|VaultInteraction|EscrowInteraction|MPToken/);
    assert.doesNotMatch(readFileSync(join(projectDir, 'README.md'), 'utf8'), /Bedrock smart|experimental primitives/);
  }
});

test('explicit experimental generation enables selected primitive and Bedrock setup', () => {
  const cwd = createTempDirectory('create-xrp-experimental');
  const binDir = join(cwd, 'bin');
  mkdirSync(binDir);
  writeExecutable(
    join(binDir, 'bedrock'),
    '#!/usr/bin/env node\nconst fs = require("node:fs");\nconst args = process.argv.slice(2);\nif (args[0] === "help") process.exit(0);\nif (args[0] === "init") fs.mkdirSync("bedrock", { recursive: true });\n',
  );
  const result = runCli(
    cwd,
    ['experimental-app', '--framework', 'nextjs', '--pm', 'npm', '--experimental', '--primitives', 'contract', '--skip-install'],
    binDir,
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const projectDir = join(cwd, 'experimental-app');
  const page = readFileSync(join(projectDir, 'apps', 'web', 'app', 'page.js'), 'utf8');
  assert.match(page, /ContractInteraction/);
  assert.doesNotMatch(page, /MPToken/);
  assert.match(readFileSync(join(projectDir, 'README.md'), 'utf8'), /Bedrock-compatible/);
  assert.ok(existsSync(join(projectDir, 'packages', 'bedrock')));
});

test('invalid CLI flags and dependency failures return nonzero', () => {
  const cwd = createTempDirectory('create-xrp-errors');
  const invalidFramework = runCli(cwd, ['bad-framework', '--framework', 'vite', '--pm', 'npm', '--no-experimental', '--skip-install']);
  assert.notEqual(invalidFramework.status, 0);
  assert.match(invalidFramework.stderr, /Invalid framework/);

  const invalidPm = runCli(cwd, ['bad-pm', '--framework', 'nextjs', '--pm', 'bun', '--no-experimental', '--skip-install']);
  assert.notEqual(invalidPm.status, 0);
  assert.match(invalidPm.stderr, /Invalid package manager/);

  const missingOptIn = runCli(cwd, ['missing-opt-in', '--framework', 'nextjs', '--pm', 'npm', '--primitives', 'contract', '--skip-install']);
  assert.notEqual(missingOptIn.status, 0);
  assert.match(missingOptIn.stderr, /requires --experimental/);

  const binDir = join(cwd, 'failing-bin');
  mkdirSync(binDir);
  writeExecutable(join(binDir, 'npm'), '#!/bin/sh\nexit 42\n');
  const installFailure = runCli(cwd, ['install-failure', '--framework', 'nextjs', '--pm', 'npm', '--no-experimental'], binDir);
  assert.notEqual(installFailure.status, 0);
  assert.match(installFailure.stderr, /Failed to install dependencies/);
  assert.doesNotMatch(installFailure.stdout, /Project created successfully/);
});
