import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';

import { PRODUCT_SHORTCUTS } from '../application/product-shell.tokens';

export interface ShortcutDef {
  keys: string;
  description: string;
  category: 'Navigation' | 'Actions' | 'Interface';
}

@Injectable({ providedIn: 'root' })
export class ShortcutsService {
  private readonly router = inject(Router);
  private readonly config = inject(PRODUCT_SHORTCUTS);
  private gMode = false;
  private gTimer: ReturnType<typeof setTimeout> | null = null;

  get shortcuts(): ShortcutDef[] {
    return this.config.shortcuts;
  }

  /**
   * Call from the shell's @HostListener('document:keydown').
   * Returns true if shortcut was handled (caller should call preventDefault).
   */
  handle(
    event: KeyboardEvent,
    callbacks: {
      toggleAi?: () => void;
      openCommandPalette?: () => void;
      openShortcutHelp?: () => void;
    },
  ): boolean {
    const tag = (event.target as HTMLElement).tagName.toLowerCase();
    const inInput =
      tag === 'input' ||
      tag === 'textarea' ||
      tag === 'select' ||
      (event.target as HTMLElement).isContentEditable;

    const isMod = event.ctrlKey || event.metaKey;
    const keyLower = event.key.length === 1 ? event.key.toLowerCase() : event.key.toLowerCase();
    const isKeyK = event.code === 'KeyK' || keyLower === 'k';
    const isKeyP = event.code === 'KeyP' || keyLower === 'p';

    if (isMod && isKeyK && !event.shiftKey && !event.altKey) {
      callbacks.openCommandPalette?.();
      return true;
    }
    if (isMod && event.shiftKey && isKeyP) {
      callbacks.openCommandPalette?.();
      return true;
    }
    if (isMod && event.shiftKey && isKeyK) {
      callbacks.openCommandPalette?.();
      return true;
    }
    if (event.altKey && isKeyK && !isMod) {
      callbacks.openCommandPalette?.();
      return true;
    }

    if ((event.ctrlKey || event.metaKey) && event.key === '/') {
      callbacks.openShortcutHelp?.();
      return true;
    }

    if (inInput) return false;

    if (event.key === '?' && !event.ctrlKey && !event.metaKey) {
      callbacks.toggleAi?.();
      return true;
    }

    if (this.gMode) {
      this.clearGMode();
      const route = this.config.gotoMap[event.key.toLowerCase()];
      if (route) {
        void this.router.navigate([route]);
        return true;
      }
      return false;
    }

    if (event.key.toLowerCase() === 'g' && !event.ctrlKey && !event.metaKey && !event.altKey) {
      this.gMode = true;
      this.gTimer = setTimeout(() => this.clearGMode(), 1500);
      return true;
    }

    return false;
  }

  private clearGMode(): void {
    this.gMode = false;
    if (this.gTimer) {
      clearTimeout(this.gTimer);
      this.gTimer = null;
    }
  }
}
