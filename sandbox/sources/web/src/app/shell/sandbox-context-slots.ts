import type { AppShellContextSlot } from '@platform/platform/app-shell';

/** Catalogue lab. `enabled` reflète le réglage Nafura par défaut (chantiers off). */
export const SANDBOX_CONTEXT_SLOTS: readonly AppShellContextSlot[] = [
  {
    id: 'bc.achats',
    label: 'Achats',
    route: '/achats',
    icon: 'shopping-cart',
    enabled: true,
    navigation: [
      {
        id: 'bc-achats',
        label: 'Achats',
        items: [{ id: 'achats-home', label: 'Accueil', route: '/achats', icon: 'shopping-cart' }],
      },
    ],
  },
  {
    id: 'bc.chantiers',
    label: 'Chantiers',
    route: '/chantiers',
    icon: 'hard-hat',
    enabled: false,
    navigation: [
      {
        id: 'bc-chantiers',
        label: 'Chantiers',
        items: [{ id: 'chantiers-home', label: 'Accueil', route: '/chantiers', icon: 'hard-hat' }],
      },
    ],
  },
];
