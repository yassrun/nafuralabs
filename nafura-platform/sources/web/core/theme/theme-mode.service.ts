/**
 * Theme mode service: light / dark / system.
 * Applies class to document for dark mode; system follows prefers-color-scheme.
 * Used by user preferences and applied on app init from stored preference.
 */

import { Injectable, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'seyrura:theme';
const CLASS_DARK = 'nf-theme-dark';

@Injectable({ providedIn: 'root' })
export class ThemeModeService {
  /** Current user-selected mode (light | dark | system). */
  readonly mode = signal<ThemeMode>('system');

  /** Resolved effective mode (light | dark) for system. */
  readonly effectiveMode = signal<'light' | 'dark'>('light');

  private mediaQuery: MediaQueryList | null = null;
  private mediaListener: (() => void) | null = null;

  constructor() {
    this.initFromStorage();
  }

  /**
   * Apply theme mode. Call on user selection (immediate) and on app init.
   * For 'system', subscribes to prefers-color-scheme and updates when it changes.
   */
  applyMode(mode: ThemeMode): void {
    this.mode.set(mode);
    if (mode === 'system') {
      this.followSystem();
    } else {
      this.clearSystemListener();
      this.setDark(mode === 'dark');
      this.effectiveMode.set(mode);
    }
  }

  /**
   * Persist current mode to localStorage so app init can apply it.
   * Call after saving user preferences.
   */
  persistMode(mode: ThemeMode): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY, mode);
    }
  }

  /**
   * Read stored mode from localStorage and apply. Call once on service init.
   */
  initFromStorage(): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      this.applyMode('system');
      return;
    }
    const stored = window.localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    const mode =
      stored === 'light' || stored === 'dark' || stored === 'system'
        ? stored
        : 'system';
    this.applyMode(mode);
  }

  private followSystem(): void {
    if (typeof window === 'undefined' || !window.matchMedia) {
      this.setDark(false);
      this.effectiveMode.set('light');
      return;
    }
    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const update = (): void => {
      const dark = this.mediaQuery?.matches ?? false;
      this.setDark(dark);
      this.effectiveMode.set(dark ? 'dark' : 'light');
    };
    update();
    this.mediaListener = update;
    try {
      this.mediaQuery.addEventListener('change', update);
    } catch {
      this.mediaQuery.addListener(update);
    }
  }

  private clearSystemListener(): void {
    if (this.mediaQuery && this.mediaListener) {
      try {
        this.mediaQuery.removeEventListener('change', this.mediaListener);
      } catch {
        this.mediaQuery.removeListener(this.mediaListener);
      }
      this.mediaQuery = null;
      this.mediaListener = null;
    }
  }

  private setDark(dark: boolean): void {
    const doc = typeof document !== 'undefined' ? document.documentElement : null;
    if (!doc) return;
    if (dark) {
      doc.classList.add(CLASS_DARK);
    } else {
      doc.classList.remove(CLASS_DARK);
    }
  }
}
