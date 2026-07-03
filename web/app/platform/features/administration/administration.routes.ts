import { Routes } from '@angular/router';

export const ADMINISTRATION_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'members',
    pathMatch: 'full',
  },
  {
    path: 'members',
    loadChildren: () =>
      import('./iam/members/members.routes').then((m) => m.MEMBERS_ROUTES),
  },
  {
    path: 'roles',
    loadChildren: () =>
      import('./iam/roles/roles.routes').then((m) => m.ROLES_ROUTES),
  },
  {
    path: 'domain-activation',
    loadChildren: () =>
      import('./domain-activation/domain-activation.routes').then(
        (m) => m.DOMAIN_ACTIVATION_ROUTES
      ),
  },
  {
    path: 'audit',
    loadChildren: () =>
      import('./audit/audit.routes').then((m) => m.AUDIT_ROUTES),
  },
  {
    path: 'templates',
    loadChildren: () =>
      import('./templates/templates.routes').then((m) => m.TEMPLATES_ROUTES),
  },
  {
    path: 'email-templates',
    loadChildren: () =>
      import('./email-templates/email-templates.routes').then(
        (m) => m.EMAIL_TEMPLATES_ROUTES
      ),
  },
  {
    path: 'workflows',
    loadChildren: () =>
      import('./workflows/workflows.routes').then((m) => m.WORKFLOWS_ROUTES),
  },
  {
    path: 'scheduled-jobs',
    loadChildren: () =>
      import('./scheduled-jobs/scheduled-jobs.routes').then(
        (m) => m.SCHEDULED_JOBS_ROUTES
      ),
  },
  {
    path: 'webhooks',
    loadChildren: () =>
      import('./webhooks/webhooks.routes').then((m) => m.WEBHOOKS_ROUTES),
  },
  {
    path: 'api-keys',
    loadChildren: () =>
      import('./api-keys/api-keys.routes').then((m) => m.API_KEYS_ROUTES),
  },
  {
    path: 'numbering-sequences',
    loadChildren: () =>
      import('./numbering-sequences/numbering-sequences.routes').then(
        (m) => m.NUMBERING_SEQUENCES_ROUTES
      ),
  },
  {
    path: 'subscriptions',
    loadChildren: () =>
      import('./subscriptions/subscriptions.routes').then(
        (m) => m.SUBSCRIPTIONS_ROUTES
      ),
  },
  {
    path: 'settings',
    loadChildren: () =>
      import('../app-settings/app-settings.routes').then(
        (m) => m.APP_SETTINGS_ROUTES
      ),
  },
  {
    path: 'societe',
    loadComponent: () =>
      import('@applications/erp/pages/administration/societe/societe.page').then(
        (m) => m.SocietePage
      ),
    data: { title: 'Identité société', breadcrumb: 'Société' },
  },
  {
    path: 'parametres-fiscal',
    loadComponent: () =>
      import('@applications/erp/pages/administration/parametres-fiscal/parametres-fiscal.page').then(
        (m) => m.ParametresFiscalPage
      ),
    data: { title: 'Paramètres fiscaux', breadcrumb: 'Paramètres fiscaux' },
  },
  {
    path: 'demo',
    loadComponent: () =>
      import('@applications/erp/pages/administration/demo-reset/demo-reset.page').then(
        (m) => m.DemoResetPage
      ),
    data: { title: 'Jeu de données démo', breadcrumb: 'Démo' },
  },
];
