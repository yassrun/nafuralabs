import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {
  AppShellComponent,
  type AppShellNavigationItem,
  type AppShellNavigationSection,
} from '@platform/platform/app-shell';

import { SANDBOX_NAV, type SandboxNavItem } from './nav/sandbox-nav.config';

@Component({
  selector: 'sb-root',
  standalone: true,
  imports: [AppShellComponent, RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nf-app-shell>
      <button app-shell-topbar type="button" class="sb-shell__context">Sandbox</button>
      <span app-shell-organization class="sb-shell__organization">Platform lab</span>

      <button app-shell-sidebar-footer type="button" class="sb-shell__user">
        <span class="sb-shell__avatar">NF</span>
        <span>Platform team</span>
      </button>

      <router-outlet />
    </nf-app-shell>
  `,
  styles: [`
    :host { display: block; min-height: 100%; }
    .sb-shell__context { min-height: 32px; border: 1px solid var(--nf-border-default, #e2e8f0); border-radius: 6px; background: var(--nf-color-surface, #fff); color: inherit; padding: 0 10px; font: inherit; font-size: 0.8125rem; cursor: pointer; }
    .sb-shell__organization { color: var(--nf-text-muted, #64748b); font-size: 0.75rem; white-space: nowrap; }
    .sb-shell__user { display: flex; align-items: center; width: 100%; min-height: 40px; gap: 8px; border: 0; border-radius: 6px; background: transparent; color: inherit; padding: 4px 8px; font: inherit; font-size: 0.8125rem; text-align: left; cursor: pointer; }
    .sb-shell__user:hover { background: var(--nf-surface-hover, #f1f5f9); }
    .sb-shell__avatar { display: inline-grid; place-items: center; width: 28px; height: 28px; border-radius: 50%; background: #0f766e; color: #fff; font-size: 0.6875rem; font-weight: 700; }
  `],
})
export class SandboxShellComponent {
}

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
    badge: item.status,
  };
}