/**
 * Example utility functions for scaffold-xrp module
 * These are framework-agnostic and can be used in both Next.js and Nuxt
 */

/**
 * Format an XRP amount for display
 */
export function formatXrp(drops: string | number): string {
  const dropsNum = typeof drops === 'string' ? parseInt(drops, 10) : drops;
  const xrp = dropsNum / 1_000_000;
  return xrp.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  });
}

/**
 * Validate an XRPL address
 */
export function isValidXrplAddress(address: string): boolean {
  return /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(address);
}

/**
 * Truncate an address for display
 */
export function truncateAddress(address: string, chars = 4): string {
  if (address.length <= chars * 2 + 3) {
    return address;
  }
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}
