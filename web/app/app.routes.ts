/**
 * App Routes
 * 
 * Top-level route configuration.
 * Uses lazy loading for features.
 * 
 * Route Structure:
 * - Public routes (login, auth/callback, tenant-selection)
 * - Protected routes (require tenant context)
 *   - Feature route trees from generated application composition
 */

import { Routes } from '@angular/router';

import { tenantRequiredGuard, tenantSelectionGuard } from './platform/core/tenant/tenant.guard';
import { onboardingCompleteGuard } from './applications/erp/onboarding/guards/onboarding-complete.guard';
import { authGuard, guestGuard } from './platform/core/security/guards/auth.guard';
import { ACTIVE_APPLICATION_SHELL_LOADER, APPLICATION_DEFAULT_ROUTE, APPLICATION_ROUTES } from './applications/routes.generated';
import { ONBOARDING_V2_ROUTES } from './applications/erp/onboarding/onboarding.routes';
import { ACTIVE_APPLICATION_ID } from './applications/routes.generated';
import { APP_SHELL_CONFIGS } from './applications/shell.config';
import { resolveApplicationNavigation, resolveApplicationZoneConfig } from './applications/navigation.generated';
import { SidebarNode } from './platform/core/navigation/sidebar.types';

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
 *   - Feature route trees selected by generated application routes
 */
export const APP_ROUTES: Routes = [
  // ─────────────────────────────────────────────────────────────────────────────
  // Public Routes
  // ─────────────────────────────────────────────────────────────────────────────
  ...ONBOARDING_V2_ROUTES,
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./platform/core/pages/login/login.page').then(m => m.LoginPage),
  },
  {
    path: 'auth/callback',
    loadComponent: () =>
      import('./platform/core/pages/auth-callback/auth-callback.page').then(m => m.AuthCallbackPage),
  },
  {
    path: 'tenant-selection',
    canActivate: [authGuard, tenantSelectionGuard],
    loadComponent: () =>
      import('./platform/core/pages/tenant-selection/tenant-selection.page').then(m => m.TenantSelectionPage),
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Protected Routes (require tenant context)
  // ─────────────────────────────────────────────────────────────────────────────
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
          import('./platform/features/approvals/approvals.routes').then(
            (m) => m.APPROVALS_ROUTES
          ),
      },
      {
        path: 'administration',
        canActivate: [authGuard],
        data: { breadcrumb: 'Administration' },
        loadChildren: () =>
          import('./platform/features/administration/administration.routes').then(
            (m) => m.ADMINISTRATION_ROUTES
          ),
      },
      {
        path: 'admin',
        canActivate: [authGuard],
        data: { breadcrumb: 'Administration' },
        loadComponent: () =>
          import('./applications/erp/pages/administration/hub/admin-hub.page').then(
            (m) => m.AdminHubPage
          ),
      },
      ...APPLICATION_ROUTES,
      {
        path: 'user-settings',
        canActivate: [authGuard],
        loadChildren: () =>
          import('./platform/features/user-settings/user-settings.routes').then(
            (m) => m.USER_SETTINGS_ROUTES
          ),
      },
      {
        path: 'notifications',
        canActivate: [authGuard],
        loadChildren: () =>
          import('./platform/features/notifications/notifications.routes').then(
            (m) => m.NOTIFICATIONS_ROUTES
          ),
      },
      {
        path: 'access-denied',
        loadComponent: () =>
          import('./platform/core/pages/errors/access-denied.page').then(
            (m) => m.AccessDeniedPage
          ),
      },
      {
        path: 'feature-unavailable/:featureId',
        loadComponent: () =>
          import('./platform/core/pages/errors/feature-unavailable.page').then(m => m.FeatureUnavailablePage),
      },
      {
        path: 'module-unavailable/:moduleId',
        loadComponent: () =>
          import('./platform/core/pages/errors/feature-unavailable.page').then(m => m.FeatureUnavailablePage),
      },
      // 404 inside the shell — preserve sidebar/topbar so user can navigate away.
      {
        path: '**',
        loadComponent: () =>
          import('./platform/core/pages/errors/not-found.page').then(m => m.NotFoundPage),
      },
    ],
  },

  // Public error/maintenance routes (no shell, no auth).
  {
    path: 'error/500',
    loadComponent: () =>
      import('./platform/core/pages/errors/server-error.page').then(m => m.ServerErrorPage),
  },
  {
    path: 'maintenance',
    loadComponent: () =>
      import('./platform/core/pages/errors/maintenance.page').then(m => m.MaintenancePage),
  },
  // Public 404 — only reached when the user hits a path outside any shell context.
  {
    path: '**',
    loadComponent: () =>
      import('./platform/core/pages/errors/not-found.page').then(m => m.NotFoundPage),
  },
];
