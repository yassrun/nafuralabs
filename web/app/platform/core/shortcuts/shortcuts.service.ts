import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';

export interface ShortcutDef {
  keys: string;        // e.g. "g c", "ctrl+k", "?"
  description: string;
  category: 'Navigation' | 'Actions' | 'Interface';
}

export const SHORTCUTS: ShortcutDef[] = [
  { keys: 'Ctrl+K / ⌘K / Ctrl+⇧P / Alt+K', description: 'Command palette (alternatives if the browser captures Ctrl+K)', category: 'Interface' },
  { keys: '?', description: 'Toggle assistant IA', category: 'Interface' },
  { keys: 'Ctrl+/', description: 'Aide raccourcis clavier', category: 'Interface' },
  { keys: 'g c', description: 'Aller aux Chantiers', category: 'Navigation' },
  { keys: 'g a', description: 'Aller aux Achats', category: 'Navigation' },
  { keys: 'g f', description: 'Aller à la Finance', category: 'Navigation' },
  { keys: 'g p', description: 'Aller au Pilotage', category: 'Navigation' },
  { keys: 'g r', description: 'Aller aux RH', category: 'Navigation' },
  { keys: 'g h', description: 'Aller au HSE', category: 'Navigation' },
  { keys: 'g m', description: 'Aller aux Marchés', category: 'Navigation' },
  { keys: 'Esc', description: 'Fermer modal / drawer', category: 'Actions' },
  { keys: 'Ctrl+S', description: 'Sauvegarder formulaire', category: 'Actions' },
];

const GOTO_MAP: Record<string, string> = {
  c: '/chantiers',
  a: '/achats',
  f: '/finance',
  p: '/pilotage',
  r: '/rh',
  h: '/hse/tableau-bord',
  m: '/marches',
};

@Injectable({ providedIn: 'root' })
export class ShortcutsService {
  private readonly router = inject(Router);
  private gMode = false;
  private gTimer: ReturnType<typeof setTimeout> | null = null;

  readonly shortcuts = SHORTCUTS;

  /**
   * Call from the shell's @HostListener('document:keydown').
   * Returns true if shortcut was handled (caller should call preventDefault).
   */
  handle(event: KeyboardEvent, callbacks: {
    toggleAi?: () => void;
    openCommandPalette?: () => void;
    openShortcutHelp?: () => void;
  }): boolean {
    const tag = (event.target as HTMLElement).tagName.toLowerCase();
    const inInput = tag === 'input' || tag === 'textarea' || tag === 'select' || (event.target as HTMLElement).isContentEditable;

    const isMod = event.ctrlKey || event.metaKey;
    const keyLower = event.key.length === 1 ? event.key.toLowerCase() : event.key.toLowerCase();
    const isKeyK = event.code === 'KeyK' || keyLower === 'k';
    const isKeyP = event.code === 'KeyP' || keyLower === 'p';

    // Command palette — primary + fallbacks (Chrome/Edge on Windows often bind Ctrl+K to the address bar).
    // Works from inputs for all combos below.
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

    // Ctrl+/ → shortcut help
    if ((event.ctrlKey || event.metaKey) && event.key === '/') {
      callbacks.openShortcutHelp?.();
      return true;
    }

    // Skip remaining shortcuts when inside inputs
    if (inInput) return false;

    // ? → toggle AI panel
    if (event.key === '?' && !event.ctrlKey && !event.metaKey) {
      callbacks.toggleAi?.();
      return true;
    }

    // g <key> → goto
    if (this.gMode) {
      this.clearGMode();
      const route = GOTO_MAP[event.key.toLowerCase()];
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
    if (this.gTimer) { clearTimeout(this.gTimer); this.gTimer = null; }
  }
}
