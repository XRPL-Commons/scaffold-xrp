/**
 * Manage xrpl.js dependencies based on selected primitives.
 *
 * Each primitive requires a specific xrpl.js fork:
 *   contract → @transia/xrpl ^4.4.6-alpha.0
 *   vault    → @willem-xrpl/xrpl 4.6.0-smartvaults.1
 *   escrow   → @willem-xrpl/xrpl 4.6.0-smartvaults.1
 *   none     → xrpl ^3.1.0 (standard release)
 */

import { readFileSync, writeFileSync } from 'fs';
import type { Primitive } from './types.js';

const XRPL_STANDARD = '^3.1.0';
const XRPL_CONTRACT = 'npm:@transia/xrpl@^4.4.6-alpha.0';
const XRPL_VAULTS = 'npm:@willem-xrpl/xrpl@4.6.0-smartvaults.1';

/**
 * Update the xrpl dependency in a web app's package.json based on selected primitives.
 *
 * When both contract and vault/escrow are selected, we use npm aliasing:
 *   "xrpl" → contract fork (used by ContractInteraction)
 *   "xrpl-vaults" → vaults fork (used by VaultInteraction / EscrowInteraction)
 */
export function updateXrplDependencies(
  packageJsonPath: string,
  primitives: Primitive[]
): void {
  const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

  const deps = pkg.dependencies || {};

  // Remove existing xrpl entries
  delete deps['xrpl'];
  delete deps['xrpl-vaults'];

  const hasContract = primitives.includes('contract');
  const hasVaultOrEscrow =
    primitives.includes('vault') || primitives.includes('escrow');

  if (hasContract && hasVaultOrEscrow) {
    // Both forks needed — alias the vaults fork
    deps['xrpl'] = XRPL_CONTRACT;
    deps['xrpl-vaults'] = XRPL_VAULTS;
  } else if (hasContract) {
    deps['xrpl'] = XRPL_CONTRACT;
  } else if (hasVaultOrEscrow) {
    deps['xrpl'] = XRPL_VAULTS;
  } else {
    // No primitives — standard release
    deps['xrpl'] = XRPL_STANDARD;
  }

  pkg.dependencies = deps;
  writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + '\n');
}
