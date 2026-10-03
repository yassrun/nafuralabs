import type { Route, Routes } from '@angular/router';

import type { AdministrationSectionConfig } from '../../core/shell/platform-app-shell.types';
import type { AppShellNavigationItem, AppShellNavigationSection } from '../app-shell/app-shell.types';

type AdministrationSection = keyof AdministrationSectionConfig;

interface AdministrationScreen {
  readonly section: AdministrationSection;
  /** Child path under `/administration`, as declared by ADMINISTRATION_ROUTES. */
  readonly path: string;
  readonly capability: string;
  readonly nav: Omit<AppShellNavigationItem, 'route'>;
}

interface TopLevelScreen {
  readonly capability: string;
  readonly path: string;
  readonly route: Omit<Route, 'path'>;
  readonly nav: Omit<AppShellNavigationItem, 'route'>;
  readonly group: 'workspace' | 'settings';
}

/** Screens a capability contributes outside `/administration`. Capabilities without UI do not appear. */
const TOP_LEVEL_SCREENS: readonly TopLevelScreen[] = [
  {
    capability: 'cap.foundation',
    path: 'dashboard',
    group: 'workspace',
    route: { loadChildren: () => import('../../features/dashboard/dashboard.routes').then((m) => m.DASHBOARD_ROUTES) },
    nav: { id: 'dashboard', label: 'Accueil', icon: 'home' },
  },
  {
    capability: 'cap.approvals',
    path: 'approvals',
    group: 'workspace',
    route: { loadChildren: () => import('../../features/approvals/approvals.routes').then((m) => m.APPROVALS_ROUTES) },
    // Everyone's own inbox: the service lists only the steps of the caller's roles.
    nav: { id: 'approvals', label: 'Approbations', icon: 'clipboard-check' },
  },
  {
    capability: 'cap.notifications',
    path: 'notifications',
    group: 'workspace',
    route: { loadComponent: () => import('../notifications').then((m) => m.PlatformNotificationCenterComponent) },
    nav: { id: 'notifications', label: 'Notifications', icon: 'bell' },
  },
  {
    capability: 'cap.document-extraction',
    path: 'doc-extractor',
    group: 'workspace',
    route: {
      loadChildren: () =>
        import('../../app/document-extraction/routes/doc-extractor.routes').then((m) => m.DOC_EXTRACTOR_ROUTES),
    },
    nav: { id: 'doc-extractor', label: 'Extraction de documents', icon: 'file-search' },
  },
  {
    capability: 'cap.user-settings',
    path: 'user-settings',
    group: 'settings',
    route: {
      loadChildren: () =>
        import('../../features/user-settings/user-settings.routes').then((m) => m.USER_SETTINGS_ROUTES),
    },
    nav: { id: 'user-settings', label: 'Mes paramètres', icon: 'user' },
  },
  {
    capability: 'cap.app-settings',
    path: 'organization/settings',
    group: 'settings',
    route: {
      loadChildren: () =>
        import('../../features/app-settings/app-settings.routes').then((m) => m.APP_SETTINGS_ROUTES),
    },
    nav: { id: 'org-settings', label: 'Paramètres organisation', icon: 'sliders-horizontal', permission: 'tenant.settings.write' },
  },
  {
    capability: 'cap.organization-identity',
    path: 'organization/identity',
    group: 'settings',
    route: {
      loadChildren: () =>
        import('../../features/organization-identity/organization-identity.routes').then(
          (m) => m.ORGANIZATION_IDENTITY_ROUTES,
        ),
    },
    nav: { id: 'org-identity', label: 'Identité organisation', icon: 'building-2', permission: 'tenant.settings.read' },
  },
];

/** Sections of ADMINISTRATION_ROUTES, the capability that owns each, and the permission its API reads with. */
const ADMINISTRATION_SCREENS: readonly AdministrationScreen[] = [
  { section: 'members', path: 'members', capability: 'cap.iam', nav: { id: 'admin-members', label: 'Membres', icon: 'users', permission: 'tenant.members.read' } },
  { section: 'roles', path: 'roles', capability: 'cap.access', nav: { id: 'admin-roles', label: 'Rôles', icon: 'shield-check', permission: 'tenant.roles.read' } },
  { section: 'domainActivation', path: 'domain-activation', capability: 'cap.access', nav: { id: 'admin-domains', label: 'Modules', icon: 'puzzle', permission: 'tenant.settings.read' } },
  { section: 'audit', path: 'audit', capability: 'cap.audit', nav: { id: 'admin-audit', label: 'Journal d’audit', icon: 'scroll-text', permission: 'administration.audit.read' } },
  { section: 'templates', path: 'documents', capability: 'cap.documents', nav: { id: 'admin-documents', label: 'Documents', icon: 'file-text', permission: 'administration.templates.read' } },
  { section: 'emailTemplates', path: 'email-templates', capability: 'cap.notifications', nav: { id: 'admin-email-templates', label: 'Modèles d’e-mail', icon: 'send', permission: 'administration.email.read' } },
  { section: 'workflows', path: 'workflows', capability: 'cap.approvals', nav: { id: 'admin-workflows', label: 'Workflows', icon: 'git-branch', permission: 'administration.workflows.read' } },
  { section: 'scheduledJobs', path: 'scheduled-jobs', capability: 'cap.foundation', nav: { id: 'admin-jobs', label: 'Tâches planifiées', icon: 'calendar-clock', permission: 'administration.scheduled-jobs.read' } },
  { section: 'webhooks', path: 'webhooks', capability: 'cap.webhooks', nav: { id: 'admin-webhooks', label: 'Webhooks', icon: 'webhook', permission: 'administration.webhooks.read' } },
  { section: 'apiKeys', path: 'api-keys', capability: 'cap.foundation', nav: { id: 'admin-api-keys', label: 'Clés API', icon: 'shield', permission: 'administration.api-keys.read' } },
  { section: 'aiProviders', path: 'ai-providers', capability: 'cap.ai', nav: { id: 'admin-ai', label: 'Fournisseurs IA', icon: 'sparkles', permission: 'tenant.settings.read' } },
  { section: 'numberingSequences', path: 'numbering-sequences', capability: 'cap.sysconfig', nav: { id: 'admin-numbering', label: 'Numérotation', icon: 'repeat', permission: 'settings.sysconfig.numbering-sequence.read' } },
  { section: 'subscriptions', path: 'subscriptions', capability: 'cap.subscriptions', nav: { id: 'admin-subscriptions', label: 'Abonnements', icon: 'wallet', permission: 'tenant.subscriptions.read' } },
];

export interface HostScreens {
  readonly routes: Routes;
  /** Top of the sidebar: everyday screens (home, approvals…); business contexts follow. */
  readonly workspace: AppShellNavigationSection[];
  /** Bottom of the sidebar: Administration and Paramètres groups. */
  readonly platform: AppShellNavigationSection[];
  readonly navigation: AppShellNavigationSection[];
  readonly administrationSections: AdministrationSectionConfig;
  readonly homePath: string | undefined;
}

/** Routes, navigation and administration sections of the enabled capabilities; `customRoles` is app.nafura.json spec.customRoles. */
export function hostScreens(enabledCapabilities: readonly string[], { customRoles = true } = {}): HostScreens {
  const enabled = new Set(enabledCapabilities);
  const topLevel = TOP_LEVEL_SCREENS.filter((screen) => enabled.has(screen.capability));
  const administration = ADMINISTRATION_SCREENS.filter((screen) => enabled.has(screen.capability));
  const administrationPaths = new Set(administration.map((screen) => screen.path));

  const routes: Routes = topLevel.map((screen) => ({ path: screen.path, ...screen.route }));
  const topLevelPaths = new Set(topLevel.map((screen) => screen.path));
  if (administration.length) {
    routes.push({
      path: 'administration',
      loadChildren: () =>
        import('../../features/administration/administration.routes').then((m) =>
          m.ADMINISTRATION_ROUTES.filter((child) =>
            keepAdministrationChild(child, administrationPaths, topLevelPaths),
          ).concat({
            path: '',
            pathMatch: 'full',
            redirectTo: administration[0].path,
          }),
        ),
    });
  }

  const topNav = (group: TopLevelScreen['group']): AppShellNavigationItem[] =>
    topLevel.filter((screen) => screen.group === group).map((screen) => ({ ...screen.nav, route: '/' + screen.path }));
  const group = (id: string, label: string, icon: string, children: AppShellNavigationItem[]): AppShellNavigationItem[] =>
    children.length ? [{ id, label, icon, children }] : [];

  const administrationSections = Object.fromEntries(
    ADMINISTRATION_SCREENS.map((screen) => [screen.section, { enabled: enabled.has(screen.capability) }]),
  ) as AdministrationSectionConfig;
  if (administrationSections.roles) {
    administrationSections.roles = { ...administrationSections.roles, customRoles };
  }

  const workspace = topNav('workspace');
  const platform = [
    ...group(
      'administration',
      'Administration',
      'shield',
      administration.map((screen) => ({ ...screen.nav, route: '/administration/' + screen.path })),
    ),
    ...group('settings', 'Paramètres', 'settings', topNav('settings')),
  ];
  const workspaceSections = workspace.length ? [{ id: 'workspace', items: workspace }] : [];
  const platformSections = platform.length ? [{ id: 'platform', items: platform }] : [];

  return {
    routes,
    workspace: workspaceSections,
    platform: platformSections,
    navigation: [...workspaceSections, ...platformSections],
    administrationSections,
    homePath: topLevel[0]?.path ?? (administration.length ? 'administration' : undefined),
  };
}

/** Keeps the sections whose capability is enabled, and redirects landing on an enabled screen. */
export function keepAdministrationChild(
  child: Route,
  enabledSections: ReadonlySet<string>,
  enabledTopLevel: ReadonlySet<string>,
): boolean {
  if (child.path === '' || child.path === undefined) {
    return false;
  }
  if (child.redirectTo !== undefined) {
    const target = String(child.redirectTo);
    if (target.startsWith('/')) {
      const path = target.slice(1);
      return [...enabledTopLevel].some((topLevel) => path === topLevel || path.startsWith(topLevel + '/'));
    }
    return enabledSections.has(target.split('/')[0]);
  }
  return enabledSections.has(child.path.split('/')[0]);
}

export const HOST_ADMINISTRATION_SCREENS = ADMINISTRATION_SCREENS;
export const HOST_TOP_LEVEL_SCREENS = TOP_LEVEL_SCREENS;
