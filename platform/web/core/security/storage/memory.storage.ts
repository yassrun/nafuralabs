/**
 * Memory Storage Adapter
 *
 * In-memory storage for high-security mode.
 * Data is lost on page refresh or navigation.
 */

import { Injectable } from '@angular/core';
import { StorageAdapter } from './storage.adapter';

@Injectable({ providedIn: 'root' })
export class MemoryStorage implements StorageAdapter {
  private storage = new Map<string, string>();

  getItem(key: string): string | null {
    return this.storage.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.storage.set(key, value);
  }

  removeItem(key: string): void {
    this.storage.delete(key);
  }

  clear(): void {
    this.storage.clear();
  }
}
