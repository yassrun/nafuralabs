/**
 * App Routes
 *
 * Top-level route configuration.
 * Uses lazy loading for features.
 *
 * Route Structure:
 * - Public routes (login, auth/callback, tenant-selection)
 * - Protected routes (require tenant context)
 *   - Feature route trees from Sektor BTP application config
 */

import { Routes } from '@angular/router';

import { tenantRequiredGuard, tenantSelectionGuard } from '@platform/core/tenant/tenant.guard';
import { onboardingCompleteGuard } from '@app/onboarding/guards/onboarding-complete.guard';
import { authGuard, guestGuard } from '@platform/core/security/guards/auth.guard';
import {
  ACTIVE_APPLICATION_SHELL_LOADER,
  APPLICATION_DEFAULT_ROUTE,
  APPLICATION_ROUTES,
  ACTIVE_APPLICATION_ID,
} from '@app/config/routes';
import { ONBOARDING_V2_ROUTES } from '@app/onboarding/onboarding.routes';
import { APP_SHELL_CONFIGS } from '@app/config/shell.config';
import {
  resolveApplicationNavigation,
  resolveApplicationZoneConfig,
} from '@app/config/navigation';
import { SidebarNode } from '@platform/core/navigation/sidebar.types';

const ACTIVE_APP_SHELL_CONFIG = APP_SHELL_CONFIGS[ACTIVE_APPLICATION_ID] || APP_SHELL_CONFIGS['core'];

function buildAdministrationNode(): SidebarNode | null {
  const admin = ACTIVE_APP_SHELL_CONFIG.modules.administration;
  if (!admin?.enabled) return null;

  const sections = admin.sections || {};
  const children: SidebarNode[] = [];
  children.push({
    id: 'administration.hub',
    label: 'administration.navigation.hub',
    icon: 'layout-dashboard',
    route: '/admin',
    order: 8,
  });
  if (sections.members?.enabled !== false) {
    children.push({
      id: 'administration.members',
      label: 'administration.navigation.members',
      icon: 'users',
      route: '/administration/members',
      order: 10,
    });
  }
  if (sections.roles?.enabled !== false) {
    children.push({
      id: 'administration.roles',
      label: 'administration.navigation.roles',
      icon: 'shield-check',
      route: '/administration/roles',
      order: 20,
    });
  }
  if (sections.domainActivation?.enabled !== false) {
    children.push({
      id: 'administration.domainActivation',
      label: 'administration.navigation.domainActivation',
      icon: 'layout-grid',
      route: '/administration/domain-activation',
      order: 30,
    });
  }
  if (sections.audit?.enabled !== false) {
    children.push({
      id: 'administration.audit',
      label: 'administration.navigation.audit',
      icon: 'scroll-text',
      route: '/administration/audit',
      order: 35,
    });
  }
  if (sections.templates?.enabled !== false) {
    // Customisation comes first: it is what a customer uses. The template editor below is for
    // support and for authoring the system templates.
    children.push({
      id: 'administration.documentSettings',
      label: 'administration.documentSettings.title',
      icon: 'sliders',
      route: '/administration/document-settings',
      order: 35.5,
    });
    children.push({
      id: 'administration.templates',
      label: 'administration.navigation.templates',
      icon: 'file-text',
      route: '/administration/templates',
      order: 36,
    });
  }
  if (sections.emailTemplates?.enabled !== false) {
    children.push({
      id: 'administration.emailTemplates',
      label: 'administration.navigation.emailTemplates',
      icon: 'mail',
      route: '/administration/email-templates',
      order: 36.5,
    });
  }
  if (sections.workflows?.enabled !== false) {
    children.push({
      id: 'administration.workflows',
      label: 'administration.navigation.workflows',
      icon: 'git-branch',
      route: '/administration/workflows',
      order: 37,
    });
  }
  if (sections.scheduledJobs?.enabled !== false) {
    children.push({
      id: 'administration.scheduledJobs',
      label: 'administration.navigation.scheduledJobs',
      icon: 'clock-3',
      route: '/administration/scheduled-jobs',
      order: 37.2,
    });
  }
  if (sections.webhooks?.enabled !== false) {
    children.push({
      id: 'administration.webhooks',
      label: 'administration.navigation.webhooks',
      icon: 'webhook',
      route: '/administration/webhooks',
      order: 37.3,
    });
  }
  if (sections.apiKeys?.enabled !== false) {
    children.push({
      id: 'administration.apiKeys',
      label: 'administration.navigation.apiKeys',
      icon: 'key-round',
      route: '/administration/api-keys',
      order: 37.4,
    });
  }
  if (sections.numberingSequences?.enabled !== false) {
    children.push({
      id: 'administration.numberingSequences',
      label: 'administration.navigation.numberingSequences',
      icon: 'hash',
      route: '/administration/numbering-sequences',
      order: 37.5,
    });
  }
  if (sections.subscriptions?.enabled !== false) {
    children.push({
      id: 'administration.subscriptions',
      label: 'administration.navigation.subscriptions',
      icon: 'coins',
      route: '/administration/subscriptions',
      order: 40,
    });
  }

  // ERP-specific admin entries
  children.push({
    id: 'administration.societe',
    label: 'administration.navigation.societe',
    icon: 'building-2',
    route: '/administration/societe',
    order: 50,
  });
  children.push({
    id: 'administration.fiscal',
    label: 'administration.navigation.fiscal',
    icon: 'percent',
    route: '/administration/parametres-fiscal',
    order: 55,
  });
  children.push({
    id: 'administration.auditLog',
    label: 'administration.navigation.auditLog',
    icon: 'scroll-text',
    route: '/administration/audit-log',
    order: 60,
  });
  children.push({
    id: 'administration.demo',
    label: 'administration.navigation.demo',
    icon: 'flask-conical',
    route: '/administration/demo',
    order: 98,
  });

  if (children.length === 0) return null;
  return {
    id: 'administration',
    label: 'administration.navigation.title',
    icon: 'settings',
    zone: 'administration',
    order: 999,
    children,
  };
}

function buildApprovalsNode(): SidebarNode {
  return {
    id: 'approvals',
    label: 'approvals.navigation.title',
    icon: 'clipboard-check',
    route: '/approvals',
    order: 5,
  };
}

function buildActiveNavigation(): SidebarNode[] {
  const base = resolveApplicationNavigation(ACTIVE_APPLICATION_ID, { allowMissing: false });
  const approvalsNode = buildApprovalsNode();
  const withApprovals = [approvalsNode, ...base];
  const adminNode = buildAdministrationNode();
  return adminNode ? [...withApprovals, adminNode] : withApprovals;
}

const ACTIVE_APP_NAVIGATION = buildActiveNavigation();
const ACTIVE_APP_ZONE_CONFIG = resolveApplicationZoneConfig(ACTIVE_APPLICATION_ID, { allowMissing: true });

/**
 * Application routes.
 *
 * Structure:
 * - Public routes (login, etc.)
 * - Protected routes (require tenant context)
 *   - Feature route trees from Sektor BTP config
 */
export const APP_ROUTES = [
  ...ONBOARDING_V2_ROUTES,
  {
    path: 'invite/accept',
    loadComponent: () =>
      import('@app/onboarding/onboarding-layout.component').then(
        (m) => m.OnboardingLayoutComponent
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('@app/invitations/pages/invite-accept.page').then(
            (m) => m.InviteAcceptPage
          ),
      },
    ],
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('@platform/core/pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'auth/callback',
    loadComponent: () =>
      import('@platform/core/pages/auth-callback/auth-callback.page').then(
        (m) => m.AuthCallbackPage
      ),
  },
  {
    path: 'tenant-selection',
    canActivate: [authGuard, tenantSelectionGuard],
    loadComponent: () =>
      import('@platform/core/pages/tenant-selection/tenant-selection.page').then(
        (m) => m.TenantSelectionPage
      ),
  },

  {
    path: '',
    canActivate: [authGuard, tenantRequiredGuard, onboardingCompleteGuard],
    loadComponent: ACTIVE_APPLICATION_SHELL_LOADER,
    data: {
      applicationId: ACTIVE_APP_SHELL_CONFIG.applicationId,
      applicationName: ACTIVE_APP_SHELL_CONFIG.applicationName,
      navigation: ACTIVE_APP_NAVIGATION,
      zoneConfig: ACTIVE_APP_ZONE_CONFIG,
      shellOptions: ACTIVE_APP_SHELL_CONFIG.shellOptions,
      userSettingsEnabled: ACTIVE_APP_SHELL_CONFIG.modules.userSettings.enabled,
      appSettingsEnabled: ACTIVE_APP_SHELL_CONFIG.modules.appSettings.enabled,
    },
    children: [
      {
        path: '',
        redirectTo: APPLICATION_DEFAULT_ROUTE,
        pathMatch: 'full',
      },
      {
        path: 'approvals',
        loadChildren: () =>
          import('@platform/features/approvals/approvals.routes').then((m) => m.APPROVALS_ROUTES),
      },
      {
        path: 'administration',
        canActivate: [authGuard],
        data: { breadcrumb: 'Administration' },
        // La plateforme fournit les routes d'administration génériques ; l'application
        // y ajoute les siennes (société, paramètres fiscaux, démo). C'est l'application
        // qui compose — la plateforme ne connaît pas ses pages.
        loadChildren: async () => {
          const [platform, app] = await Promise.all([
            import('@platform/features/administration/administration.routes'),
            import('@app/administration-routes'),
          ]);
          return [...platform.ADMINISTRATION_ROUTES, ...app.ADMINISTRATION_APP_ROUTES];
        },
      },
      {
        path: 'admin',
        canActivate: [authGuard],
        data: { breadcrumb: 'Administration' },
        loadComponent: () =>
          import('@app/pages/administration/hub/admin-hub.page').then(
            (m) => m.AdminHubPage
          ),
      },
      ...APPLICATION_ROUTES,
      {
        path: 'user-settings',
        canActivate: [authGuard],
        loadChildren: () =>
          import('@platform/features/user-settings/user-settings.routes').then(
            (m) => m.USER_SETTINGS_ROUTES
          ),
      },
      {
        path: 'notifications',
        canActivate: [authGuard],
        loadChildren: () =>
          import('@platform/features/notifications/notifications.routes').then(
            (m) => m.NOTIFICATIONS_ROUTES
          ),
      },
      {
        path: 'access-denied',
        loadComponent: () =>
          import('@platform/core/pages/errors/access-denied.page').then((m) => m.AccessDeniedPage),
      },
      {
        path: 'feature-unavailable/:featureId',
        loadComponent: () =>
          import('@platform/core/pages/errors/feature-unavailable.page').then(
            (m) => m.FeatureUnavailablePage
          ),
      },
      {
        path: 'module-unavailable/:moduleId',
        loadComponent: () =>
          import('@platform/core/pages/errors/feature-unavailable.page').then(
            (m) => m.FeatureUnavailablePage
          ),
      },
      {
        path: '**',
        loadComponent: () =>
          import('@platform/core/pages/errors/not-found.page').then((m) => m.NotFoundPage),
      },
    ],
  },

  {
    path: 'error/500',
    loadComponent: () =>
      import('@platform/core/pages/errors/server-error.page').then((m) => m.ServerErrorPage),
  },
  {
    path: 'maintenance',
    loadComponent: () =>
      import('@platform/core/pages/errors/maintenance.page').then((m) => m.MaintenancePage),
  },
  {
    path: '**',
    loadComponent: () =>
      import('@platform/core/pages/errors/not-found.page').then((m) => m.NotFoundPage),
  },
] as Routes;
