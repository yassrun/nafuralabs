import type { Tour } from '@platform/core/onboarding/onboarding.service';

/** Sektor BTP onboarding tours (product-specific, not platform). */
export const SEKTOR_ONBOARDING_TOURS: Tour[] = [
  {
    id: 'shell',
    name: 'Bienvenue dans Nafura ERP',
    steps: [
      {
        id: 'shell-1',
        title: '🏗 Bienvenue dans Nafura ERP',
        body: 'Votre ERP BTP Maroc — chantiers, marchés, facturation, paie et HSE dans une seule application.',
        position: 'center',
      },
      {
        id: 'shell-2',
        title: '📋 Navigation latérale',
        body: "La barre gauche organise tous vos modules métier par zone (Opérations, Business, Équipe). Cliquez sur une section pour l'ouvrir.",
        selector: '.naf-shell__sidebar',
        position: 'right',
      },
      {
        id: 'shell-3',
        title: '⌨️ Raccourcis clavier',
        body: "Appuyez sur Ctrl+K pour ouvrir la palette de commandes. Tapez le nom d'un module ou d'un chantier pour y accéder instantanément.",
        position: 'center',
      },
      {
        id: 'shell-4',
        title: '🔔 Alertes en temps réel',
        body: 'La cloche en haut à droite affiche les alertes ERP : approbations en attente, factures en retard, cautions expirant bientôt.',
        position: 'center',
      },
      {
        id: 'shell-5',
        title: '✅ Tour terminé !',
        body: "Vous êtes prêt. Retrouvez ce tour via le bouton ? ou Ctrl+/ dans n'importe quel écran.",
        position: 'center',
      },
    ],
  },
  {
    id: 'chantiers',
    name: 'Tour Chantiers',
    steps: [
      { id: 'ch-1', title: '🏗 Module Chantiers', body: 'Vos projets de construction : fiche détail avec onglets Lots / Phases / Budget / Situations / Documents.', route: '/chantiers', position: 'center' },
      { id: 'ch-2', title: '📅 Planning Gantt', body: 'Visualisez toutes vos phases sur un Gantt interactif.', route: '/chantiers/planning', position: 'center' },
      { id: 'ch-3', title: '📎 Attachements & Journal', body: 'Saisissez les quantités exécutées par poste et les événements chantier.', position: 'center' },
    ],
  },
  {
    id: 'marches',
    name: 'Tour Marchés BTP',
    steps: [
      { id: 'mar-1', title: '📋 Marchés BTP', body: 'Gérez vos contrats MOA : type (Forfait / BPU / Régie), cautions bancaires, révision K.', route: '/marches/contrats', position: 'center' },
      { id: 'mar-2', title: '🧾 Facturation situation', body: 'Facturez chaque situation validée avec calcul automatique RG, TVA, RAS.', route: '/marches/factures', position: 'center' },
    ],
  },
  {
    id: 'pilotage',
    name: 'Tour Pilotage & trésorerie',
    steps: [
      { id: 'pil-1', title: '📊 Marges chantier', body: 'Suivez marge HT, risques et exportez les données pour le comité de pilotage.', route: '/pilotage/marges-chantier', position: 'center' },
      { id: 'pil-2', title: '💶 Cash-flow', body: 'Visualisez les encaissements prévisionnels et les alertes de trésorerie.', route: '/pilotage/cash-flow', position: 'center' },
    ],
  },
];

export const SEKTOR_ONBOARDING_ROUTE_MAP: ReadonlyArray<{ prefix: string; tourId: string }> = [
  { prefix: '/chantiers', tourId: 'chantiers' },
  { prefix: '/marches', tourId: 'marches' },
  { prefix: '/pilotage', tourId: 'pilotage' },
  { prefix: '/dashboard', tourId: 'shell' },
];
