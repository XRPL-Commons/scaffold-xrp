import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const framework = process.argv[2];
assert.ok(['nextjs', 'nuxt'].includes(framework), 'Usage: node scripts/verify-starter.mjs nextjs|nuxt');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const temporary = mkdtempSync(join(tmpdir(), `scaffold-xrp-${framework}-`));
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function run(command, args, cwd) {
  execFileSync(command, args, {
    cwd,
    stdio: 'inherit',
    env: { ...process.env, CI: 'true', NEXT_TELEMETRY_DISABLED: '1', NUXT_TELEMETRY_DISABLED: '1' },
    timeout: 600_000,
  });
}

console.log(`Verifying the packaged ${framework} starter in ${temporary}`);
try {
  const packed = JSON.parse(execFileSync(npm, ['pack', '--ignore-scripts', '--json', '--pack-destination', temporary], {
    cwd: join(root, 'packages/create-xrp'),
    encoding: 'utf8',
  }));
  const runner = join(temporary, 'runner');
  mkdirSync(runner);
  run(npm, ['install', '--no-audit', '--no-fund', '--ignore-scripts', join(temporary, packed[0].filename)], runner);
  const cli = join(runner, 'node_modules/create-xrp/dist/index.js');
  run(process.execPath, [cli, 'payment-app', '--framework', framework, '--pm', 'npm', '--no-experimental', '--skip-install'], temporary);

  const project = join(temporary, 'payment-app');
  const manifest = JSON.parse(readFileSync(join(project, 'package.json'), 'utf8'));
  assert.equal(manifest.name, 'payment-app');
  assert.ok(!existsSync(join(project, 'packages/bedrock')), 'Default projects must not include Bedrock');
  assert.ok(!existsSync(join(project, 'pnpm-lock.yaml')), 'Generated projects must not inherit the monorepo lockfile');
  assert.ok(existsSync(join(project, '.env.example')), 'Wallet configuration example must be packaged');
  const page = readFileSync(join(project, framework === 'nextjs' ? 'app/page.js' : 'pages/index.vue'), 'utf8');
  assert.match(page, /TransactionForm/);
  assert.doesNotMatch(page, /ContractInteraction|VaultInteraction|EscrowInteraction|MPTokenCard/);
  const binding = `@xrpl-commons/xrpl-connect-${framework === 'nextjs' ? 'react' : 'vue'}`;
  assert.ok(manifest.dependencies[binding], 'Generated apps must use the official framework binding');
  const readme = readFileSync(join(project, 'README.md'), 'utf8');
  assert.match(readme, /Xaman/);
  assert.match(readme, /WalletConnect/);

  run(npm, ['install', '--no-audit', '--no-fund'], project);
  run(npm, ['run', 'lint'], project);
  run(npm, ['run', '--if-present', 'type-check'], project);
  run(npm, ['run', '--if-present', 'test'], project);
  run(npm, ['run', 'build'], project);
  console.log(`Packaged ${framework} starter passed all checks: ${project}`);
  if (process.env.STARTER_SMOKE_KEEP !== '1') rmSync(temporary, { recursive: true, force: true });
} catch (error) {
  console.error(`Starter verification failed; fixture retained at ${temporary}`);
  throw error;
}
