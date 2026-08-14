/**
 * Sektor BTP — application route registry (hand-maintained).
 * Replaces the legacy nafgen `routes.generated.ts`.
 */

import { Routes } from '@angular/router';

import { ERP_ROUTES } from '../routes/erp.routes.generated';

export const KNOWN_APPLICATION_IDS = ['erp'] as const;
export type KnownApplicationId = (typeof KNOWN_APPLICATION_IDS)[number];

export const APPLICATION_ROUTES_BY_ID: Record<string, Routes> = {
  erp: [...ERP_ROUTES],
};

export const APPLICATION_DEFAULT_ROUTES: Record<string, string> = {
  erp: 'dashboard',
};

export const APPLICATION_TENANCY_MODES: Record<string, string> = {
  erp: 'multi',
};

export const APPLICATION_SHELL_LOADERS: Record<string, () => Promise<unknown>> = {
  erp: () =>
    import('@platform/core/shell/platform-app-shell.component').then(
      (m) => m.PlatformAppShellComponent
    ),
};

export const APPLICATION_DISPLAY_NAMES: Record<string, string> = {
  erp: 'Sektor BTP',
};

export const DEFAULT_APPLICATION_ID = 'erp';

function normalizeApplicationId(value: string): string {
  if (typeof value !== 'string') return '';
  const normalized = value.trim().toLowerCase();
  if (!normalized) return '';
  if (!/^[a-z][a-z0-9-]*$/.test(normalized)) return '';
  return normalized;
}

function detectFromHostname(hostname: string): string {
  const normalizedHost = (hostname || '').toLowerCase();
  const firstPart = normalizedHost.split('.')[0];

  if (
    firstPart === 'app' ||
    firstPart === 'platform' ||
    firstPart === 'sektor' ||
    firstPart === 'localhost' ||
    firstPart === '127'
  ) {
    return DEFAULT_APPLICATION_ID;
  }

  const normalizedFirstPart = normalizeApplicationId(firstPart);
  if (normalizedFirstPart && APPLICATION_ROUTES_BY_ID[normalizedFirstPart]) {
    return normalizedFirstPart;
  }
  return DEFAULT_APPLICATION_ID;
}

const runtimeHostname =
  typeof window !== 'undefined' && window.location && typeof window.location.hostname === 'string'
    ? window.location.hostname
    : '';

export const ACTIVE_APPLICATION_ID = detectFromHostname(runtimeHostname);
export const APPLICATION_TENANCY_MODE = APPLICATION_TENANCY_MODES[ACTIVE_APPLICATION_ID] || 'multi';
export const APPLICATION_REQUIRES_TENANT = APPLICATION_TENANCY_MODE === 'multi';
export const ACTIVE_APPLICATION_SHELL_LOADER =
  APPLICATION_SHELL_LOADERS[ACTIVE_APPLICATION_ID] ||
  (() =>
    import('@platform/core/pages/errors/feature-unavailable.page').then(
      (m) => m.FeatureUnavailablePage
    ));
export const APPLICATION_DEFAULT_ROUTE =
  APPLICATION_DEFAULT_ROUTES[ACTIVE_APPLICATION_ID] || 'feature-unavailable/unknown';
export const APPLICATION_ROUTES: Routes = APPLICATION_ROUTES_BY_ID[ACTIVE_APPLICATION_ID] || [];
