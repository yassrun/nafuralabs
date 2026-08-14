import { Routes } from '@angular/router';

/** Console catalogue — lazy under path: 'catalogue' (URL /catalogue). */
export const CATALOGUE_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./console/catalogue-console.page').then((m) => m.CatalogueConsolePage),
    data: {
      title: 'Console catalogue Sektor',
      breadcrumb: 'Catalogue',
    },
  },
];

/** Référentiel stock / matériel + bibliothèque-prix. Spread at ERP root — URLs inchangées. */
export const INVENTORY_BTP_ROUTES: Routes = [
  {
    path: 'm/inventory/scan/:context',
    loadComponent: () =>
      import('./mobile/inventory-mobile-scanner.page').then(
        (m) => m.InventoryMobileScannerPage,
      ),
    data: { titleKey: 'inventory.routes.scanner.title', breadcrumbKey: 'inventory.routes.scanner.breadcrumb' },
  },
  {
    path: 'inventory/magasin-chantier/:chantierId',
    loadComponent: () =>
      import('./magasin-chantier/magasin-chantier.page').then(
        (m) => m.MagasinChantierPage,
      ),
    data: { titleKey: 'inventory.routes.magasinChantier.title', breadcrumbKey: 'inventory.routes.magasinChantier.breadcrumb' },
  },
  {
    path: 'inventory/reservations',
    loadComponent: () =>
      import('./reservations/reservations-stock.page').then(
        (m) => m.ReservationsStockPage,
      ),
    data: { titleKey: 'inventory.routes.reservations.title', breadcrumbKey: 'inventory.routes.reservations.breadcrumb' },
  },
  {
    path: 'inventory',
    pathMatch: 'full',
    redirectTo: 'inventory/mouvements/receptions',
  },
  {
    path: 'materiel',
    pathMatch: 'full',
    redirectTo: 'materiel/parc',
  },
  {
    path: 'materiel/parc',
    loadComponent: () =>
      import('./materiel-parc/parc/parc-materiel.page').then((m) => m.ParcMaterielPage),
    data: { titleKey: 'inventory.routes.parcMateriel.title', breadcrumbKey: 'inventory.routes.parcMateriel.breadcrumb' },
  },
  {
    path: 'materiel/parc/new',
    loadComponent: () =>
      import('./materiel/materiel-detail').then((m) => m.MaterielDetailPage),
    data: { titleKey: 'inventory.routes.parcMateriel.new', breadcrumbKey: 'inventory.routes.parcMateriel.breadcrumb' },
  },
  {
    path: 'materiel/parc/:id',
    loadComponent: () =>
      import('./materiel/materiel-detail').then((m) => m.MaterielDetailPage),
    data: { titleKey: 'inventory.routes.parcMateriel.detail', breadcrumbKey: 'inventory.routes.parcMateriel.breadcrumb' },
  },
  {
    path: 'materiel/affectations',
    loadComponent: () =>
      import('./materiel-parc/affectations/affectations.page').then((m) => m.AffectationsPage),
    data: { titleKey: 'inventory.routes.affectationsMateriel.title', breadcrumbKey: 'inventory.routes.affectationsMateriel.breadcrumb' },
  },
  {
    path: 'materiel/engins/:id',
    loadComponent: () =>
      import('./materiel-parc/fiche-360/engin-fiche-360.page').then((m) => m.EnginFiche360Page),
    data: { titleKey: 'inventory.routes.ficheEngin.title', breadcrumbKey: 'inventory.routes.ficheEngin.breadcrumb' },
  },
  {
    path: 'materiel/planning',
    loadComponent: () =>
      import('./materiel-parc/planning/materiel-planning.page').then((m) => m.MaterielPlanningPage),
    data: { titleKey: 'inventory.routes.planningMateriel.title', breadcrumbKey: 'inventory.routes.planningMateriel.breadcrumb' },
  },
  {
    path: 'materiel/pointage',
    loadComponent: () =>
      import('./materiel-parc/pointage/pointage-engin.page').then((m) => m.PointageEnginPage),
    data: { titleKey: 'inventory.routes.pointageEngin.title', breadcrumbKey: 'inventory.routes.pointageEngin.breadcrumb' },
  },
  {
    path: 'materiel/controles',
    loadComponent: () =>
      import('./materiel-parc/controles/controles-reglementaires.page').then(
        (m) => m.ControlesReglementairesPage,
      ),
    data: { titleKey: 'inventory.routes.controlesReglementaires.title', breadcrumbKey: 'inventory.routes.controlesReglementaires.breadcrumb' },
  },
  {
    path: 'materiel/locations',
    loadComponent: () =>
      import('./materiel-parc/locations/locations-hub.page').then((m) => m.LocationsHubPage),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'contrats' },
      {
        path: 'contrats',
        loadComponent: () =>
          import('./materiel-parc/locations/contrats-location.page').then(
            (m) => m.ContratsLocationPage,
          ),
      },
      {
        path: 'etats',
        loadComponent: () =>
          import('./materiel-parc/locations/etats-contradictoires.page').then(
            (m) => m.EtatsContradictoiresPage,
          ),
      },
      {
        path: 'echeances',
        loadComponent: () =>
          import('./materiel-parc/locations/echeances-location.page').then(
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
      import('./materiel-parc/maintenance/plans-maintenance.page').then(
        (m) => m.PlansMaintenancePage,
      ),
    data: { titleKey: 'inventory.routes.plansMaintenance.title', breadcrumbKey: 'inventory.routes.plansMaintenance.breadcrumb' },
  },
  {
    path: 'materiel/maintenance/ot',
    loadComponent: () =>
      import('./materiel-parc/maintenance/ot-list.page').then((m) => m.OtListPage),
    data: { titleKey: 'inventory.routes.ordresTravail.title', breadcrumbKey: 'inventory.routes.ordresTravail.breadcrumb' },
  },
  {
    path: 'materiel/maintenance/ot/:id',
    loadComponent: () =>
      import('./materiel-parc/maintenance/ot-detail.page').then((m) => m.OtDetailPage),
    data: { titleKey: 'inventory.routes.ordreTravail.title', breadcrumbKey: 'inventory.routes.ordreTravail.breadcrumb' },
  },
  {
    path: 'materiel/maintenance/historique/:engineId',
    loadComponent: () =>
      import('./materiel-parc/maintenance/historique-ot.page').then((m) => m.HistoriqueOtPage),
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
      import('./materiel-parc/carburant/carnets-carburant.page').then((m) => m.CarnetsCarburantPage),
    data: { titleKey: 'inventory.routes.carnetsCarburant.title', breadcrumbKey: 'inventory.routes.carnetsCarburant.breadcrumb' },
  },
  {
    path: 'materiel/carburant/pleins',
    loadComponent: () =>
      import('./materiel-parc/carburant/pleins-carburant.page').then((m) => m.PleinsCarburantPage),
    data: { titleKey: 'inventory.routes.pleinsCarburant.title', breadcrumbKey: 'inventory.routes.pleinsCarburant.breadcrumb' },
  },
  {
    path: 'materiel/carburant/consommations',
    loadComponent: () =>
      import('./materiel-parc/carburant/consommations-carburant.page').then(
        (m) => m.ConsommationsCarburantPage,
      ),
    data: { titleKey: 'inventory.routes.consommationsCarburant.title', breadcrumbKey: 'inventory.routes.consommationsCarburant.breadcrumb' },
  },
  // MOUVEMENTS
  {
    path: 'inventory/mouvements/receptions',
    loadChildren: () =>
      import('./mouvements/receptions/receptions.routes').then((m) => m.RECEPTIONS_ROUTES),
  },
  {
    path: 'inventory/mouvements/transferts',
    loadChildren: () =>
      import('./mouvements/transferts/transferts.routes').then(
        (m) => m.TRANSFERTS_ROUTES,
      ),
  },
  {
    path: 'inventory/mouvements/retours',
    loadChildren: () =>
      import('./mouvements/retours/retours.routes').then((m) => m.RETOURS_ROUTES),
  },
  {
    path: 'inventory/mouvements/inventaires',
    loadChildren: () =>
      import('./mouvements/inventaires/inventaires.routes').then(
        (m) => m.INVENTAIRES_ROUTES,
      ),
  },
  {
    path: 'inventory/mouvements/pertes-chutes',
    loadChildren: () =>
      import('./mouvements/pertes-chutes/pertes-chutes.routes').then(
        (m) => m.PERTES_CHUTES_ROUTES,
      ),
  },
  {
    path: 'inventory/mouvements/sorties',
    loadChildren: () =>
      import('./mouvements/sorties/sorties.routes').then((m) => m.SORTIES_ROUTES),
  },
  // MATÉRIEL
  {
    path: 'inventory/materiel/parc',
    loadComponent: () =>
      import('./materiel-parc/parc/parc-materiel.page').then((m) => m.ParcMaterielPage),
    data: { titleKey: 'inventory.routes.parcMateriel.title', breadcrumbKey: 'inventory.routes.parcMateriel.breadcrumb' },
  },
  {
    path: 'inventory/materiel/affectations',
    loadComponent: () =>
      import('./materiel-parc/affectations/affectations.page').then((m) => m.AffectationsPage),
    data: { titleKey: 'inventory.routes.affectationsMateriel.title', breadcrumbKey: 'inventory.routes.affectationsMateriel.breadcrumb' },
  },
  {
    path: 'inventory/materiel/engins/:id',
    loadComponent: () =>
      import('./materiel-parc/fiche-360/engin-fiche-360.page').then((m) => m.EnginFiche360Page),
    data: { titleKey: 'inventory.routes.ficheEngin.title', breadcrumbKey: 'inventory.routes.ficheEngin.breadcrumb' },
  },
  {
    path: 'inventory/materiel/planning',
    loadComponent: () =>
      import('./materiel-parc/planning/materiel-planning.page').then((m) => m.MaterielPlanningPage),
    data: { titleKey: 'inventory.routes.planningMateriel.title', breadcrumbKey: 'inventory.routes.planningMateriel.breadcrumb' },
  },
  {
    path: 'inventory/materiel/pointage',
    loadComponent: () =>
      import('./materiel-parc/pointage/pointage-engin.page').then((m) => m.PointageEnginPage),
    data: { titleKey: 'inventory.routes.pointageEngin.title', breadcrumbKey: 'inventory.routes.pointageEngin.breadcrumb' },
  },
  {
    path: 'inventory/materiel/controles',
    loadComponent: () =>
      import('./materiel-parc/controles/controles-reglementaires.page').then(
        (m) => m.ControlesReglementairesPage,
      ),
    data: { titleKey: 'inventory.routes.controlesReglementaires.title', breadcrumbKey: 'inventory.routes.controlesReglementaires.breadcrumb' },
  },
  {
    path: 'inventory/materiel/locations',
    loadComponent: () =>
      import('./materiel-parc/locations/locations-hub.page').then((m) => m.LocationsHubPage),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'contrats' },
      {
        path: 'contrats',
        loadComponent: () =>
          import('./materiel-parc/locations/contrats-location.page').then(
            (m) => m.ContratsLocationPage,
          ),
      },
      {
        path: 'etats',
        loadComponent: () =>
          import('./materiel-parc/locations/etats-contradictoires.page').then(
            (m) => m.EtatsContradictoiresPage,
          ),
      },
      {
        path: 'echeances',
        loadComponent: () =>
          import('./materiel-parc/locations/echeances-location.page').then(
            (m) => m.EcheancesLocationPage,
          ),
      },
    ],
    data: { titleKey: 'inventory.routes.locationsExternes.title', breadcrumbKey: 'inventory.routes.locationsExternes.breadcrumb' },
  },
  {
    path: 'inventory/materiel/maintenance',
    pathMatch: 'full',
    redirectTo: 'inventory/materiel/maintenance/plans',
  },
  {
    path: 'inventory/materiel/maintenance/plans',
    loadComponent: () =>
      import('./materiel-parc/maintenance/plans-maintenance.page').then(
        (m) => m.PlansMaintenancePage,
      ),
    data: { titleKey: 'inventory.routes.plansMaintenance.title', breadcrumbKey: 'inventory.routes.plansMaintenance.breadcrumb' },
  },
  {
    path: 'inventory/materiel/maintenance/ot',
    loadComponent: () =>
      import('./materiel-parc/maintenance/ot-list.page').then((m) => m.OtListPage),
    data: { titleKey: 'inventory.routes.ordresTravail.title', breadcrumbKey: 'inventory.routes.ordresTravail.breadcrumb' },
  },
  {
    path: 'inventory/materiel/maintenance/ot/:id',
    loadComponent: () =>
      import('./materiel-parc/maintenance/ot-detail.page').then((m) => m.OtDetailPage),
    data: { titleKey: 'inventory.routes.ordreTravail.title', breadcrumbKey: 'inventory.routes.ordreTravail.breadcrumb' },
  },
  {
    path: 'inventory/materiel/maintenance/historique/:engineId',
    loadComponent: () =>
      import('./materiel-parc/maintenance/historique-ot.page').then((m) => m.HistoriqueOtPage),
    data: { titleKey: 'inventory.routes.historiqueMaintenance.title', breadcrumbKey: 'inventory.routes.historiqueMaintenance.breadcrumb' },
  },
  {
    path: 'inventory/materiel/carburant',
    pathMatch: 'full',
    redirectTo: 'inventory/materiel/carburant/carnets',
  },
  {
    path: 'inventory/materiel/carburant/carnets',
    loadComponent: () =>
      import('./materiel-parc/carburant/carnets-carburant.page').then((m) => m.CarnetsCarburantPage),
    data: { titleKey: 'inventory.routes.carnetsCarburant.title', breadcrumbKey: 'inventory.routes.carnetsCarburant.breadcrumb' },
  },
  {
    path: 'inventory/materiel/carburant/pleins',
    loadComponent: () =>
      import('./materiel-parc/carburant/pleins-carburant.page').then((m) => m.PleinsCarburantPage),
    data: { titleKey: 'inventory.routes.pleinsCarburant.title', breadcrumbKey: 'inventory.routes.pleinsCarburant.breadcrumb' },
  },
  {
    path: 'inventory/materiel/carburant/consommations',
    loadComponent: () =>
      import('./materiel-parc/carburant/consommations-carburant.page').then(
        (m) => m.ConsommationsCarburantPage,
      ),
    data: { titleKey: 'inventory.routes.consommationsCarburant.title', breadcrumbKey: 'inventory.routes.consommationsCarburant.breadcrumb' },
  },

  // SUIVI
  {
    path: 'inventory/suivi/etat-stock',
    loadComponent: () =>
      import('./suivi/etat-stock/etat-stocks.page').then((m) => m.EtatStocksPage),
    data: { titleKey: 'inventory.routes.etatStock.title', breadcrumbKey: 'inventory.routes.etatStock.breadcrumb' },
  },
  {
    path: 'inventory/suivi/valorisation',
    loadComponent: () =>
      import('./suivi/valorisation/valorisation.page').then((m) => m.ValorisationPage),
    data: { titleKey: 'inventory.routes.valorisation.title', breadcrumbKey: 'inventory.routes.valorisation.breadcrumb' },
  },
  {
    path: 'inventory/suivi/alertes',
    loadComponent: () =>
      import('./suivi/alertes/alertes-reappro.page').then((m) => m.AlertesReapproPage),
    data: { titleKey: 'inventory.routes.alertes.title', breadcrumbKey: 'inventory.routes.alertes.breadcrumb' },
  },
  // CATALOGUE
  {
    path: 'inventory/catalogue/articles',
    loadChildren: () =>
      import('./articles/articles.routes').then((m) => m.ARTICLES_ROUTES),
  },
  {
    path: 'inventory/catalogue/materiel',
    loadChildren: () =>
      import('./materiel/materiel.routes').then((m) => m.MATERIEL_ROUTES),
  },
  // CONFIGURATION
  {
    path: 'inventory/configuration/depots',
    loadChildren: () =>
      import('./configuration/depots/location-config.routes').then(
        (m) => m.LOCATION_CONFIG_ROUTES,
      ),
  },
  {
    path: 'inventory/configuration/familles',
    loadChildren: () =>
      import('./configuration/familles/famille-article.routes').then(
        (m) => m.FAMILLE_ARTICLE_ROUTES,
      ),
  },
  {
    path: 'inventory/configuration/motifs',
    loadChildren: () =>
      import('./configuration/motifs/motif-mouvement.routes').then(
        (m) => m.MOTIF_MOUVEMENT_ROUTES,
      ),
  },
  {
    path: 'inventory/configuration/uom',
    loadChildren: () =>
      import('./configuration/uom/uom.routes').then((m) => m.UOM_ROUTES),
  },
  {
    path: 'inventory/configuration/uom-categories',
    loadChildren: () =>
      import('./configuration/uom-categories/uom-category.routes').then(
        (m) => m.UOM_CATEGORY_ROUTES,
      ),
  },
  {
    path: 'inventory/configuration/costing-methods',
    loadChildren: () =>
      import('./configuration/costing-methods/costing-method.routes').then(
        (m) => m.COSTING_METHOD_ROUTES,
      ),
  },
  {
    path: 'etudes/bibliotheque-prix',
    loadChildren: () =>
      import('./bibliotheque-prix/bibliotheque-prix.routes').then(
        (m) => m.BIBLIOTHEQUE_PRIX_ROUTES,
      ),
  },
];
