import { InjectionToken } from '@angular/core';

export interface NotFoundQuickLink {
  label: string;
  route: string;
}

export const NOT_FOUND_QUICK_LINKS = new InjectionToken<NotFoundQuickLink[]>(
  'NOT_FOUND_QUICK_LINKS',
  { factory: () => [] },
);
