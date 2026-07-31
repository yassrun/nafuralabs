/**
 * Turn a domain key into a display label (e.g. `account_payable` → `Account Payable`).
 */
export function humanizeDomainKey(domainKey: string): string {
  if (!domainKey) return '';
  return domainKey
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}
