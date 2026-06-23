/**
 * Storage Factory
 *
 * Creates appropriate storage adapter based on environment configuration.
 */

import { Injectable, inject } from '@angular/core';
import { StorageAdapter } from './storage.adapter';
import { MemoryStorage } from './memory.storage';
import { SessionStorageAdapter } from './session.storage';
import { LocalStorageAdapter } from './local.storage';

export type StorageMode = 'memory' | 'session' | 'local';

@Injectable({ providedIn: 'root' })
export class StorageFactory {
  /**
   * Create storage adapter based on mode.
   *
   * @param mode - Storage mode: 'memory' (high security), 'session' (production), 'local' (dev)
   */
  create(mode: StorageMode = 'session'): StorageAdapter {
    switch (mode) {
      case 'memory':
        return inject(MemoryStorage);
      case 'session':
        return inject(SessionStorageAdapter);
      case 'local':
        return inject(LocalStorageAdapter);
      default:
        return inject(SessionStorageAdapter);
    }
  }

  /**
   * Create storage adapter from environment.
   * Checks for HIGH_SECURITY_MODE flag or STORAGE_MODE env var.
   */
  createFromEnvironment(): StorageAdapter {
    // Check for high security mode (memory-only)
    const highSecurity = (window as any).__HIGH_SECURITY_MODE__ === true;
    if (highSecurity) {
      return this.create('memory');
    }

    // Check for explicit storage mode
    const storageMode = (window as any).__STORAGE_MODE__ as StorageMode | undefined;
    if (storageMode) {
      return this.create(storageMode);
    }

    // Default: sessionStorage for production-like behavior
    const isProduction = (window as any).__PRODUCTION__ === true;
    return this.create(isProduction ? 'session' : 'local');
  }
}
