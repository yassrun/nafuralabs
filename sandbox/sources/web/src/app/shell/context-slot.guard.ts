import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AppShellContextRailService } from '@platform/platform/app-shell';

/** Blocks a business-context route when Nafura has it disabled for this app. */
export const contextSlotGuard: CanActivateFn = (route) => {
  const id = route.data['contextSlotId'] as string | undefined;
  const rail = inject(AppShellContextRailService);
  if (id && rail.isEnabled(id)) return true;
  return inject(Router).createUrlTree(['/']);
};
