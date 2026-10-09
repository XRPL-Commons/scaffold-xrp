import assert from 'node:assert/strict';
import { chmodSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { parse as parseYaml } from 'yaml';

import {
  parseFramework,
  parsePackageManager,
  parsePrimitives,
  shouldPromptExperimental,
  validateExperimentalPrimitives,
} from '../dist/options.js';
import { generateNextJsPage, generateNuxtPage } from '../dist/page-generator.js';
import { shouldCopy } from '../scripts/package-template.mjs';

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
  assert.equal(shouldPromptExperimental(undefined, { framework: 'nextjs', pm: 'npm' }), true);
  assert.equal(shouldPromptExperimental(undefined, { framework: 'nextjs', pm: 'npm', experimental: false }), false);
  assert.deepEqual(validateExperimentalPrimitives(false, []), []);
  assert.throws(() => validateExperimentalPrimitives(true, []), /Select at least one experimental primitive/);
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
  assert.ok(existsSync(join(templateDir, '_gitignore')));
  assert.equal(existsSync(join(templateDir, '.gitignore')), false);
  assert.ok(existsSync(join(templateDir, 'apps', 'web')));
  assert.ok(existsSync(join(templateDir, 'apps', 'web-nuxt')));
  assert.equal(existsSync(join(templateDir, 'packages', 'create-xrp')), false);

  const forbidden = new Set(['pnpm-lock.yaml', 'package-lock.json', 'yarn.lock']);
  const visit = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (forbidden.has(entry.name)) assert.fail(`packaged template contains stale lockfile: ${path}`);
      if (entry.name.startsWith('.env')) {
        assert.match(entry.name, /\.example$/, `packaged template contains a secret env file: ${path}`);
      }
      if (entry.isDirectory()) visit(path);
    }
  };
  visit(templateDir);
  assert.equal(shouldCopy('/tmp/.env.production'), false);
  assert.equal(shouldCopy('/tmp/.env.local.example'), true);
  assert.equal(shouldCopy('/tmp/tsconfig.tsbuildinfo'), false);
  assert.equal(shouldCopy('/tmp/next-env.d.ts'), false);
});

test('noninteractive default generation creates clean Next and Nuxt starters', () => {
  const cwd = createTempDirectory('create-xrp-default');
  for (const [name, framework] of [['next-app', 'nextjs'], ['nuxt-app', 'nuxt']]) {
    const result = runCli(cwd, [name, '--framework', framework, '--pm', 'npm', '--no-experimental', '--skip-install']);
    assert.equal(result.status, 0, result.stderr || result.stdout);
    const projectDir = join(cwd, name);
    assert.ok(existsSync(join(projectDir, '.gitignore')));
    const pagePath = framework === 'nextjs' ? join(projectDir, 'app', 'page.tsx') : join(projectDir, 'pages', 'index.vue');
    const page = readFileSync(pagePath, 'utf8');
    assert.match(page, /TransactionForm/);
    assert.doesNotMatch(page, /ContractInteraction|VaultInteraction|EscrowInteraction|MPToken/);
    if (framework === 'nextjs') {
      assert.ok(existsSync(join(projectDir, 'tsconfig.json')));
      assert.equal(existsSync(join(projectDir, 'app', 'page.js')), false);
      assert.equal(existsSync(join(projectDir, 'components', 'ContractInteraction.tsx')), false);
      const manifest = JSON.parse(readFileSync(join(projectDir, 'package.json'), 'utf8'));
      assert.ok(manifest.scripts['type-check']);
    }
    const readme = readFileSync(join(projectDir, 'README.md'), 'utf8');
    assert.match(readme, /Xaman/);
    assert.match(readme, /GemWallet/);
    assert.match(readme, /WalletConnect/);
    assert.match(readme, framework === 'nextjs' ? /NEXT_PUBLIC_XAMAN_API_KEY/ : /NUXT_PUBLIC_XAMAN_API_KEY/);
    assert.match(readme, framework === 'nextjs' ? /NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID/ : /NUXT_PUBLIC_WALLETCONNECT_PROJECT_ID/);
    assert.match(readme, /amount in XRP/);
    assert.match(readme, /optional tag field/);
    assert.doesNotMatch(readme, /VITE_|DEFAULT_NETWORK=alphanet|Crossmark|Otsu/);
    assert.match(readme, /Node\.js `\^22\.18\.0 \|\| >=24\.11\.0`/);
    if (framework === 'nuxt') {
      assert.match(readme, /Runtime environment: `\.env` \(Nuxt reads `\.env`/);
      assert.doesNotMatch(readme, /Runtime environment: `\.env\.local`/);
    }
    assert.doesNotMatch(readme, /Bedrock smart|experimental primitives/);
    const installIndex = result.stdout.indexOf('npm install');
    const devIndex = result.stdout.indexOf('npm run dev');
    assert.ok(installIndex >= 0 && installIndex < devIndex, 'skip-install output must show install before dev');
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
  assert.ok(existsSync(join(projectDir, '.gitignore')));
  const page = readFileSync(join(projectDir, 'apps', 'web', 'app', 'page.tsx'), 'utf8');
  assert.match(page, /ContractInteraction/);
  assert.doesNotMatch(page, /MPToken/);
  assert.match(readFileSync(join(projectDir, 'README.md'), 'utf8'), /Bedrock-compatible/);
  assert.ok(existsSync(join(projectDir, 'packages', 'bedrock')));
  const turbo = JSON.parse(readFileSync(join(projectDir, 'turbo.json'), 'utf8'));
  assert.equal(turbo.tasks?.['create-xrp#build'], undefined);
});

test('generated projects retain dependency constraints for the chosen package manager', () => {
  const cwd = createTempDirectory('create-xrp-dependency-constraints');
  const templateManifest = JSON.parse(readFileSync(join(packageDir, 'template/package.json'), 'utf8'));
  const templatePnpmConfig = parseYaml(readFileSync(join(packageDir, 'template/pnpm-workspace.yaml'), 'utf8'));
  for (const packageManager of ['npm', 'pnpm', 'yarn']) {
    const result = runCli(cwd, [packageManager + '-app', '--framework', 'nextjs', '--pm', packageManager, '--no-experimental', '--skip-install']);
    assert.equal(result.status, 0, result.stderr || result.stdout);
    const manifest = JSON.parse(readFileSync(join(cwd, packageManager + '-app', 'package.json'), 'utf8'));
    if (packageManager === 'pnpm') {
      assert.equal(manifest.pnpm, undefined);
      const config = parseYaml(readFileSync(join(cwd, packageManager + '-app', 'pnpm-workspace.yaml'), 'utf8'));
      assert.equal(config.packages, undefined);
      assert.deepEqual(config.overrides, templatePnpmConfig.overrides);
      assert.deepEqual(config.allowBuilds, templatePnpmConfig.allowBuilds);
      assert.equal(config.allowBuilds['unrs-resolver'], true);
      assert.equal(config.allowBuilds.bufferutil, false);
    } else {
      assert.deepEqual(packageManager === 'yarn' ? manifest.resolutions : manifest.overrides, templateManifest.overrides);
    }
  }
});

test('Bedrock initialization failures return nonzero without false success', () => {
  const cwd = createTempDirectory('create-xrp-bedrock-errors');
  const binDir = join(cwd, 'bin');
  mkdirSync(binDir);
  writeExecutable(
    join(binDir, 'bedrock'),
    '#!/usr/bin/env node\nconst args = process.argv.slice(2);\nif (args[0] === "help") process.exit(0);\nif (args[0] === "init") process.exit(23);\n',
  );
  const result = runCli(
    cwd,
    ['bedrock-failure', '--framework', 'nextjs', '--pm', 'npm', '--experimental', '--primitives', 'contract', '--skip-install'],
    binDir,
  );
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Bedrock project setup failed/);
  assert.doesNotMatch(result.stdout, /Project created successfully/);
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
  writeExecutable(join(binDir, 'npm'), '#!/bin/sh\necho "INSTALL_FAILURE_ON_STDOUT"\necho "INSTALL_FAILURE_ON_STDERR" >&2\nexit 42\n');
  const installFailure = runCli(cwd, ['install-failure', '--framework', 'nextjs', '--pm', 'npm', '--no-experimental'], binDir);
  assert.notEqual(installFailure.status, 0);
  assert.match(installFailure.stderr, /Failed to install dependencies/);
  assert.match(installFailure.stdout, /INSTALL_FAILURE_ON_STDOUT/);
  assert.match(installFailure.stderr, /INSTALL_FAILURE_ON_STDERR/);
  assert.doesNotMatch(installFailure.stdout, /Project created successfully/);

  const gitBin = join(cwd, 'git-bin');
  mkdirSync(gitBin);
  writeExecutable(
    join(gitBin, 'git'),
    '#!/bin/sh\nif [ "$1" = "commit" ]; then echo "Author identity unknown" >&2; exit 1; fi\nexit 0\n',
  );
  const gitFailure = runCli(
    cwd,
    ['git-failure', '--framework', 'nextjs', '--pm', 'npm', '--no-experimental', '--skip-install'],
    gitBin,
  );
  assert.equal(gitFailure.status, 0, gitFailure.stderr || gitFailure.stdout);
  const gitOutput = `${gitFailure.stdout}\n${gitFailure.stderr}`;
  assert.match(gitOutput, /Git setup skipped/);
  assert.match(gitOutput, /Project created successfully/);
});
