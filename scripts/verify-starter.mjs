import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { delimiter, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const framework = process.argv[2];
const packageManager = process.argv[3] || 'npm';
const requestedPackageManagerVersion = process.argv[4]
  || (packageManager === 'pnpm' ? process.env.STARTER_SMOKE_PNPM_VERSION : undefined);
const usage = 'Usage: node scripts/verify-starter.mjs nextjs|nuxt [npm|pnpm] [pnpm-version]';
assert.ok(['nextjs', 'nuxt'].includes(framework), usage);
assert.ok(['npm', 'pnpm'].includes(packageManager), usage);
assert.ok(packageManager === 'pnpm' || !process.argv[4], 'A package manager version is only supported for pnpm');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const temporary = mkdtempSync(join(tmpdir(), `scaffold-xrp-${framework}-`));
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const childEnv = {
  ...process.env,
  CI: 'true',
  NEXT_TELEMETRY_DISABLED: '1',
  NUXT_TELEMETRY_DISABLED: '1',
};

function run(command, args, cwd) {
  execFileSync(command, args, {
    cwd,
    stdio: 'inherit',
    env: childEnv,
    timeout: 600_000,
  });
}

function normalizedVersion(version) {
  return version.trim().replace(/^v/, '');
}

function packageManagerVersion(command, cwd) {
  return execFileSync(command, ['--version'], {
    cwd,
    env: childEnv,
    encoding: 'utf8',
  }).trim();
}

function assertPnpmWorkspaceConfig(project, parseYaml) {
  const configPath = join(project, 'pnpm-workspace.yaml');
  assert.ok(existsSync(configPath), 'pnpm projects must retain pnpm-workspace.yaml');
  const config = parseYaml(readFileSync(configPath, 'utf8'));
  assert.equal(config.packages, undefined, 'Flattened pnpm projects must not declare workspace packages');
  const expectedBuildApprovals = {
    '@parcel/watcher': true,
    esbuild: true,
    sharp: true,
    'unrs-resolver': true,
    bufferutil: false,
    'es5-ext': false,
    'utf-8-validate': false,
  };
  assert.deepEqual(config.allowBuilds, expectedBuildApprovals, 'pnpm build approvals must be preserved');
}

function configurePackageManager() {
  if (packageManager === 'npm') return npm;

  if (requestedPackageManagerVersion) {
    const toolDir = join(temporary, 'package-manager');
    mkdirSync(toolDir);
    execFileSync(
      npm,
      [
        'install',
        '--no-audit',
        '--no-fund',
        '--ignore-scripts',
        '--no-save',
        '--no-package-lock',
        '--prefix',
        toolDir,
        `pnpm@${requestedPackageManagerVersion}`,
      ],
      { cwd: temporary, stdio: 'inherit', env: childEnv, timeout: 600_000 },
    );

    const toolBin = join(toolDir, 'node_modules', '.bin');
    const selectedPnpm = join(toolBin, pnpm);
    assert.ok(existsSync(selectedPnpm), `pnpm ${requestedPackageManagerVersion} was not installed in the temporary tool directory`);
    childEnv.PATH = [toolBin, childEnv.PATH].filter(Boolean).join(delimiter);
    const installedVersion = packageManagerVersion(selectedPnpm, temporary);
    assert.equal(
      normalizedVersion(installedVersion),
      normalizedVersion(requestedPackageManagerVersion),
      `Expected pnpm ${requestedPackageManagerVersion}, found ${installedVersion}`,
    );
    return selectedPnpm;
  }

  const installedVersion = packageManagerVersion(pnpm, temporary);
  console.log(`Using pnpm ${installedVersion} from PATH`);
  return pnpm;
}

console.log(`Verifying the packaged ${framework} starter in ${temporary}`);
try {
  const packed = JSON.parse(execFileSync(npm, ['pack', '--ignore-scripts', '--json', '--pack-destination', temporary], {
    cwd: join(root, 'packages/create-xrp'),
    encoding: 'utf8',
  }));
  const selectedPackageManager = configurePackageManager();
  const runner = join(temporary, 'runner');
  mkdirSync(runner);
  run(npm, ['install', '--no-audit', '--no-fund', '--ignore-scripts', join(temporary, packed[0].filename)], runner);
  const cli = join(runner, 'node_modules/create-xrp/dist/index.js');
  const { parse: parseYaml } = createRequire(cli)('yaml');
  run(process.execPath, [cli, 'payment-app', '--framework', framework, '--pm', packageManager, '--no-experimental'], temporary);

  const project = join(temporary, 'payment-app');
  const manifest = JSON.parse(readFileSync(join(project, 'package.json'), 'utf8'));
  assert.equal(manifest.name, 'payment-app');
  assert.ok(!existsSync(join(project, 'packages/bedrock')), 'Default projects must not include Bedrock');
  assert.ok(existsSync(join(project, '.env.example')), 'Wallet configuration example must be packaged');
  if (framework === 'nextjs') {
    assert.ok(existsSync(join(project, 'tsconfig.json')), 'Next.js starters must include tsconfig.json');
    assert.ok(manifest.scripts?.['type-check'], 'Next.js starters must expose a type-check script');
  }
  const ignore = readFileSync(join(project, '.gitignore'), 'utf8');
  assert.match(ignore, /node_modules/);
  assert.match(ignore, /\.env/);
  const page = readFileSync(join(project, framework === 'nextjs' ? 'app/page.tsx' : 'pages/index.vue'), 'utf8');
  assert.match(page, /TransactionForm/);
  assert.doesNotMatch(page, /ContractInteraction|VaultInteraction|EscrowInteraction|MPTokenCard/);
  const binding = `@xrpl-commons/xrpl-connect-${framework === 'nextjs' ? 'react' : 'vue'}`;
  assert.ok(manifest.dependencies[binding], 'Generated apps must use the official framework binding');
  const readme = readFileSync(join(project, 'README.md'), 'utf8');
  assert.match(readme, /Xaman/);
  assert.match(readme, /WalletConnect/);

  if (packageManager === 'npm') {
    assert.ok(existsSync(join(project, 'package-lock.json')), 'npm CLI installation must create package-lock.json');
    assert.ok(!existsSync(join(project, 'pnpm-lock.yaml')), 'npm projects must not create pnpm-lock.yaml');
    assert.ok(!existsSync(join(project, 'pnpm-workspace.yaml')), 'npm projects must not retain pnpm-workspace.yaml');
  } else {
    assert.ok(existsSync(join(project, 'pnpm-lock.yaml')), 'pnpm CLI installation must create pnpm-lock.yaml');
    assert.ok(!existsSync(join(project, 'package-lock.json')), 'pnpm projects must not create package-lock.json');
    assert.equal(manifest.pnpm, undefined, 'pnpm settings belong in pnpm-workspace.yaml, not package.json');
    assertPnpmWorkspaceConfig(project, parseYaml);
    const actualVersion = packageManagerVersion(selectedPackageManager, project);
    if (requestedPackageManagerVersion) {
      assert.equal(
        normalizedVersion(actualVersion),
        normalizedVersion(requestedPackageManagerVersion),
        `Generated project used pnpm ${actualVersion}; expected ${requestedPackageManagerVersion}`,
      );
    }
  }

  run(selectedPackageManager, ['run', 'lint'], project);
  run(selectedPackageManager, ['run', 'type-check'], project);
  run(selectedPackageManager, ['run', '--if-present', 'test'], project);
  run(selectedPackageManager, ['run', 'build'], project);
  console.log(`Packaged ${framework} starter passed all checks with ${packageManager}: ${project}`);
  if (process.env.STARTER_SMOKE_KEEP !== '1') rmSync(temporary, { recursive: true, force: true });
} catch (error) {
  console.error(`Starter verification failed; fixture retained at ${temporary}`);
  throw error;
}
