/**
 * ERP Nafura — Navigation BTP Maroc
 * Structure complète — tous les modules métier ERP orientés BTP.
 *
 * Flux métier BTP :
 *   Chantiers → Études → Achats → Stock → Matériel → Marchés & facturation → Finance → RH/HSE → Rapports
 *
 * Zones (4 max pour clarté visuelle) :
 *   work        → Tableau de bord
 *   operations  → Chantiers · Achats · Stock · Matériel
 *   business    → Études · Marchés & facturation · Finance
 *   people      → RH · HSE · Rapports
 */

import { GeneratedZoneConfig, SidebarNode } from '../../../platform/core/navigation/sidebar.types';

export const ERP_NAV_CONFIG_GENERATED: SidebarNode[] = [

  // ═══════════════════════════════════════════════════════════════════════════
  // TABLEAU DE BORD
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'dashboard',
    label: 'nav.dashboard',
    icon: 'layout-dashboard',
    route: '/dashboard',
    zone: 'work',
    order: 0,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CHANTIERS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'chantiers',
    label: 'nav.chantiers',
    icon: 'hard-hat',
    zone: 'operations',
    order: 10,
    children: [
      {
        id: 'chantiers.execution',
        label: 'nav.chantiers.execution',
        icon: 'hard-hat',
        order: 10,
        children: [
          {
            id: 'chantiers.liste',
            label: 'nav.chantiers.mesChanters',
            icon: 'building-2',
            route: '/chantiers',
            exactMatch: true,
            order: 10,
          },
          {
            id: 'chantiers.planning',
            label: 'nav.chantiers.planning',
            icon: 'calendar',
            route: '/chantiers/planning',
            order: 20,
          },
          {
            id: 'chantiers.avancements',
            label: 'nav.chantiers.avancements',
            icon: 'activity',
            route: '/chantiers/avancements',
            order: 30,
          },
        ],
      },
      {
        id: 'chantiers.pilotage',
        label: 'nav.chantiers.pilotage',
        icon: 'clipboard-list',
        order: 40,
        children: [
          {
            id: 'chantiers.situations',
            label: 'nav.chantiers.situations',
            icon: 'file-check',
            route: '/chantiers/situations',
            order: 10,
          },
          {
            id: 'chantiers.budget',
            label: 'nav.chantiers.budget',
            icon: 'wallet',
            route: '/chantiers/budget',
            order: 20,
          },
          {
            id: 'chantiers.sousTraitance',
            label: 'nav.chantiers.sousTraitance',
            icon: 'users',
            route: '/chantiers/sous-traitance',
            order: 30,
          },
        ],
      },
      {
        id: 'chantiers.documentation',
        label: 'nav.chantiers.documentation',
        icon: 'folder-open',
        order: 70,
        children: [
          {
            id: 'chantiers.documents',
            label: 'nav.chantiers.documents',
            icon: 'folder-open',
            route: '/chantiers/documents',
            order: 10,
          },
          {
            id: 'chantiers.attachements',
            label: 'nav.chantiers.attachements',
            icon: 'clipboard-list',
            route: '/chantiers/attachements',
            order: 20,
          },
          {
            id: 'chantiers.journal',
            label: 'nav.chantiers.journal',
            icon: 'book-open',
            route: '/chantiers/journal',
            order: 30,
          },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ACHATS & APPROVISIONNEMENT
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'achats',
    label: 'nav.achats',
    icon: 'shopping-cart',
    zone: 'operations',
    order: 20,
    children: [
      {
        id: 'achats.expression',
        label: 'nav.achats.expression',
        icon: 'file-plus',
        order: 10,
        children: [
          {
            id: 'achats.demandes',
            label: 'nav.achats.demandes',
            icon: 'file-plus',
            route: '/achats/demandes',
            order: 10,
          },
          {
            id: 'achats.appelsOffres',
            label: "nav.achats.appelsOffres",
            icon: 'send',
            route: '/achats/appels-offres',
            order: 20,
          },
        ],
      },
      {
        id: 'achats.engagements',
        label: 'nav.achats.engagements',
        icon: 'clipboard-check',
        order: 40,
        children: [
          {
            id: 'achats.commandes',
            label: 'nav.achats.commandes',
            icon: 'clipboard-check',
            route: '/achats/commandes',
            order: 10,
          },
          {
            id: 'achats.contrats',
            label: 'nav.achats.contrats',
            icon: 'file-check',
            route: '/achats/contrats',
            order: 20,
          },
        ],
      },
      {
        id: 'achats.referentiel',
        label: 'nav.achats.referentiel',
        icon: 'building',
        order: 50,
        children: [
          {
            id: 'achats.fournisseurs',
            label: 'nav.achats.fournisseurs',
            icon: 'building',
            route: '/achats/fournisseurs',
            order: 10,
          },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // STOCK & LOGISTIQUE
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'stock',
    label: 'nav.stock',
    icon: 'warehouse',
    zone: 'operations',
    order: 30,
    children: [

      // Mouvements
      {
        id: 'stock.mouvements',
        label: 'nav.stock.mouvements',
        icon: 'arrow-left-right',
        order: 10,
        children: [
          {
            id: 'stock.mouvements.receptions',
            label: 'nav.stock.receptions',
            icon: 'download',
            route: '/inventory/mouvements/receptions',
            order: 10,
          },
          {
            id: 'stock.mouvements.sorties',
            label: 'nav.stock.sorties',
            icon: 'upload',
            route: '/inventory/mouvements/sorties',
            order: 15,
          },
          {
            id: 'stock.mouvements.transferts',
            label: 'nav.stock.transferts',
            icon: 'repeat',
            route: '/inventory/mouvements/transferts',
            order: 20,
          },
          {
            id: 'stock.mouvements.retours',
            label: 'nav.stock.retours',
            icon: 'undo-2',
            route: '/inventory/mouvements/retours',
            order: 40,
          },
          {
            id: 'stock.mouvements.inventaires',
            label: 'nav.stock.inventaires',
            icon: 'clipboard-list',
            route: '/inventory/mouvements/inventaires',
            order: 50,
          },
          {
            id: 'stock.mouvements.pertes',
            label: 'nav.stock.pertes',
            icon: 'triangle-alert',
            route: '/inventory/mouvements/pertes-chutes',
            order: 60,
          },
        ],
      },

      // Suivi & Valorisation
      {
        id: 'stock.suivi',
        label: 'nav.stock.suivi',
        icon: 'chart-bar',
        order: 20,
        children: [
          {
            id: 'stock.suivi.etat',
            label: 'nav.stock.etat',
            icon: 'package',
            route: '/inventory/suivi/etat-stock',
            order: 10,
          },
          {
            id: 'stock.suivi.valorisation',
            label: 'nav.stock.valorisation',
            icon: 'coins',
            route: '/inventory/suivi/valorisation',
            order: 20,
          },
          {
            id: 'stock.suivi.alertes',
            label: 'nav.stock.alertes',
            icon: 'bell',
            route: '/inventory/suivi/alertes',
            order: 30,
          },
        ],
      },

      // Catalogue Articles
      {
        id: 'stock.catalogue',
        label: 'nav.stock.catalogue',
        icon: 'layers',
        order: 30,
        children: [
          {
            id: 'stock.catalogue.articles',
            label: 'nav.stock.articles',
            icon: 'package',
            route: '/inventory/catalogue/articles',
            order: 10,
          },
          {
            id: 'stock.catalogue.familles',
            label: 'nav.stock.familles',
            icon: 'folder',
            route: '/inventory/configuration/familles',
            order: 20,
          },
          {
            id: 'stock.catalogue.types',
            label: 'nav.stock.types',
            icon: 'tag',
            route: '/inventory/configuration/types-articles',
            order: 30,
          },
          {
            id: 'stock.catalogue.uom',
            label: 'nav.stock.uom',
            icon: 'ruler',
            route: '/inventory/configuration/uom',
            order: 40,
          },
        ],
      },

      // Configuration
      {
        id: 'stock.configuration',
        label: 'common.subsections.configuration',
        icon: 'settings',
        order: 40,
        dividerBefore: true,
        children: [
          {
            id: 'stock.configuration.depots',
            label: 'nav.stock.depots',
            icon: 'map-pin',
            route: '/inventory/configuration/depots',
            order: 10,
          },
          {
            id: 'stock.configuration.motifs',
            label: 'nav.stock.motifs',
            icon: 'list-ordered',
            route: '/inventory/configuration/motifs',
            order: 20,
          },
          {
            id: 'stock.configuration.costing',
            label: 'nav.stock.costing',
            icon: 'calculator',
            route: '/inventory/configuration/costing-methods',
            order: 30,
          },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MATÉRIEL & ÉQUIPEMENTS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'materiel',
    label: 'nav.materiel',
    icon: 'truck',
    zone: 'operations',
    order: 40,
    children: [
      {
        id: 'materiel.exploitation',
        label: 'nav.materiel.exploitation',
        icon: 'truck',
        order: 10,
        children: [
          {
            id: 'materiel.parc',
            label: 'nav.materiel.parc',
            icon: 'truck',
            route: '/materiel/parc',
            order: 10,
          },
          {
            id: 'materiel.affectations',
            label: 'nav.materiel.affectations',
            icon: 'link',
            route: '/materiel/affectations',
            order: 20,
          },
          {
            id: 'materiel.locations',
            label: 'nav.materiel.locations',
            icon: 'key',
            route: '/materiel/locations',
            order: 30,
          },
          {
            id: 'materiel.planning',
            label: 'nav.materiel.planning',
            icon: 'calendar_range',
            route: '/materiel/planning',
            order: 35,
          },
          {
            id: 'materiel.pointage',
            label: 'nav.materiel.pointage',
            icon: 'schedule',
            route: '/materiel/pointage',
            order: 38,
          },
          {
            id: 'materiel.controles',
            label: 'nav.materiel.controles',
            icon: 'verified_user',
            route: '/materiel/controles',
            order: 39,
          },
        ],
      },
      {
        id: 'materiel.maintenanceSection',
        label: 'nav.materiel.maintenanceSection',
        icon: 'wrench',
        order: 40,
        children: [
          {
            id: 'materiel.maintenance',
            label: 'nav.materiel.maintenance',
            icon: 'wrench',
            route: '/materiel/maintenance/plans',
            order: 10,
          },
          {
            id: 'materiel.carburant',
            label: 'nav.materiel.carburant',
            icon: 'droplet',
            route: '/materiel/carburant/carnets',
            order: 20,
          },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ÉTUDES & DEVIS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'etudes',
    label: 'nav.etudes',
    icon: 'compass',
    zone: 'business',
    order: 50,
    children: [
      {
        id: 'etudes.chiffrage',
        label: 'nav.etudes.chiffrage',
        icon: 'calculator',
        order: 10,
        children: [
          {
            id: 'etudes.bibliotheque',
            label: 'nav.etudes.bibliotheque',
            icon: 'book-open',
            route: '/etudes/bibliotheque-prix',
            order: 10,
          },
          {
            id: 'etudes.metres',
            label: 'nav.etudes.metres',
            icon: 'ruler',
            route: '/etudes/metres',
            order: 20,
          },
          {
            id: 'etudes.devis',
            label: 'nav.etudes.devis',
            icon: 'file-text',
            route: '/etudes/devis',
            order: 30,
          },
        ],
      },
      {
        id: 'etudes.soumissions',
        label: 'nav.etudes.soumissions',
        icon: 'megaphone',
        order: 40,
        children: [
          {
            id: 'etudes.appelsOffresClients',
            label: 'nav.etudes.appelsOffresClients',
            icon: 'megaphone',
            route: '/etudes/appels-offres-clients',
            order: 10,
          },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MARCHÉS & FACTURATION — fusion « Marchés BTP » + cycle client / facturation (Task 07)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'marches',
    label: 'nav.marches',
    icon: 'file-signature',
    zone: 'business',
    order: 55,
    children: [
      {
        id: 'marches.sectionPublic',
        label: 'nav.marches.sectionPublic',
        icon: 'landmark',
        order: 10,
        children: [
          {
            id: 'marches.contrats',
            label: 'nav.marches.contrats',
            icon: 'gavel',
            route: '/marches/contrats',
            order: 10,
          },
          {
            id: 'marches.avenants',
            label: 'nav.marches.avenants',
            icon: 'file-plus',
            route: '/marches/avenants',
            order: 20,
          },
          {
            id: 'marches.factures',
            label: 'nav.marches.factures',
            icon: 'receipt',
            route: '/marches/factures',
            order: 30,
          },
          {
            id: 'marches.cautions',
            label: 'nav.marches.cautions',
            icon: 'shield-check',
            route: '/marches/cautions',
            order: 40,
          },
          {
            id: 'marches.revisions',
            label: 'nav.marches.revisions',
            icon: 'trending-up',
            route: '/marches/revisions-prix',
            order: 50,
          },
          {
            id: 'marches.penalites',
            label: 'nav.marches.penalites',
            icon: 'alert-triangle',
            route: '/marches/penalites',
            order: 60,
          },
          {
            id: 'marches.dgd',
            label: 'nav.marches.dgd',
            icon: 'clipboard-list',
            route: '/marches/dgd',
            order: 70,
          },
          {
            id: 'marches.os',
            label: 'nav.marches.os',
            icon: 'file-text',
            route: '/marches/os',
            order: 80,
          },
        ],
      },
      {
        id: 'ventes.cycleClient',
        label: 'nav.ventes.cycleClient',
        icon: 'briefcase-business',
        order: 30,
        children: [
          {
            id: 'ventes.offres',
            label: 'nav.ventes.offres',
            icon: 'file-text',
            route: '/ventes/offres',
            order: 10,
          },
          {
            id: 'ventes.commandes',
            label: 'nav.ventes.commandes',
            icon: 'clipboard-check',
            route: '/ventes/commandes',
            order: 20,
          },
          {
            id: 'ventes.situations',
            label: 'nav.ventes.situations',
            icon: 'file-check',
            route: '/ventes/situations',
            order: 30,
          },
        ],
      },
      {
        id: 'ventes.facturation',
        label: 'nav.ventes.facturation',
        icon: 'receipt',
        order: 40,
        children: [
          {
            id: 'ventes.factures',
            label: 'nav.ventes.factures',
            icon: 'receipt',
            route: '/ventes/factures',
            order: 10,
          },
          {
            id: 'ventes.avoirs',
            label: 'nav.ventes.avoirs',
            icon: 'file-minus',
            route: '/ventes/avoirs',
            order: 20,
          },
          {
            id: 'ventes.retenues',
            label: 'nav.ventes.retenues',
            icon: 'shield',
            route: '/ventes/retenues-garantie',
            order: 30,
          },
        ],
      },
      {
        id: 'ventes.referentiel',
        label: 'nav.ventes.referentiel',
        icon: 'users',
        order: 70,
        children: [
          {
            id: 'ventes.clients',
            label: 'nav.ventes.clients',
            icon: 'users',
            route: '/ventes/clients',
            order: 10,
          },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FINANCE & COMPTABILITÉ
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'finance',
    label: 'nav.finance',
    icon: 'landmark',
    zone: 'business',
    order: 70,
    children: [

      // Comptabilité
      {
        id: 'finance.comptabilite',
        label: 'nav.finance.comptabilite',
        icon: 'book-open',
        order: 10,
        children: [
          {
            id: 'finance.comptabilite.journaux',
            label: 'nav.finance.journaux',
            icon: 'book',
            route: '/finance/journaux',
            order: 10,
          },
          {
            id: 'finance.comptabilite.balance',
            label: 'nav.finance.balance',
            icon: 'scale',
            route: '/finance/balance',
            order: 20,
          },
          {
            id: 'finance.comptabilite.analytique',
            label: 'nav.finance.analytique',
            icon: 'pie-chart',
            route: '/finance/analytique',
            order: 30,
          },
          {
            id: 'finance.comptabilite.facturesFournisseurs',
            label: 'nav.finance.facturesFournisseurs',
            icon: 'file-down',
            route: '/finance/factures-fournisseurs',
            order: 40,
          },
          {
            id: 'finance.comptabilite.lettrage',
            label: 'nav.finance.lettrage',
            icon: 'link',
            route: '/finance/lettrage',
            order: 45,
          },
        ],
      },

      // Trésorerie
      {
        id: 'finance.tresorerie',
        label: 'nav.finance.tresorerie',
        icon: 'piggy-bank',
        order: 20,
        children: [
          {
            id: 'finance.tresorerie.caisses',
            label: 'nav.finance.caisses',
            icon: 'wallet',
            route: '/finance/caisses',
            order: 10,
          },
          {
            id: 'finance.tresorerie.virements',
            label: 'nav.finance.virements',
            icon: 'arrow-right-left',
            route: '/finance/virements',
            order: 20,
          },
          {
            id: 'finance.tresorerie.reglements',
            label: 'nav.finance.reglements',
            icon: 'circle-check',
            route: '/finance/reglements',
            order: 30,
          },
          {
            id: 'finance.tresorerie.recouvrement',
            label: 'nav.finance.recouvrement',
            icon: 'mail',
            route: '/finance/recouvrement',
            order: 35,
          },
          {
            id: 'finance.tresorerie.rapprochement',
            label: 'nav.finance.rapprochement',
            icon: 'circle-check',
            route: '/finance/rapprochement',
            order: 40,
          },
          {
            id: 'finance.tresorerie.effets',
            label: 'nav.finance.effets',
            icon: 'file-text',
            route: '/finance/effets',
            order: 45,
          },
          {
            id: 'finance.tresorerie.virementRemise',
            label: 'nav.finance.virementRemise',
            icon: 'file-down',
            route: '/finance/virements/remise',
            order: 46,
          },
          {
            id: 'finance.tresorerie.caissesChantier',
            label: 'nav.finance.caissesChantier',
            icon: 'wallet',
            route: '/finance/caisses-chantier',
            order: 47,
          },
        ],
      },

      // Déclarations fiscales
      {
        id: 'finance.declarations',
        label: 'nav.finance.declarations',
        icon: 'file-text',
        order: 25,
        dividerBefore: true,
        children: [
          {
            id: 'finance.declarations.retenueSource',
            label: 'nav.finance.retenueSource',
            icon: 'percent',
            route: '/finance/declarations/retenue-source',
            order: 15,
          },
          {
            id: 'finance.declarations.simplIs',
            label: 'nav.finance.simplIs',
            icon: 'file-search',
            route: '/finance/declarations/simpl-is',
            order: 10,
          },
          {
            id: 'finance.declarations.etat9421',
            label: 'nav.finance.etat9421',
            icon: 'file-spreadsheet',
            route: '/finance/declarations/etat-9421',
            order: 20,
          },
          {
            id: 'finance.declarations.etat1208',
            label: 'nav.finance.etat1208',
            icon: 'file-text',
            route: '/finance/declarations/etat-1208',
            order: 30,
          },
        ],
      },

      // Configuration finance
      {
        id: 'finance.configuration',
        label: 'common.subsections.configuration',
        icon: 'settings',
        order: 30,
        dividerBefore: true,
        children: [
          {
            id: 'finance.configuration.devises',
            label: 'nav.finance.devises',
            icon: 'coins',
            route: '/finance/devises',
            order: 10,
          },
          {
            id: 'finance.configuration.tauxChange',
            label: 'nav.finance.tauxChange',
            icon: 'trending-up',
            route: '/finance/taux-change',
            order: 20,
          },
          {
            id: 'finance.configuration.conditionsPaiement',
            label: 'nav.finance.conditionsPaiement',
            icon: 'calendar-clock',
            route: '/finance/conditions-paiement',
            order: 30,
          },
          {
            id: 'finance.configuration.plansComptables',
            label: 'nav.finance.plansComptables',
            icon: 'layers',
            route: '/finance/plans-comptables',
            order: 40,
          },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // RESSOURCES HUMAINES
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'rh',
    label: 'nav.rh',
    icon: 'users-round',
    zone: 'people',
    order: 80,
    children: [
      {
        id: 'rh.employes',
        label: 'nav.rh.employes',
        icon: 'user-check',
        route: '/rh/employes',
        order: 10,
      },
      {
        id: 'rh.pointage',
        label: 'nav.rh.pointage',
        icon: 'clock',
        route: '/rh/pointage',
        order: 20,
      },
      {
        id: 'rh.planning',
        label: 'nav.rh.planning',
        icon: 'calendar',
        route: '/rh/planning-equipes',
        order: 30,
      },
      {
        id: 'rh.conges',
        label: 'nav.rh.conges',
        icon: 'calendar-x',
        route: '/rh/conges',
        order: 40,
      },
      {
        id: 'rh.paie',
        label: 'nav.rh.paie',
        icon: 'banknote',
        route: '/rh/paie',
        order: 50,
      },
      {
        id: 'rh.paieJournal',
        label: 'nav.rh.paieJournal',
        icon: 'table',
        route: '/rh/paie/journal',
        order: 52,
      },
      {
        id: 'rh.declarations',
        label: 'nav.rh.declarations',
        icon: 'file-text',
        order: 60,
        children: [
          {
            id: 'rh.declarations.damancom',
            label: 'nav.rh.damancom',
            icon: 'file-check',
            route: '/rh/paie/declarations/damancom',
            order: 10,
          },
          {
            id: 'rh.declarations.igr',
            label: 'nav.rh.igr',
            icon: 'file-spreadsheet',
            route: '/rh/paie/declarations/igr',
            order: 20,
          },
          {
            id: 'rh.declarations.etat1208',
            label: 'nav.finance.etat1208',
            icon: 'file-text',
            route: '/rh/paie/declarations/etat-1208',
            order: 30,
          },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // QUALITÉ & HSE
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'hse',
    label: 'nav.hse',
    icon: 'shield',
    zone: 'people',
    order: 90,
    children: [
      {
        id: 'hse.dashboard',
        label: 'nav.hse.dashboard',
        icon: 'gauge',
        route: '/hse/tableau-bord',
        order: 5,
      },
      {
        id: 'hse.incidents',
        label: 'nav.hse.incidents',
        icon: 'alert-circle',
        route: '/hse/incidents',
        order: 10,
      },
      {
        id: 'hse.nonConformites',
        label: 'nav.hse.nonConformites',
        icon: 'x-circle',
        route: '/hse/non-conformites',
        order: 20,
      },
      {
        id: 'hse.inspections',
        label: 'nav.hse.inspections',
        icon: 'clipboard-check',
        route: '/hse/inspections',
        order: 30,
      },
      {
        id: 'hse.formations',
        label: 'nav.hse.formations',
        icon: 'graduation-cap',
        route: '/hse/formations',
        order: 40,
      },
      {
        id: 'hse.epi',
        label: 'nav.hse.epi',
        icon: 'shield-check',
        route: '/hse/epi',
        order: 50,
      },
      {
        id: 'hse.duer',
        label: 'nav.hse.duer',
        icon: 'file-warning',
        route: '/hse/duer',
        order: 60,
      },
      {
        id: 'hse.phs',
        label: 'nav.hse.phs',
        icon: 'file-stack',
        route: '/hse/phs',
        order: 65,
      },
      {
        id: 'hse.ppsps',
        label: 'nav.hse.ppsps',
        icon: 'hard-hat',
        route: '/hse/ppsps',
        order: 70,
      },
      {
        id: 'hse.visitesMedicales',
        label: 'nav.hse.visitesMedicales',
        icon: 'stethoscope',
        route: '/hse/visites-medicales',
        order: 80,
      },
      {
        id: 'hse.registresLegaux',
        label: 'nav.hse.registresLegaux',
        icon: 'archive',
        route: '/hse/registres-legaux',
        order: 90,
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ═══════════════════════════════════════════════════════════════════════════
  // PILOTAGE — TABLEAUX DE BORD DÉCISIONNELS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'pilotage',
    label: 'nav.pilotage',
    icon: 'gauge',
    zone: 'pilotage',
    order: 90,
    children: [
      {
        id: 'pilotage.marges',
        label: 'nav.pilotage.marges',
        icon: 'trending-up',
        route: '/pilotage/marges-chantier',
        order: 10,
      },
      {
        id: 'pilotage.margeConsolidee',
        label: 'nav.pilotage.margeConsolidee',
        icon: 'layout-grid',
        route: '/pilotage/marge-consolidee',
        order: 15,
      },
      {
        id: 'pilotage.cashflow',
        label: 'nav.pilotage.cashflow',
        icon: 'waves',
        route: '/pilotage/cash-flow',
        order: 20,
      },
      {
        id: 'pilotage.analysesRentabilite',
        label: 'nav.pilotage.analysesRentabilite',
        icon: 'chart-line',
        route: '/pilotage-analyses/rentabilite',
        order: 30,
      },
      {
        id: 'pilotage.analysesFinancier',
        label: 'nav.pilotage.analysesFinancier',
        icon: 'landmark',
        route: '/pilotage-analyses/financier',
        order: 31,
      },
      {
        id: 'pilotage.analysesStock',
        label: 'nav.pilotage.analysesStock',
        icon: 'package',
        route: '/pilotage-analyses/stock',
        order: 32,
      },
      {
        id: 'pilotage.analysesAchats',
        label: 'nav.pilotage.analysesAchats',
        icon: 'shopping-cart',
        route: '/pilotage-analyses/achats',
        order: 33,
      },
      {
        id: 'pilotage.analysesRh',
        label: 'nav.pilotage.analysesRh',
        icon: 'users',
        route: '/pilotage-analyses/rh',
        order: 34,
      },
      {
        id: 'pilotage.analysesWhatIf',
        label: 'nav.pilotage.analysesWhatIf',
        icon: 'sliders',
        route: '/pilotage-analyses/what-if',
        order: 35,
      },
      {
        id: 'pilotage.analysesOpexCapex',
        label: 'nav.pilotage.analysesOpexCapex',
        icon: 'scale-balanced',
        route: '/pilotage-analyses/opex-capex',
        order: 36,
      },
      {
        id: 'pilotage.analysesGroupe',
        label: 'nav.pilotage.analysesGroupe',
        icon: 'building',
        route: '/pilotage-analyses/groupe',
        order: 37,
      },
    ],
  },

  // RAPPORTS & ANALYSES
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'analytics',
    label: 'nav.analytics',
    icon: 'chart-bar',
    zone: 'pilotage',
    order: 100,
    children: [
      {
        id: 'analytics.chantiers',
        label: 'nav.analytics.chantiers',
        icon: 'chart-bar',
        route: '/analytics/chantiers',
        order: 10,
      },
      {
        id: 'analytics.financier',
        label: 'nav.analytics.financier',
        icon: 'trending-up',
        route: '/analytics/financier',
        order: 20,
      },
      {
        id: 'analytics.stock',
        label: 'nav.analytics.stock',
        icon: 'package',
        route: '/analytics/stock',
        order: 30,
      },
      {
        id: 'analytics.achats',
        label: 'nav.analytics.achats',
        icon: 'shopping-cart',
        route: '/analytics/achats',
        order: 40,
      },
      {
        id: 'analytics.rh',
        label: 'nav.analytics.rh',
        icon: 'users',
        route: '/analytics/rh',
        order: 50,
      },
    ],
  },
];

export const ERP_ZONE_CONFIG_GENERATED: GeneratedZoneConfig[] = [
  { id: 'work',      label: 'zones.work',      order: 0 },
  { id: 'operations', label: 'zones.operations', order: 1 },
  { id: 'business',  label: 'zones.business',  order: 2 },
  { id: 'people',    label: 'zones.people',    order: 3 },
  { id: 'pilotage',  label: 'zones.pilotage',  order: 4 },
];

export const APP_NAVIGATION: SidebarNode[] = ERP_NAV_CONFIG_GENERATED;
