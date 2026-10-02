import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {
  AppShellComponent,
  type AppShellNavigationItem,
  type AppShellNavigationSection,
} from '@platform/platform/app-shell';

import { SHOWROOM_NAVIGATION } from './bc/showroom/showroom-navigation';
import { SANDBOX_NAV, type SandboxNavItem } from './nav/sandbox-nav.config';

@Component({
  selector: 'sb-shell',
  standalone: true,
  imports: [AppShellComponent, RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nf-app-shell>
      <span app-shell-organization class="sb-shell__organization">Platform lab</span>
      <router-outlet />
    </nf-app-shell>
  `,
  styles: [`
    :host { display: block; min-height: 100%; }
    .sb-shell__organization { color: var(--nf-text-muted, #64748b); font-size: 0.75rem; white-space: nowrap; }
  `],
})
export class SandboxShellComponent {}

/** Showroom and the lab business contexts as sidebar groups, then the platform screens. */
export function buildSandboxNavigation(): readonly AppShellNavigationSection[] {
  const showroom: AppShellNavigationItem = {
    id: 'nf.showroom',
    label: 'Showroom NF',
    icon: 'flask-conical',
    children: SHOWROOM_NAVIGATION.map((section) => ({ id: section.id, label: section.label ?? section.id, children: section.items })),
  };
  const businessContext = (id: string, label: string, route: string, icon: string): AppShellNavigationItem => ({
    id,
    label,
    icon,
    children: [{ id: `${id}.home`, label: 'Accueil', route, icon }],
  });
  return [
    { id: 'showroom', items: [showroom] },
    {
      id: 'business-contexts',
      items: [
        businessContext('bc.achats', 'Achats', '/achats', 'shopping-cart'),
        businessContext('bc.chantiers', 'Chantiers', '/chantiers', 'hard-hat'),
      ],
    },
    ...SANDBOX_NAV.map((section): AppShellNavigationSection => ({
      id: section.id,
      label: section.label,
      items: section.items
        .map(toAppShellNavigationItem)
        .filter((item): item is AppShellNavigationItem => item !== null),
    })),
  ];
}

function toAppShellNavigationItem(item: SandboxNavItem): AppShellNavigationItem | null {
  if (typeof item.route !== 'string') return null;
  return {
    id: item.id,
    label: item.label,
    route: item.route,
    icon: item.icon,
  };
}