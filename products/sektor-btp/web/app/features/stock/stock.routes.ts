import { Routes } from '@angular/router';

export const STOCK_BTP_ROUTES: Routes = [
  {
    path: 'm/stock/scan/:context',
    loadComponent: () =>
      import('./pages/mobile/inventory-mobile-scanner.page').then(
        (m) => m.InventoryMobileScannerPage,
      ),
    data: { titleKey: 'inventory.routes.scanner.title', breadcrumbKey: 'inventory.routes.scanner.breadcrumb' },
  },
  {
    path: 'stock/magasin-chantier/:chantierId',
    loadComponent: () =>
      import('./pages/magasin-chantier/magasin-chantier.page').then(
        (m) => m.MagasinChantierPage,
      ),
    data: { titleKey: 'inventory.routes.magasinChantier.title', breadcrumbKey: 'inventory.routes.magasinChantier.breadcrumb' },
  },
  {
    path: 'stock/reservations',
    loadComponent: () =>
      import('./pages/reservations/reservations-stock.page').then(
        (m) => m.ReservationsStockPage,
      ),
    data: { titleKey: 'inventory.routes.reservations.title', breadcrumbKey: 'inventory.routes.reservations.breadcrumb' },
  },
  {
    path: 'stock',
    pathMatch: 'full',
    redirectTo: 'stock/mouvements/receptions',
  },
  {
    path: 'materiel',
    pathMatch: 'full',
    redirectTo: 'materiel/parc',
  },
  {
    path: 'materiel/parc',
    loadComponent: () =>
      import('./pages/materiel/parc/parc-materiel.page').then((m) => m.ParcMaterielPage),
    data: { titleKey: 'inventory.routes.parcMateriel.title', breadcrumbKey: 'inventory.routes.parcMateriel.breadcrumb' },
  },
  {
    path: 'materiel/parc/new',
    loadComponent: () =>
      import('./pages/catalogue/materiel/materiel-detail').then((m) => m.MaterielDetailPage),
    data: { titleKey: 'inventory.routes.parcMateriel.new', breadcrumbKey: 'inventory.routes.parcMateriel.breadcrumb' },
  },
  {
    path: 'materiel/parc/:id',
    loadComponent: () =>
      import('./pages/catalogue/materiel/materiel-detail').then((m) => m.MaterielDetailPage),
    data: { titleKey: 'inventory.routes.parcMateriel.detail', breadcrumbKey: 'inventory.routes.parcMateriel.breadcrumb' },
  },
  {
    path: 'materiel/affectations',
    loadComponent: () =>
      import('./pages/materiel/affectations/affectations.page').then((m) => m.AffectationsPage),
    data: { titleKey: 'inventory.routes.affectationsMateriel.title', breadcrumbKey: 'inventory.routes.affectationsMateriel.breadcrumb' },
  },
  {
    path: 'materiel/engins/:id',
    loadComponent: () =>
      import('./pages/materiel/fiche-360/engin-fiche-360.page').then((m) => m.EnginFiche360Page),
    data: { titleKey: 'inventory.routes.ficheEngin.title', breadcrumbKey: 'inventory.routes.ficheEngin.breadcrumb' },
  },
  {
    path: 'materiel/planning',
    loadComponent: () =>
      import('./pages/materiel/planning/materiel-planning.page').then((m) => m.MaterielPlanningPage),
    data: { titleKey: 'inventory.routes.planningMateriel.title', breadcrumbKey: 'inventory.routes.planningMateriel.breadcrumb' },
  },
  {
    path: 'materiel/pointage',
    loadComponent: () =>
      import('./pages/materiel/pointage/pointage-engin.page').then((m) => m.PointageEnginPage),
    data: { titleKey: 'inventory.routes.pointageEngin.title', breadcrumbKey: 'inventory.routes.pointageEngin.breadcrumb' },
  },
  {
    path: 'materiel/controles',
    loadComponent: () =>
      import('./pages/materiel/controles/controles-reglementaires.page').then(
        (m) => m.ControlesReglementairesPage,
      ),
    data: { titleKey: 'inventory.routes.controlesReglementaires.title', breadcrumbKey: 'inventory.routes.controlesReglementaires.breadcrumb' },
  },
  {
    path: 'materiel/locations',
    loadComponent: () =>
      import('./pages/materiel/locations/locations-hub.page').then((m) => m.LocationsHubPage),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'contrats' },
      {
        path: 'contrats',
        loadComponent: () =>
          import('./pages/materiel/locations/contrats-location.page').then(
            (m) => m.ContratsLocationPage,
          ),
      },
      {
        path: 'etats',
        loadComponent: () =>
          import('./pages/materiel/locations/etats-contradictoires.page').then(
            (m) => m.EtatsContradictoiresPage,
          ),
      },
      {
        path: 'echeances',
        loadComponent: () =>
          import('./pages/materiel/locations/echeances-location.page').then(
            (m) => m.EcheancesLocationPage,
          ),
      },
    ],
    data: { titleKey: 'inventory.routes.locationsExternes.title', breadcrumbKey: 'inventory.routes.locationsExternes.breadcrumb' },
  },
  {
    path: 'materiel/maintenance',
    pathMatch: 'full',
    redirectTo: 'materiel/maintenance/plans',
  },
  {
    path: 'materiel/maintenance/plans',
    loadComponent: () =>
      import('./pages/materiel/maintenance/plans-maintenance.page').then(
        (m) => m.PlansMaintenancePage,
      ),
    data: { titleKey: 'inventory.routes.plansMaintenance.title', breadcrumbKey: 'inventory.routes.plansMaintenance.breadcrumb' },
  },
  {
    path: 'materiel/maintenance/ot',
    loadComponent: () =>
      import('./pages/materiel/maintenance/ot-list.page').then((m) => m.OtListPage),
    data: { titleKey: 'inventory.routes.ordresTravail.title', breadcrumbKey: 'inventory.routes.ordresTravail.breadcrumb' },
  },
  {
    path: 'materiel/maintenance/ot/:id',
    loadComponent: () =>
      import('./pages/materiel/maintenance/ot-detail.page').then((m) => m.OtDetailPage),
    data: { titleKey: 'inventory.routes.ordreTravail.title', breadcrumbKey: 'inventory.routes.ordreTravail.breadcrumb' },
  },
  {
    path: 'materiel/maintenance/historique/:engineId',
    loadComponent: () =>
      import('./pages/materiel/maintenance/historique-ot.page').then((m) => m.HistoriqueOtPage),
    data: { titleKey: 'inventory.routes.historiqueMaintenance.title', breadcrumbKey: 'inventory.routes.historiqueMaintenance.breadcrumb' },
  },
  {
    path: 'materiel/carburant',
    pathMatch: 'full',
    redirectTo: 'materiel/carburant/carnets',
  },
  {
    path: 'materiel/carburant/carnets',
    loadComponent: () =>
      import('./pages/materiel/carburant/carnets-carburant.page').then((m) => m.CarnetsCarburantPage),
    data: { titleKey: 'inventory.routes.carnetsCarburant.title', breadcrumbKey: 'inventory.routes.carnetsCarburant.breadcrumb' },
  },
  {
    path: 'materiel/carburant/pleins',
    loadComponent: () =>
      import('./pages/materiel/carburant/pleins-carburant.page').then((m) => m.PleinsCarburantPage),
    data: { titleKey: 'inventory.routes.pleinsCarburant.title', breadcrumbKey: 'inventory.routes.pleinsCarburant.breadcrumb' },
  },
  {
    path: 'materiel/carburant/consommations',
    loadComponent: () =>
      import('./pages/materiel/carburant/consommations-carburant.page').then(
        (m) => m.ConsommationsCarburantPage,
      ),
    data: { titleKey: 'inventory.routes.consommationsCarburant.title', breadcrumbKey: 'inventory.routes.consommationsCarburant.breadcrumb' },
  },
  // MOUVEMENTS
  {
    path: 'stock/mouvements/receptions',
    loadChildren: () =>
      import('./pages/mouvements/receptions/receptions.routes').then((m) => m.RECEPTIONS_ROUTES),
  },
  {
    path: 'stock/mouvements/transferts',
    loadChildren: () =>
      import('./pages/mouvements/transferts/transferts.routes').then(
        (m) => m.TRANSFERTS_ROUTES,
      ),
  },
  {
    path: 'stock/mouvements/retours',
    loadChildren: () =>
      import('./pages/mouvements/retours/retours.routes').then((m) => m.RETOURS_ROUTES),
  },
  {
    path: 'stock/mouvements/inventaires',
    loadChildren: () =>
      import('./pages/mouvements/inventaires/inventaires.routes').then(
        (m) => m.INVENTAIRES_ROUTES,
      ),
  },
  {
    path: 'stock/mouvements/pertes-chutes',
    loadChildren: () =>
      import('./pages/mouvements/pertes-chutes/pertes-chutes.routes').then(
        (m) => m.PERTES_CHUTES_ROUTES,
      ),
  },
  {
    path: 'stock/mouvements/sorties',
    loadChildren: () =>
      import('./pages/mouvements/sorties/sorties.routes').then((m) => m.SORTIES_ROUTES),
  },
  // MATÉRIEL
  {
    path: 'stock/materiel/parc',
    loadComponent: () =>
      import('./pages/materiel/parc/parc-materiel.page').then((m) => m.ParcMaterielPage),
    data: { titleKey: 'inventory.routes.parcMateriel.title', breadcrumbKey: 'inventory.routes.parcMateriel.breadcrumb' },
  },
  {
    path: 'stock/materiel/affectations',
    loadComponent: () =>
      import('./pages/materiel/affectations/affectations.page').then((m) => m.AffectationsPage),
    data: { titleKey: 'inventory.routes.affectationsMateriel.title', breadcrumbKey: 'inventory.routes.affectationsMateriel.breadcrumb' },
  },
  {
    path: 'stock/materiel/engins/:id',
    loadComponent: () =>
      import('./pages/materiel/fiche-360/engin-fiche-360.page').then((m) => m.EnginFiche360Page),
    data: { titleKey: 'inventory.routes.ficheEngin.title', breadcrumbKey: 'inventory.routes.ficheEngin.breadcrumb' },
  },
  {
    path: 'stock/materiel/planning',
    loadComponent: () =>
      import('./pages/materiel/planning/materiel-planning.page').then((m) => m.MaterielPlanningPage),
    data: { titleKey: 'inventory.routes.planningMateriel.title', breadcrumbKey: 'inventory.routes.planningMateriel.breadcrumb' },
  },
  {
    path: 'stock/materiel/pointage',
    loadComponent: () =>
      import('./pages/materiel/pointage/pointage-engin.page').then((m) => m.PointageEnginPage),
    data: { titleKey: 'inventory.routes.pointageEngin.title', breadcrumbKey: 'inventory.routes.pointageEngin.breadcrumb' },
  },
  {
    path: 'stock/materiel/controles',
    loadComponent: () =>
      import('./pages/materiel/controles/controles-reglementaires.page').then(
        (m) => m.ControlesReglementairesPage,
      ),
    data: { titleKey: 'inventory.routes.controlesReglementaires.title', breadcrumbKey: 'inventory.routes.controlesReglementaires.breadcrumb' },
  },
  {
    path: 'stock/materiel/locations',
    loadComponent: () =>
      import('./pages/materiel/locations/locations-hub.page').then((m) => m.LocationsHubPage),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'contrats' },
      {
        path: 'contrats',
        loadComponent: () =>
          import('./pages/materiel/locations/contrats-location.page').then(
            (m) => m.ContratsLocationPage,
          ),
      },
      {
        path: 'etats',
        loadComponent: () =>
          import('./pages/materiel/locations/etats-contradictoires.page').then(
            (m) => m.EtatsContradictoiresPage,
          ),
      },
      {
        path: 'echeances',
        loadComponent: () =>
          import('./pages/materiel/locations/echeances-location.page').then(
            (m) => m.EcheancesLocationPage,
          ),
      },
    ],
    data: { titleKey: 'inventory.routes.locationsExternes.title', breadcrumbKey: 'inventory.routes.locationsExternes.breadcrumb' },
  },
  {
    path: 'stock/materiel/maintenance',
    pathMatch: 'full',
    redirectTo: 'stock/materiel/maintenance/plans',
  },
  {
    path: 'stock/materiel/maintenance/plans',
    loadComponent: () =>
      import('./pages/materiel/maintenance/plans-maintenance.page').then(
        (m) => m.PlansMaintenancePage,
      ),
    data: { titleKey: 'inventory.routes.plansMaintenance.title', breadcrumbKey: 'inventory.routes.plansMaintenance.breadcrumb' },
  },
  {
    path: 'stock/materiel/maintenance/ot',
    loadComponent: () =>
      import('./pages/materiel/maintenance/ot-list.page').then((m) => m.OtListPage),
    data: { titleKey: 'inventory.routes.ordresTravail.title', breadcrumbKey: 'inventory.routes.ordresTravail.breadcrumb' },
  },
  {
    path: 'stock/materiel/maintenance/ot/:id',
    loadComponent: () =>
      import('./pages/materiel/maintenance/ot-detail.page').then((m) => m.OtDetailPage),
    data: { titleKey: 'inventory.routes.ordreTravail.title', breadcrumbKey: 'inventory.routes.ordreTravail.breadcrumb' },
  },
  {
    path: 'stock/materiel/maintenance/historique/:engineId',
    loadComponent: () =>
      import('./pages/materiel/maintenance/historique-ot.page').then((m) => m.HistoriqueOtPage),
    data: { titleKey: 'inventory.routes.historiqueMaintenance.title', breadcrumbKey: 'inventory.routes.historiqueMaintenance.breadcrumb' },
  },
  {
    path: 'stock/materiel/carburant',
    pathMatch: 'full',
    redirectTo: 'stock/materiel/carburant/carnets',
  },
  {
    path: 'stock/materiel/carburant/carnets',
    loadComponent: () =>
      import('./pages/materiel/carburant/carnets-carburant.page').then((m) => m.CarnetsCarburantPage),
    data: { titleKey: 'inventory.routes.carnetsCarburant.title', breadcrumbKey: 'inventory.routes.carnetsCarburant.breadcrumb' },
  },
  {
    path: 'stock/materiel/carburant/pleins',
    loadComponent: () =>
      import('./pages/materiel/carburant/pleins-carburant.page').then((m) => m.PleinsCarburantPage),
    data: { titleKey: 'inventory.routes.pleinsCarburant.title', breadcrumbKey: 'inventory.routes.pleinsCarburant.breadcrumb' },
  },
  {
    path: 'stock/materiel/carburant/consommations',
    loadComponent: () =>
      import('./pages/materiel/carburant/consommations-carburant.page').then(
        (m) => m.ConsommationsCarburantPage,
      ),
    data: { titleKey: 'inventory.routes.consommationsCarburant.title', breadcrumbKey: 'inventory.routes.consommationsCarburant.breadcrumb' },
  },

  // SUIVI
  {
    path: 'stock/suivi/etat-stock',
    loadComponent: () =>
      import('./pages/suivi/etat-stock/etat-stocks.page').then((m) => m.EtatStocksPage),
    data: { titleKey: 'inventory.routes.etatStock.title', breadcrumbKey: 'inventory.routes.etatStock.breadcrumb' },
  },
  {
    path: 'stock/suivi/valorisation',
    loadComponent: () =>
      import('./pages/suivi/valorisation/valorisation.page').then((m) => m.ValorisationPage),
    data: { titleKey: 'inventory.routes.valorisation.title', breadcrumbKey: 'inventory.routes.valorisation.breadcrumb' },
  },
  {
    path: 'stock/suivi/alertes',
    loadComponent: () =>
      import('./pages/suivi/alertes/alertes-reappro.page').then((m) => m.AlertesReapproPage),
    data: { titleKey: 'inventory.routes.alertes.title', breadcrumbKey: 'inventory.routes.alertes.breadcrumb' },
  },
  // CATALOGUE
  {
    path: 'stock/catalogue/articles',
    loadChildren: () =>
      import('./pages/catalogue/articles/articles.routes').then((m) => m.ARTICLES_ROUTES),
  },
  {
    path: 'stock/catalogue/materiel',
    loadChildren: () =>
      import('./pages/catalogue/materiel/materiel.routes').then((m) => m.MATERIEL_ROUTES),
  },
  // CONFIGURATION
  {
    path: 'stock/configuration/depots',
    loadChildren: () =>
      import('./pages/configuration/depots/location-config.routes').then(
        (m) => m.LOCATION_CONFIG_ROUTES,
      ),
  },
  {
    path: 'stock/configuration/familles',
    loadChildren: () =>
      import('./pages/configuration/familles/famille-article.routes').then(
        (m) => m.FAMILLE_ARTICLE_ROUTES,
      ),
  },
  {
    path: 'stock/configuration/types-articles',
    loadChildren: () =>
      import('./pages/configuration/types-articles/type-article.routes').then(
        (m) => m.TYPE_ARTICLE_ROUTES,
      ),
  },
  {
    path: 'stock/configuration/motifs',
    loadChildren: () =>
      import('./pages/configuration/motifs/motif-mouvement.routes').then(
        (m) => m.MOTIF_MOUVEMENT_ROUTES,
      ),
  },
  {
    path: 'stock/configuration/uom',
    loadChildren: () =>
      import('./pages/configuration/uom/uom.routes').then((m) => m.UOM_ROUTES),
  },
  {
    path: 'stock/configuration/uom-categories',
    loadChildren: () =>
      import('./pages/configuration/uom-categories/uom-category.routes').then(
        (m) => m.UOM_CATEGORY_ROUTES,
      ),
  },
  {
    path: 'stock/configuration/costing-methods',
    loadChildren: () =>
      import('./pages/configuration/costing-methods/costing-method.routes').then(
        (m) => m.COSTING_METHOD_ROUTES,
      ),
  },
];
