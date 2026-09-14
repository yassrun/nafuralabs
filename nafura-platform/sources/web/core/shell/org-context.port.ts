import { InjectionToken, Signal } from '@angular/core';

/** Generic org / site row for the platform switcher. */
export interface OrgContextItem {
  id: string;
  label: string;
  meta?: string;
}

/**
 * Product-owned organization context.
 *
 * The chrome widget is platform; companies, sites and persistence stay in the app.
 */
export interface OrgContextPort {
  readonly orgs: Signal<readonly OrgContextItem[]>;
  readonly sites: Signal<readonly OrgContextItem[]>;
  readonly currentOrgId: Signal<string | null>;
  readonly currentSiteId: Signal<string | null>;
  /** Route opened from the switcher « Paramètres » action. */
  readonly settingsRoute: string;
  selectOrg(id: string): void;
  selectSite(id: string): void;
}

export const ORG_CONTEXT_PORT = new InjectionToken<OrgContextPort>('ORG_CONTEXT_PORT');
