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
// Pinned (no ^) — pre-release with no semver guarantees; bump manually when a new build is available.
const XRPL_VAULTS = 'npm:@willem-xrpl/xrpl@4.6.0-smartvaults.1';

/**
 * Update the xrpl dependency in a web app's package.json based on selected primitives.
 * This function owns the read-modify-write cycle for the target package.json — do not
 * call it concurrently with other package.json mutations.
 *
 * When both contract and vault/escrow are selected, the vaults fork is used as the
 * primary "xrpl" package. xrpl-connect resolves "xrpl" for transaction serialization,
 * so the primary package must understand all selected transaction types. The vaults fork
 * (@willem-xrpl/xrpl) is the newer fork and supports contract tx types as well. The
 * contract fork is aliased as "xrpl-contracts" for any contract-specific imports.
 */
export function updateXrplDependencies(
  packageJsonPath: string,
  primitives: Primitive[]
): void {
  const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

  const deps = pkg.dependencies || {};

  // Remove existing xrpl entries
  delete deps['xrpl'];
  delete deps['xrpl-contracts'];

  const hasContract = primitives.includes('contract');
  const hasVaultOrEscrow =
    primitives.includes('vault') || primitives.includes('escrow');

  if (hasVaultOrEscrow) {
    // Vaults fork is primary — it supports vault/escrow AND contract tx types.
    // xrpl-connect will use this for serialization.
    deps['xrpl'] = XRPL_VAULTS;
    if (hasContract) {
      // Keep the contract fork available as an alias in case of contract-specific needs
      deps['xrpl-contracts'] = XRPL_CONTRACT;
    }
  } else if (hasContract) {
    deps['xrpl'] = XRPL_CONTRACT;
  } else {
    // No primitives — standard release
    deps['xrpl'] = XRPL_STANDARD;
  }

  pkg.dependencies = deps;
  writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + '\n');
}
