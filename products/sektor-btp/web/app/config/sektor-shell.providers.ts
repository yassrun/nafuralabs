/**
 * Sektor product shell providers — ERP content kept out of platform.
 */
import type { Provider } from '@angular/core';

import type { SearchResult } from '@platform/core/shell/command-palette/command-palette.types';
import {
  PRODUCT_AI_DOMAIN_BY_SEGMENT,
  PRODUCT_DISPLAY_NAME,
  PRODUCT_NOT_FOUND_CONFIG,
  PRODUCT_ONBOARDING_TOURS,
  PRODUCT_PALETTE_ACTIONS,
  PRODUCT_ROUTE_TOUR_MAP,
  PRODUCT_SHORTCUTS,
  PRODUCT_WHATSAPP_TEMPLATES,
  type ProductTour,
  type WhatsAppTemplateDef,
} from '@platform/core/application/product-shell.tokens';
import { ENTITY_TYPE_ROUTE_PREFIX } from '@platform/features/approvals/config/entity-type-routes.config';
import { STATUS_MAPPING_CATALOG } from '@platform/lib/anatomy/components/atoms/status-badge/status-mapping';
import { SEKTOR_STATUS_MAPPING } from '@app/shared/status/sektor-status-mapping';

const SEKTOR_TOURS: ProductTour[] = [
  {
    id: 'shell',
    name: 'Bienvenue dans Nafura ERP',
    steps: [
      {
        id: 'shell-1',
        title: 'Bienvenue dans Nafura ERP',
        body: 'Votre ERP BTP Maroc — chantiers, marchés, facturation, paie et HSE dans une seule application.',
        position: 'center',
      },
      {
        id: 'shell-2',
        title: 'Navigation latérale',
        body: "La barre gauche organise tous vos modules métier par zone (Opérations, Business, Équipe). Cliquez sur une section pour l'ouvrir.",
        selector: '.naf-shell__sidebar',
        position: 'right',
      },
      {
        id: 'shell-3',
        title: 'Raccourcis clavier',
        body: "Appuyez sur Ctrl+K pour ouvrir la palette de commandes. Utilisez « g c » pour aller aux Chantiers, « g a » aux Achats, etc.",
        position: 'center',
      },
      {
        id: 'shell-4',
        title: 'Alertes en temps réel',
        body: 'La cloche en haut à droite affiche les alertes ERP : approbations, factures en retard, cautions, NC critiques.',
        position: 'center',
      },
      {
        id: 'shell-5',
        title: 'Tour terminé !',
        body: "Vous êtes prêt. Retrouvez ce tour via le bouton ? ou Ctrl+/ . Bonne utilisation !",
        position: 'center',
      },
    ],
  },
  {
    id: 'chantiers',
    name: 'Tour Chantiers',
    steps: [
      {
        id: 'ch-1',
        title: 'Module Chantiers',
        body: 'Vos projets de construction : fiche détail avec onglets Lots / Phases / Budget / Situations / Documents.',
        route: '/chantiers',
        position: 'center',
      },
      {
        id: 'ch-2',
        title: 'Planning Gantt',
        body: 'Visualisez toutes vos phases sur un Gantt interactif.',
        route: '/chantiers/planning',
        position: 'center',
      },
      {
        id: 'ch-3',
        title: 'Attachements & Journal',
        body: "Saisissez les quantités exécutées (carnet d'attachement) et les événements chantier.",
        position: 'center',
      },
    ],
  },
  {
    id: 'marches',
    name: 'Tour Marchés BTP',
    steps: [
      {
        id: 'mar-1',
        title: 'Marchés BTP',
        body: 'Gérez vos contrats MOA : type (Forfait / BPU / Régie), cautions bancaires, révision K, pénalités.',
        route: '/marches/contrats',
        position: 'center',
      },
      {
        id: 'mar-2',
        title: 'Facturation situation',
        body: 'Facturez chaque situation validée. Décompte : RG 7%, TVA 20%, RAS 5% si MOA public.',
        route: '/marches/factures',
        position: 'center',
      },
    ],
  },
  {
    id: 'pilotage',
    name: 'Tour Pilotage & trésorerie',
    steps: [
      {
        id: 'pil-1',
        title: 'Marges chantier',
        body: 'Suivez marge HT, risques et exportez pour le comité de pilotage.',
        route: '/pilotage/marges-chantier',
        position: 'center',
      },
      {
        id: 'pil-2',
        title: 'Cash-flow',
        body: 'Visualisez les encaissements prévisionnels et les alertes de trésorerie.',
        route: '/pilotage/cash-flow',
        position: 'center',
      },
    ],
  },
];

const SEKTOR_PALETTE_ACTIONS: SearchResult[] = [
  {
    id: 'action:chantier-new',
    label: 'core.search.actions.newChantier',
    icon: 'file',
    route: '/chantiers/new',
    category: 'actions',
    breadcrumb: '',
  },
  {
    id: 'action:bc-new',
    label: 'core.search.actions.newBc',
    icon: 'file',
    route: '/achats/commandes/new',
    category: 'actions',
    breadcrumb: '',
  },
  {
    id: 'action:da-new',
    label: 'core.search.actions.newDa',
    icon: 'file',
    route: '/achats/demandes/new',
    category: 'actions',
    breadcrumb: '',
  },
  {
    id: 'action:employe-new',
    label: 'core.search.actions.newEmploye',
    icon: 'file',
    route: '/rh/employes/new',
    category: 'actions',
    breadcrumb: '',
  },
  {
    id: 'action:facture-vente-new',
    label: 'core.search.actions.newFactureVente',
    icon: 'file',
    route: '/ventes/factures/new',
    category: 'actions',
    breadcrumb: '',
  },
];

const SEKTOR_WHATSAPP_TEMPLATES: Record<string, WhatsAppTemplateDef> = {
  APPROBATION_DEMANDE: {
    category: 'UTILITY',
    bodyFr:
      'Bonjour {{nom}}, une demande d approbation {{type}} {{reference}} pour {{montant}} MAD attend votre validation.',
    requiredVars: ['nom', 'type', 'reference', 'montant'],
  },
  APPROBATION_RAPPEL: {
    category: 'UTILITY',
    bodyFr:
      'Rappel : la demande {{reference}} est en attente de votre validation depuis {{joursOuverture}} jour(s).',
    requiredVars: ['reference', 'joursOuverture'],
  },
  INCIDENT_HSE_AT: {
    category: 'UTILITY',
    bodyFr:
      'Alerte HSE : accident du travail {{reference}} déclaré sur le chantier {{chantier}}. Déclaration CNSS DAT à effectuer avant {{deadline}}.',
    requiredVars: ['reference', 'chantier', 'deadline'],
  },
  RELANCE_FACTURE_J15: {
    category: 'UTILITY',
    bodyFr:
      'Bonjour {{client}}, votre facture {{reference}} de {{montant}} MAD est arrivée à échéance le {{echeance}}. Merci de procéder au règlement.',
    requiredVars: ['client', 'reference', 'montant', 'echeance'],
  },
  RELANCE_FACTURE_J30: {
    category: 'UTILITY',
    bodyFr:
      'Bonjour {{client}}, votre facture {{reference}} ({{montant}} MAD) reste impayée depuis 30 jours. Merci de régulariser sous huitaine.',
    requiredVars: ['client', 'reference', 'montant'],
  },
  RELANCE_FACTURE_J45: {
    category: 'UTILITY',
    bodyFr:
      'Bonjour {{client}}, votre facture {{reference}} ({{montant}} MAD) est en retard de 45 jours. Une mise en demeure va vous être adressée.',
    requiredVars: ['client', 'reference', 'montant'],
  },
  LIVRAISON_BC: {
    category: 'UTILITY',
    bodyFr:
      'Bonjour, la commande {{reference}} sera livrée le {{dateLivraison}} sur le chantier {{chantier}}.',
    requiredVars: ['reference', 'dateLivraison', 'chantier'],
  },
  POINTAGE_RAPPEL: {
    category: 'UTILITY',
    bodyFr: 'Rappel pointage : merci de saisir votre pointage du {{date}} avant {{deadline}}.',
    requiredVars: ['date', 'deadline'],
  },
};

export const SEKTOR_PRODUCT_SHELL_PROVIDERS: Provider[] = [
  { provide: PRODUCT_DISPLAY_NAME, useValue: 'Sektor' },
  { provide: PRODUCT_ONBOARDING_TOURS, useValue: SEKTOR_TOURS },
  {
    provide: PRODUCT_ROUTE_TOUR_MAP,
    useValue: [
      { prefix: '/chantiers', tourId: 'chantiers' },
      { prefix: '/marches', tourId: 'marches' },
      { prefix: '/pilotage', tourId: 'pilotage' },
      { prefix: '/dashboard', tourId: 'shell' },
    ],
  },
  {
    provide: PRODUCT_SHORTCUTS,
    useValue: {
      shortcuts: [
        {
          keys: 'Ctrl+K / ⌘K / Ctrl+⇧P / Alt+K',
          description: 'Command palette',
          category: 'Interface' as const,
        },
        { keys: '?', description: 'Toggle assistant IA', category: 'Interface' as const },
        { keys: 'Ctrl+/', description: 'Aide raccourcis clavier', category: 'Interface' as const },
        { keys: 'g c', description: 'Aller aux Chantiers', category: 'Navigation' as const },
        { keys: 'g a', description: 'Aller aux Achats', category: 'Navigation' as const },
        { keys: 'g f', description: 'Aller à la Finance', category: 'Navigation' as const },
        { keys: 'g p', description: 'Aller au Pilotage', category: 'Navigation' as const },
        { keys: 'g r', description: 'Aller aux RH', category: 'Navigation' as const },
        { keys: 'g h', description: 'Aller au HSE', category: 'Navigation' as const },
        { keys: 'g m', description: 'Aller aux Marchés', category: 'Navigation' as const },
        { keys: 'Esc', description: 'Fermer modal / drawer', category: 'Actions' as const },
        { keys: 'Ctrl+S', description: 'Sauvegarder formulaire', category: 'Actions' as const },
      ],
      gotoMap: {
        c: '/chantiers',
        a: '/achats',
        f: '/finance',
        p: '/pilotage',
        r: '/rh',
        h: '/hse/tableau-bord',
        m: '/marches',
      },
    },
  },
  { provide: PRODUCT_PALETTE_ACTIONS, useValue: SEKTOR_PALETTE_ACTIONS },
  {
    provide: PRODUCT_NOT_FOUND_CONFIG,
    useValue: {
      suggestions: [
        { route: '/chantiers', label: 'Chantiers' },
        { route: '/marches', label: 'Marchés & Facturation' },
        { route: '/achats', label: 'Achats' },
        { route: '/finance', label: 'Finance' },
        { route: '/stock', label: 'Stock & Matériel' },
        { route: '/rh', label: 'RH & Paie' },
      ],
      footer: 'Nafura ERP · BTP Maroc',
    },
  },
  {
    provide: PRODUCT_AI_DOMAIN_BY_SEGMENT,
    useValue: {
      chantiers: 'chantiers',
      achats: 'achats',
      ventes: 'ventes',
      finance: 'finance',
      stock: 'stock',
      inventory: 'stock',
      hse: 'hse',
      rh: 'rh',
      etudes: 'etudes',
      marches: 'marches',
    },
  },
  { provide: PRODUCT_WHATSAPP_TEMPLATES, useValue: SEKTOR_WHATSAPP_TEMPLATES },
  {
    provide: ENTITY_TYPE_ROUTE_PREFIX,
    useValue: {
      item: '/stock/catalogue/items',
      'item-type': '/stock/configuration/item-types',
      'item-category': '/stock/configuration/item-categories',
      location: '/stock/configuration/depots',
      'inventory-tx': '/stock/mouvements/inventory-txes',
      'stock-balance': '/stock/suivi/stock-balances',
      currency: '/finance/configuration/currencies',
      'exchange-rate': '/finance/configuration/exchange-rates',
      'payment-term': '/finance/configuration/payment-terms',
    },
  },
  { provide: STATUS_MAPPING_CATALOG, useValue: SEKTOR_STATUS_MAPPING },
];
