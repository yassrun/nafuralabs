import { inject } from '@angular/core';

import type { SearchResult } from '@platform/core/shell/command-palette/command-palette.types';
import type { ShortcutDef } from '@platform/core/shortcuts/shortcuts.service';
import type { OnboardingConfig } from '@platform/core/onboarding/onboarding-config.token';
import type { ShortcutsConfig } from '@platform/core/shortcuts/shortcuts-config.token';
import type { NotFoundQuickLink } from '@platform/core/pages/errors/not-found-links.token';
import type { ApplicationRuntimeConfig } from '@platform/core/application/application-runtime.token';
import { INTEGRATION_AUDIT } from '@platform/core/integrations/integration-audit.token';
import { LISTING_EXPORT_AUDIT, type ListingExportAuditPayload } from '@platform/lib/anatomy/tokens/listing-export-audit.token';
import { LOOKUP_LIST_ROUTES } from '@platform/lib/anatomy/tokens/lookup-list-routes.token';
import {
  NOTIFICATION_BELL_ADAPTER,
  NOTIFICATION_BELL_DROPDOWN,
} from '@platform/features/collaboration/notification/notification-bell.adapter';
import { CHANTIER_ROW_NAVIGATOR } from '@platform/lib/anatomy/tokens/chantier-row-navigator.token';
import {
  SHELL_ORG_SWITCHER,
  SHELL_AFTER_ORG_SWITCH,
  SHELL_ONBOARDING_WIDGETS_LOADER,
} from '@platform/core/shell/shell-extensions.token';
import { ONBOARDING_CONFIG } from '@platform/core/onboarding/onboarding-config.token';
import { SHORTCUTS_CONFIG } from '@platform/core/shortcuts/shortcuts-config.token';
import { COMMAND_PALETTE_EXTRA_ACTIONS } from '@platform/core/shell/command-palette/command-palette-actions.token';
import { NOTIFICATION_CENTER_EXTRA } from '@platform/features/notifications/notification-center-extra.token';
import { NOT_FOUND_QUICK_LINKS } from '@platform/core/pages/errors/not-found-links.token';
import { APPLICATION_RUNTIME_CONFIG } from '@platform/core/application/application-runtime.token';
import { ThemeService, type TenantBranding } from '@platform/core/theme';

import {
  ACTIVE_APPLICATION_ID,
  APPLICATION_DEFAULT_ROUTE,
  APPLICATION_REQUIRES_TENANT,
} from './routes';
import { SEKTOR_ONBOARDING_ROUTE_MAP, SEKTOR_ONBOARDING_TOURS } from './onboarding.config';
import { ERP_LOOKUP_LIST_ROUTES } from '../shared/config/erp-lookup-list-routes';
import { ErpAuditService } from '../shell/erp-audit.service';
import { ErpNotificationBellAdapter } from '../shell/erp-notification-bell.adapter';
import { ErpNotificationBellListComponent } from '../shell/erp-notification-bell-list.component';
import { ErpNotificationCenterAlertsComponent } from '../shell/erp-notification-center-alerts.component';
import { ChantierDrilldownService } from '../shell/chantier-drilldown.service';
import { SocieteSwitcherComponent } from '../shell/components/societe-switcher/societe-switcher.component';
import { SocieteService } from '../shell/societe.service';

const SEKTOR_GOTO_MAP: Readonly<Record<string, string>> = {
  c: '/chantiers',
  a: '/achats',
  f: '/finance',
  p: '/pilotage',
  r: '/rh',
  h: '/hse/tableau-bord',
  m: '/marches',
};

const SEKTOR_EXTRA_SHORTCUTS: ShortcutDef[] = [
  { keys: 'g c', description: 'Aller aux Chantiers', category: 'Navigation' },
  { keys: 'g a', description: 'Aller aux Achats', category: 'Navigation' },
  { keys: 'g f', description: 'Aller à la Finance', category: 'Navigation' },
  { keys: 'g p', description: 'Aller au Pilotage', category: 'Navigation' },
  { keys: 'g r', description: 'Aller aux RH', category: 'Navigation' },
  { keys: 'g h', description: 'Aller au HSE', category: 'Navigation' },
  { keys: 'g m', description: 'Aller aux Marchés', category: 'Navigation' },
];

const SEKTOR_PALETTE_ACTIONS: SearchResult[] = [
  { id: 'action:chantier-new', label: 'core.search.actions.newChantier', icon: 'file', route: '/chantiers/new', category: 'actions', breadcrumb: '' },
  { id: 'action:bc-new', label: 'core.search.actions.newBc', icon: 'file', route: '/achats/commandes/new', category: 'actions', breadcrumb: '' },
  { id: 'action:da-new', label: 'core.search.actions.newDa', icon: 'file', route: '/achats/demandes/new', category: 'actions', breadcrumb: '' },
  { id: 'action:employe-new', label: 'core.search.actions.newEmploye', icon: 'file', route: '/rh/employes/new', category: 'actions', breadcrumb: '' },
  { id: 'action:facture-vente-new', label: 'core.search.actions.newFactureVente', icon: 'file', route: '/ventes/factures/new', category: 'actions', breadcrumb: '' },
];

const SEKTOR_NOT_FOUND_LINKS: NotFoundQuickLink[] = [
  { label: 'Chantiers', route: '/chantiers' },
  { label: 'Marchés & Facturation', route: '/marches' },
  { label: 'Achats', route: '/achats' },
  { label: 'Finance', route: '/finance' },
  { label: 'Stock & Matériel', route: '/inventory' },
  { label: 'RH & Paie', route: '/rh' },
];

export function createSektorApplicationRuntimeConfig(): ApplicationRuntimeConfig {
  return {
    activeApplicationId: ACTIVE_APPLICATION_ID,
    defaultRoute: APPLICATION_DEFAULT_ROUTE,
    requiresTenant: APPLICATION_REQUIRES_TENANT,
  };
}

export function createSektorOnboardingConfig(): OnboardingConfig {
  return { tours: SEKTOR_ONBOARDING_TOURS, routeTourMap: SEKTOR_ONBOARDING_ROUTE_MAP };
}

export function createSektorShortcutsConfig(): ShortcutsConfig {
  return { gotoMap: SEKTOR_GOTO_MAP, extraShortcuts: SEKTOR_EXTRA_SHORTCUTS };
}

export function createShellAfterOrgSwitch(): () => void {
  const themeService = inject(ThemeService);
  const societeService = inject(SocieteService);
  return () => {
    const demoPrimaryBySociete: Record<string, string> = {
      'soc-somacom-btp': '#0d9488',
      'soc-somacom-tp': '#1d4ed8',
      'soc-somacom-logistique': '#7c3aed',
    };
    const id = societeService.currentSocieteId();
    const b = themeService.branding();
    const fallback = b?.primaryColor && /^#/.test(b.primaryColor) ? b.primaryColor : null;
    themeService.applyPrimaryColor(demoPrimaryBySociete[id] ?? fallback);
    const soc = societeService.currentSociete();
    if (soc) {
      const merged: TenantBranding = {
        logoUrl: b?.logoUrl ?? null,
        faviconUrl: b?.faviconUrl ?? null,
        primaryColor: demoPrimaryBySociete[id] ?? b?.primaryColor ?? null,
        tenantDisplayName: soc.raisonSociale,
      };
      themeService.applyDocumentChrome(merged);
    } else if (b) {
      themeService.applyDocumentChrome({
        logoUrl: b.logoUrl ?? null,
        faviconUrl: b.faviconUrl ?? null,
        primaryColor: demoPrimaryBySociete[id] ?? b.primaryColor ?? null,
        tenantDisplayName: b.tenantDisplayName ?? null,
      });
    } else {
      themeService.applyDocumentChrome(null);
    }
  };
}

/** Platform extension providers — wire Sektor métier into the generic shell. */
export const SEKTOR_PLATFORM_PROVIDERS = [
  { provide: APPLICATION_RUNTIME_CONFIG, useFactory: createSektorApplicationRuntimeConfig },
  { provide: ONBOARDING_CONFIG, useFactory: createSektorOnboardingConfig },
  { provide: SHORTCUTS_CONFIG, useFactory: createSektorShortcutsConfig },
  { provide: COMMAND_PALETTE_EXTRA_ACTIONS, useValue: SEKTOR_PALETTE_ACTIONS },
  { provide: NOT_FOUND_QUICK_LINKS, useValue: SEKTOR_NOT_FOUND_LINKS },
  { provide: SHELL_ORG_SWITCHER, useValue: SocieteSwitcherComponent },
  { provide: SHELL_AFTER_ORG_SWITCH, useFactory: createShellAfterOrgSwitch },
  {
    provide: SHELL_ONBOARDING_WIDGETS_LOADER,
    useValue: () =>
      import('../onboarding/onboarding-shell-widgets.component').then((m) => ({
        invite: m.OnboardingInviteBannerWidgetComponent,
        meter: m.OnboardingCompletenessWidgetComponent,
      })),
  },
  { provide: NOTIFICATION_CENTER_EXTRA, useValue: ErpNotificationCenterAlertsComponent },
  { provide: INTEGRATION_AUDIT, useExisting: ErpAuditService },
  {
    provide: LISTING_EXPORT_AUDIT,
    useFactory: (audit: ErpAuditService) => (payload: ListingExportAuditPayload) => {
      const slug = payload.entityNamePlural
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '_')
        .toUpperCase()
        .slice(0, 28);
      const scope = payload.selectionOnly ? 'sélection' : 'vue';
      const rows = payload.rowCount < 0 ? 'export serveur / filtré' : `${payload.rowCount} ligne(s)`;
      audit.log('EXPORT', slug, '—', payload.filename, `${payload.format.toUpperCase()} · ${scope} · ${rows}`);
    },
    deps: [ErpAuditService],
  },
  {
    provide: CHANTIER_ROW_NAVIGATOR,
    useFactory: (drill: ChantierDrilldownService) => (row: unknown) => drill.tryNavigateFromRow(row),
    deps: [ChantierDrilldownService],
  },
  { provide: LOOKUP_LIST_ROUTES, useValue: ERP_LOOKUP_LIST_ROUTES },
  ErpNotificationBellAdapter,
  { provide: NOTIFICATION_BELL_ADAPTER, useExisting: ErpNotificationBellAdapter },
  { provide: NOTIFICATION_BELL_DROPDOWN, useValue: ErpNotificationBellListComponent },
];
