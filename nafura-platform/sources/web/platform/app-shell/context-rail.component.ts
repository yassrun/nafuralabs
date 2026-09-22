import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

import { AppShellNavigationItem, AppShellNavigationSection } from './app-shell.types';
import { AppShellContextRailService } from './context-rail.service';

interface RailDomain {
  id: string;
  label: string;
  icon?: string;
  route?: string;
  children: AppShellNavigationItem[];
}

@Component({
  selector: 'nf-app-shell-context-rail',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <aside class="naf-shell__sidebar" [class.is-collapsed]="collapsed()">
      <div class="naf-shell__sidebar-header">
        <span class="naf-shell__sidebar-name">{{ applicationName() }}</span>
      </div>
      <nav class="naf-shell__nav" aria-label="Navigation">
        @for (domain of domains(); track domain.id) {
          <div class="naf-shell__domain">
            <button
              type="button"
              class="naf-shell__domain-header"
              [class.is-expanded]="isExpanded(domain.id)"
              [title]="collapsed() ? domain.label : ''"
              (click)="onDomainClick(domain)">
              @if (domain.icon) {
                <span class="naf-shell__domain-icon">
                  <lucide-icon [name]="domain.icon" [size]="20" class="naf-shell__icon" aria-hidden="true"></lucide-icon>
                </span>
              }
              <span class="naf-shell__domain-label">{{ domain.label }}</span>
              @if (domain.children.length) {
                <lucide-icon
                  name="chevron-right"
                  [size]="18"
                  class="naf-shell__icon naf-shell__domain-chevron"
                  aria-hidden="true"></lucide-icon>
              }
            </button>
            @if (isExpanded(domain.id) && !collapsed()) {
              <div class="naf-shell__domain-body">
                @for (item of domain.children; track item.id) {
                  <a
                    class="naf-shell__link naf-shell__link--direct"
                    [routerLink]="item.route"
                    routerLinkActive="is-active">
                    @if (item.icon) {
                      <lucide-icon [name]="item.icon" [size]="15" class="naf-shell__icon naf-shell__link-icon" aria-hidden="true"></lucide-icon>
                    }
                    <span>{{ item.label }}</span>
                  </a>
                }
              </div>
            }
          </div>
        }
      </nav>
    </aside>
  `,
  styles: [`
    :host { display: block; grid-row: 2; min-height: 0; height: 100%; overflow: hidden; }
    .naf-shell__icon { display: inline-flex; flex-shrink: 0; }
    .naf-shell__sidebar {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
      padding: 0.75rem 0.5rem;
      background: var(--nf-color-surface, #fff);
      border-inline-end: 1px solid var(--nf-border-default, #e5e7eb);
    }
    .naf-shell__sidebar-header {
      display: flex;
      align-items: center;
      min-height: 40px;
      padding: 0.5rem;
      margin-bottom: 0.5rem;
      border-bottom: 1px solid var(--nf-border-default, #e5e7eb);
    }
    .naf-shell__sidebar-name {
      font-size: 0.9375rem;
      font-weight: 600;
      color: var(--nf-color-text, #111827);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .is-collapsed .naf-shell__sidebar-header { display: none; }
    .naf-shell__nav {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      flex: 1 1 auto;
      min-height: 0;
      overflow-y: auto;
    }
    .naf-shell__domain-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      width: 100%;
      padding: 0.5rem;
      border: none;
      border-radius: 0.5rem;
      background: transparent;
      color: var(--nf-text-primary, #111827);
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      text-align: start;
    }
    .naf-shell__domain-header:hover { background: var(--nf-surface-hover, #f9fafb); }
    .naf-shell__domain-icon { color: var(--nf-color-primary, #3b82f6); flex-shrink: 0; }
    .naf-shell__domain-header:hover .naf-shell__domain-icon,
    .naf-shell__domain-header.is-expanded .naf-shell__domain-icon { color: var(--nf-color-primary-700, #1d4ed8); }
    .naf-shell__domain-label { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .naf-shell__domain-chevron { color: var(--nf-text-muted, #6b7280); flex-shrink: 0; transition: transform 150ms ease; }
    .naf-shell__domain-header.is-expanded .naf-shell__domain-chevron { transform: rotate(90deg); }
    .is-collapsed .naf-shell__domain-header { justify-content: center; }
    .is-collapsed .naf-shell__domain-label,
    .is-collapsed .naf-shell__domain-chevron { display: none; }
    .naf-shell__domain-body { padding-inline-start: 0.5rem; margin-bottom: 0.25rem; }
    .naf-shell__link {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.375rem 0.5rem 0.375rem 1rem;
      border-radius: 0.375rem;
      border-inline-start: 2px solid transparent;
      color: var(--nf-text-muted, #6b7280);
      text-decoration: none;
      font-size: 0.8125rem;
      white-space: nowrap;
    }
    .naf-shell__link--direct { padding-inline-start: 0.5rem; }
    .naf-shell__link:hover { background: var(--nf-surface-hover, #f9fafb); color: var(--nf-text-primary, #111827); }
    .naf-shell__link.is-active {
      background: var(--nf-primary-subtle, #eff6ff);
      color: var(--nf-color-primary-700, #1d4ed8);
      font-weight: 500;
      border-inline-start-color: var(--nf-color-primary, #3b82f6);
    }
    .naf-shell__link-icon { color: var(--nf-text-muted, #9ca3af); }
    .naf-shell__link.is-active .naf-shell__link-icon { color: var(--nf-color-primary-700, #1d4ed8); }
  `],
})
export class AppShellContextRailComponent {
  private readonly rail = inject(AppShellContextRailService);
  private readonly router = inject(Router);

  readonly collapsed = input(false);
  readonly applicationName = input('');
  readonly adminNavigation = input<readonly AppShellNavigationSection[]>([]);
  readonly expandSidebar = output<void>();

  private readonly expanded = signal<ReadonlySet<string>>(new Set(['admin']));

  readonly domains = computed<RailDomain[]>(() => {
    const slots = this.rail.visibleSlots().map((slot) => ({
      id: slot.id,
      label: slot.label,
      icon: slot.icon,
      route: slot.route,
      children: (slot.navigation ?? []).flatMap((section) => [...section.items]),
    }));
    const admin = this.rail.admin();
    if (!admin) return slots;
    return [
      ...slots,
      {
        id: 'admin',
        label: admin.label,
        icon: admin.icon,
        route: admin.route,
        children: this.adminNavigation().flatMap((section) => [...section.items]),
      },
    ];
  });

  isExpanded(id: string): boolean {
    return this.expanded().has(id);
  }

  onDomainClick(domain: RailDomain): void {
    if (this.collapsed()) {
      this.expandSidebar.emit();
      this.expanded.update((set) => new Set(set).add(domain.id));
      return;
    }
    if (domain.children.length) {
      this.expanded.update((set) => {
        const next = new Set(set);
        if (next.has(domain.id)) next.delete(domain.id);
        else next.add(domain.id);
        return next;
      });
      return;
    }
    if (domain.route) void this.router.navigateByUrl(domain.route);
  }
}
