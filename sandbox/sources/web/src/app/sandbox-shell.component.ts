import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {
  AppShellComponent,
  type AppShellNavigationItem,
  type AppShellNavigationSection,
} from '@platform/platform/app-shell';

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

export function buildSandboxNavigation(): readonly AppShellNavigationSection[] {
  return SANDBOX_NAV.map((section): AppShellNavigationSection => ({
      id: section.id,
      label: section.label,
      items: section.items
        .map(toAppShellNavigationItem)
        .filter((item): item is AppShellNavigationItem => item !== null),
    }));
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