import { InjectionToken } from '@angular/core';

import type { SearchResult } from './command-palette.types';

export const COMMAND_PALETTE_EXTRA_ACTIONS = new InjectionToken<SearchResult[]>(
  'COMMAND_PALETTE_EXTRA_ACTIONS',
  { factory: () => [] },
);
