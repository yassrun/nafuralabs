import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'shell.aiPanel.open';

function readStoredOpen(): boolean | null {
  if (typeof localStorage === 'undefined') {
    return null;
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === null) {
      return null;
    }
    return stored === '1';
  } catch {
    return null;
  }
}

function persistOpen(open: boolean): void {
  if (typeof localStorage === 'undefined') {
    return;
  }
  try {
    localStorage.setItem(STORAGE_KEY, open ? '1' : '0');
  } catch {
    // ignore quota / privacy errors
  }
}

/**
 * Chrome state for the platform AI panel.
 *
 * Shared by the default topbar toggle, keyboard shortcuts, and any app that
 * overrides the `header-ai` slot — the panel itself stays in the shell.
 */
@Injectable({ providedIn: 'root' })
export class AiPanelService {
  readonly open = signal<boolean>(readStoredOpen() ?? false);

  toggle(enabled = true): void {
    if (!enabled) {
      return;
    }
    this.setOpen(!this.open());
  }

  setOpen(next: boolean): void {
    this.open.set(next);
    persistOpen(next);
  }

  syncFromOptions(conversation: { enabled?: boolean; initiallyOpen?: boolean }): void {
    if (!conversation.enabled) {
      if (this.open()) {
        this.open.set(false);
      }
      return;
    }
    if (conversation.initiallyOpen && !this.open() && readStoredOpen() === null) {
      this.setOpen(true);
    }
  }
}
