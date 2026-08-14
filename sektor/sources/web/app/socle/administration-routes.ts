/**
 * Routes d'administration contribuees par l'application — appartiennent a SEKTOR.
 *
 * `platform/features/administration/administration.routes.ts` chargeait ces pages en dur
 * depuis `@app/*`. La plateforme expose desormais une zone `administration` ;
 * l'application y declare ses routes. Voir
 * `sektor/docs/specs/epics/_archive/front-ownership/`.
 */
import { Routes } from '@angular/router';

export const ADMINISTRATION_APP_ROUTES: Routes = [
  {
    path: 'societe',
    loadComponent: () =>
      import('./administration/societe/societe.page').then(
        (m) => m.SocietePage
      ),
    data: { title: 'Identité société', breadcrumb: 'Société' },
  },
  {
    path: 'parametres-fiscal',
    loadComponent: () =>
      import('./administration/parametres-fiscal/parametres-fiscal.page').then(
        (m) => m.ParametresFiscalPage
      ),
    data: { title: 'Paramètres fiscaux', breadcrumb: 'Paramètres fiscaux' },
  },
  {
    path: 'demo',
    loadComponent: () =>
      import('./administration/demo-reset/demo-reset.page').then(
        (m) => m.DemoResetPage
      ),
    data: { title: 'Jeu de données démo', breadcrumb: 'Démo' },
  },
];
