import { InjectionToken } from '@angular/core';

import type { ShortcutDef } from './shortcuts.service';

export interface ShortcutsConfig {
  /** `g` + key → route (e.g. `{ c: '/chantiers' }`). */
  gotoMap: Readonly<Record<string, string>>;
  extraShortcuts: ShortcutDef[];
}

const EMPTY_SHORTCUTS: ShortcutsConfig = {
  gotoMap: {},
  extraShortcuts: [],
};

export const SHORTCUTS_CONFIG = new InjectionToken<ShortcutsConfig>('SHORTCUTS_CONFIG', {
  factory: () => EMPTY_SHORTCUTS,
});
