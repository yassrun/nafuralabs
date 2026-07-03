import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { ConfirmDialogService } from '@lib/anatomy';

export interface CanComponentDeactivate {
  hasUnsavedChanges(): boolean;
}

/**
 * Guard that prevents navigation away from pages with unsaved form changes.
 * Implement CanComponentDeactivate on any page-form component to use it.
 */
export const unsavedChangesGuard: CanDeactivateFn<CanComponentDeactivate> = async (component) => {
  if (!component?.hasUnsavedChanges?.()) return true;
  const confirmDialog = inject(ConfirmDialogService);
  return confirmDialog.confirmDiscard();
};
