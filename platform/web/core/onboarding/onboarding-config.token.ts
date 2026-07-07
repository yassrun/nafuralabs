import { InjectionToken } from '@angular/core';

import type { Tour } from './onboarding.service';

export interface OnboardingConfig {
  tours: Tour[];
  routeTourMap: ReadonlyArray<{ prefix: string; tourId: string }>;
}

const EMPTY_ONBOARDING: OnboardingConfig = {
  tours: [],
  routeTourMap: [],
};

export const ONBOARDING_CONFIG = new InjectionToken<OnboardingConfig>('ONBOARDING_CONFIG', {
  factory: () => EMPTY_ONBOARDING,
});
