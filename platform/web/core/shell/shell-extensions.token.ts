import { InjectionToken, Type } from '@angular/core';

/** Optional header widget (e.g. legal-entity switcher) rendered in the platform shell. */
export const SHELL_ORG_SWITCHER = new InjectionToken<Type<unknown>>('SHELL_ORG_SWITCHER');

/** Called after the org switcher changes selection (product-specific side effects). */
export const SHELL_AFTER_ORG_SWITCH = new InjectionToken<() => void>('SHELL_AFTER_ORG_SWITCH');

export interface ShellOnboardingWidgets {
  invite: Type<unknown>;
  meter: Type<unknown>;
}

/** Lazy loader for product onboarding widgets in the shell sidebar. */
export const SHELL_ONBOARDING_WIDGETS_LOADER = new InjectionToken<
  () => Promise<ShellOnboardingWidgets>
>('SHELL_ONBOARDING_WIDGETS_LOADER');
