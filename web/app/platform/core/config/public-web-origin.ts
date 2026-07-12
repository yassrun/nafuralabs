import { environment } from '@env';

type EnvWithPublicOrigin = typeof environment & { publicWebOrigin?: string };

/** OAuth redirect origin (pinned on staging HTTP to avoid mixed-content with IAM). */
export function getPublicWebOrigin(): string {
  const pinned = (environment as EnvWithPublicOrigin).publicWebOrigin;
  if (pinned) {
    return pinned;
  }
  if (typeof window === 'undefined') {
    return '';
  }
  return window.location.origin;
}

/** If the browser opens HTTPS on a staging host pinned to HTTP, bounce to HTTP. */
export function ensurePublicHttpOrigin(): void {
  const pinned = (environment as EnvWithPublicOrigin).publicWebOrigin;
  if (!pinned || typeof window === 'undefined') {
    return;
  }
  const expected = new URL(pinned);
  if (
    window.location.hostname === expected.hostname &&
    window.location.protocol === 'https:'
  ) {
    window.location.replace(
      pinned + window.location.pathname + window.location.search + window.location.hash,
    );
  }
}
