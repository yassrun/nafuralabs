/**
 * Session Storage Adapter
 *
 * Uses browser sessionStorage (survives refresh, cleared on tab close).
 * Recommended for production use.
 */

import { Injectable } from '@angular/core';
import { StorageAdapter } from './storage.adapter';

@Injectable({ providedIn: 'root' })
export class SessionStorageAdapter implements StorageAdapter {
  getItem(key: string): string | null {
    try {
      return sessionStorage.getItem(key);
    } catch {
      // Storage may be disabled or quota exceeded
      return null;
    }
  }

  setItem(key: string, value: string): void {
    try {
      sessionStorage.setItem(key, value);
    } catch (error) {
      // Storage quota exceeded or disabled
      console.warn('Failed to set item in sessionStorage:', error);
    }
  }

  removeItem(key: string): void {
    try {
      sessionStorage.removeItem(key);
    } catch {
      // Ignore errors
    }
  }

  clear(): void {
    try {
      sessionStorage.clear();
    } catch {
      // Ignore errors
    }
  }
}
