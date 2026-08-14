/**
 * Local Storage Adapter
 *
 * Uses browser localStorage (persists across sessions).
 * Higher XSS risk - use only in development or with "remember me" feature.
 */

import { Injectable } from '@angular/core';
import { StorageAdapter } from './storage.adapter';

@Injectable({ providedIn: 'root' })
export class LocalStorageAdapter implements StorageAdapter {
  getItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.warn('Failed to set item in localStorage:', error);
    }
  }

  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore errors
    }
  }

  clear(): void {
    try {
      localStorage.clear();
    } catch {
      // Ignore errors
    }
  }
}
