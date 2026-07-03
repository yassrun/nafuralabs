/**
 * Storage Adapter Interface
 *
 * Abstraction for storage operations to support different storage strategies:
 * - Memory-only (high security, no persistence)
 * - SessionStorage (survives refresh, cleared on tab close)
 * - LocalStorage (persists across sessions, XSS risk)
 */

export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
}
