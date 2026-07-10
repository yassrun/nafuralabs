/**
 * Safe UUID generation.
 *
 * `crypto.randomUUID()` is only exposed in *secure contexts* (HTTPS or
 * localhost). The app is served over plain HTTP on internal hosts
 * (e.g. http://erp.nafura.local), where `crypto.randomUUID` is `undefined`
 * and calling it throws a TypeError. `crypto.getRandomValues()` *is*
 * available in insecure contexts, so we build a RFC-4122 v4 UUID from it,
 * with a final Math.random() fallback for exotic environments.
 */
export function safeRandomUUID(): string {
  const c = typeof crypto !== 'undefined' ? crypto : undefined;

  if (c && typeof c.randomUUID === 'function') {
    return c.randomUUID();
  }

  if (c && typeof c.getRandomValues === 'function') {
    const bytes = new Uint8Array(16);
    c.getRandomValues(bytes);
    // Per RFC 4122 §4.4: set version (4) and variant (10xx) bits.
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0'));
    return (
      hex.slice(0, 4).join('') +
      '-' +
      hex.slice(4, 6).join('') +
      '-' +
      hex.slice(6, 8).join('') +
      '-' +
      hex.slice(8, 10).join('') +
      '-' +
      hex.slice(10, 16).join('')
    );
  }

  // Last-resort fallback (non-cryptographic).
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0;
    const v = ch === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
