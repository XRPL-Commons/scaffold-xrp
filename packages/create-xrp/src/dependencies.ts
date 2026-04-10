/**
 * Manage xrpl.js dependencies based on selected primitives.
 *
 *   any primitive → @xrpl-commons/xrpl ^4.6.0
 *   none          → xrpl ^3.1.0 (standard release)
 */

import { readFileSync, writeFileSync } from 'fs';
import type { Primitive } from './types.js';

const XRPL_STANDARD = '^3.1.0';
const XRPL_COMMONS = '^4.6.0';

/**
 * Update the xrpl dependency in a web app's package.json based on selected primitives.
 * This function owns the read-modify-write cycle for the target package.json — do not
 * call it concurrently with other package.json mutations.
 *
 * When any primitive is selected, @xrpl-commons/xrpl is used — it supports all
 * transaction types (vault, escrow, contract).
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
  delete deps['@xrpl-commons/xrpl'];

  const hasPrimitives =
    primitives.includes('vault') ||
    primitives.includes('escrow') ||
    primitives.includes('contract');

  if (hasPrimitives) {
    deps['@xrpl-commons/xrpl'] = XRPL_COMMONS;
  } else {
    deps['xrpl'] = XRPL_STANDARD;
  }

  pkg.dependencies = deps;
  writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + '\n');
}
