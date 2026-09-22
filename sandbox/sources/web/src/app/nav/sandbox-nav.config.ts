/**
 * Sandbox sidebar — admin / settings lab only.
 * Archetypes + components catalog temporarily hidden (showroom).
 */

export type SandboxNavKind = 'group' | 'link' | 'stub';

export interface SandboxNavItem {
  id: string;
  label: string;
  kind?: SandboxNavKind;
  route?: string;
  icon?: string;
  children?: SandboxNavItem[];
  status?: 'live' | 'stub' | 'partial';
  description?: string;
}

export interface SandboxNavSection {
  id: string;
  label: string;
  menu: 'admin';
  items: SandboxNavItem[];
}

export const SANDBOX_NAV: SandboxNavSection[] = [
  {
    id: 'admin',
    label: 'Administration',
    menu: 'admin',
    items: [
      {
        id: 'user-settings',
        label: 'Mes paramètres',
        route: '/user-settings',
        icon: 'user',
        status: 'live',
        description: 'Profil, préférences, sécu, notifs',
      },
      {
        id: 'org-settings',
        label: 'Paramètres organisation',
        route: '/organization/settings',
        icon: 'sliders-horizontal',
        status: 'live',
        description: 'Général · locale · branding',
      },
      {
        id: 'org-identity',
        label: 'Identité organisation',
        route: '/organization/identity',
        icon: 'building-2',
        status: 'live',
        description: 'Légal · ICE · RIB · Import magique',
      },
      {
        id: 'nafura-contexts',
        label: 'Contextes métier',
        route: '/nafura/business-contexts',
        icon: 'layout-grid',
        status: 'live',
        description: 'Activation Nafura des BC pour cette app',
      },
      {
        id: 'impression',
        label: 'Impression',
        route: '/administration/documents/templates',
        icon: 'file-text',
        status: 'live',
        description: 'Modèles PDF',
      },
      {
        id: 'numbering',
        label: 'Numérotation',
        route: '/administration/numbering-sequences',
        icon: 'hash',
        status: 'live',
        description: 'Séquences documentaires',
      },
    ],
  },
];

export function flattenNavLinks(sections: SandboxNavSection[] = SANDBOX_NAV): SandboxNavItem[] {
  return sections.flatMap((s) => s.items.filter((i) => !!i.route));
}
