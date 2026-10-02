import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { LucideAngularModule } from 'lucide-angular';
import { filter, map, startWith } from 'rxjs';

import type { SidebarNode, ZoneConfig } from './sidebar.types';
import {
  badgeOf,
  displayLabel,
  filterVisibleNodes,
  findActiveDomainId,
  groupByZone,
  nodeChildren,
  resolveNavIcon,
} from './sidebar-tree';

/**
 * The platform sidebar navigation: zones, collapsible domains, sections and links.
 * Every shell renders its menu with it (Sektor's PlatformAppShell, the Nafura host shell),
 * so a product only declares nodes; it never draws a menu.
 */
@Component({
  selector: 'nf-sidebar-nav',
  standalone: true,
  imports: [NgTemplateOutlet, RouterLink, RouterLinkActive, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="naf-shell__nav" [class.naf-shell__nav--collapsed]="collapsed()" aria-label="Navigation principale">
      @for (group of zoneGroups(); track group.zone; let groupIdx = $index) {
        @if (group.label) {
          <div class="naf-shell__zone-header">
            <span class="naf-shell__zone-label">{{ label(group.label) }}</span>
          </div>
        } @else if (groupIdx > 0) {
          <div class="naf-shell__zone-divider"></div>
        }

        @for (domain of group.nodes; track domain.id) {
          <div class="naf-shell__domain" [attr.data-nav-id]="domain.id">
            @if (domain.dividerBefore) {
              <div class="naf-shell__zone-divider"></div>
            }

            @if (children(domain).length === 0 && domain.route) {
              <a
                class="naf-shell__domain-header naf-shell__domain-header--link"
                [routerLink]="absolute(domain.route)"
                routerLinkActive="is-active"
                [routerLinkActiveOptions]="{ exact: domain.exactMatch ?? false }"
                [attr.title]="collapsed() ? label(domain.label) : null"
                (click)="navigated.emit()">
                @if (icon(domain); as domainIcon) {
                  <span class="naf-shell__domain-icon">
                    <lucide-icon [name]="domainIcon" [size]="20" class="naf-shell__icon" aria-hidden="true"></lucide-icon>
                  </span>
                }
                <span class="naf-shell__domain-label">{{ label(domain.label) }}</span>
                @if (badge(domain); as b) {
                  <span class="naf-shell__link-badge" [attr.data-variant]="b.variant">{{ b.value }}</span>
                }
              </a>
            } @else {
              <button
                type="button"
                class="naf-shell__domain-header"
                [class.is-expanded]="expanded().has(domain.id)"
                [attr.aria-expanded]="expanded().has(domain.id)"
                [attr.title]="collapsed() ? label(domain.label) : null"
                (click)="onDomainClick(domain)">
                @if (icon(domain); as domainIcon) {
                  <span class="naf-shell__domain-icon">
                    <lucide-icon [name]="domainIcon" [size]="20" class="naf-shell__icon" aria-hidden="true"></lucide-icon>
                  </span>
                }
                <span class="naf-shell__domain-label">{{ label(domain.label) }}</span>
                <lucide-icon
                  name="chevron-right"
                  [size]="18"
                  class="naf-shell__icon naf-shell__domain-chevron"
                  aria-hidden="true"></lucide-icon>
              </button>

              @if (expanded().has(domain.id) && !collapsed()) {
                <div class="naf-shell__domain-body">
                  @for (child of children(domain); track child.id) {
                    @if (children(child).length > 0) {
                      <div class="naf-shell__section">
                        <div class="naf-shell__section-label">{{ label(child.label) }}</div>
                        @for (item of children(child); track item.id) {
                          <ng-container
                            *ngTemplateOutlet="link; context: { $implicit: item, direct: false }" />
                        }
                      </div>
                    } @else if (child.route) {
                      <ng-container *ngTemplateOutlet="link; context: { $implicit: child, direct: true }" />
                    }
                  }
                </div>
              }
            }

            @if (domain.dividerAfter) {
              <div class="naf-shell__zone-divider"></div>
            }
          </div>
        }
      } @empty {
        <div class="naf-shell__empty">{{ label(emptyLabel()) }}</div>
      }
    </nav>

    <ng-template #link let-item let-direct="direct">
      <a
        class="naf-shell__link"
        [class.naf-shell__link--direct]="direct"
        [routerLink]="absolute(item.route)"
        routerLinkActive="is-active"
        [routerLinkActiveOptions]="{ exact: item.exactMatch ?? false }"
        [attr.data-nav-id]="item.id"
        (click)="navigated.emit()">
        @if (icon(item); as itemIcon) {
          <span class="naf-shell__link-icon">
            <lucide-icon [name]="itemIcon" [size]="15" class="naf-shell__icon" aria-hidden="true"></lucide-icon>
          </span>
        }
        <span class="naf-shell__link-label">{{ label(item.label) }}</span>
        @if (badge(item); as b) {
          <span class="naf-shell__link-badge" [attr.data-variant]="b.variant">{{ b.value }}</span>
        }
      </a>
    </ng-template>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      flex: 1 1 auto;
      min-height: 0;
    }

    .naf-shell__nav {
      display: flex;
      flex-direction: column;
      gap: var(--nf-space-1, 0.25rem);
      flex: 1 1 auto;
      min-height: 0;
      overflow-y: auto;
    }

    /* ─── Zones ─── */
    .naf-shell__zone-divider {
      height: 1px;
      background: var(--nf-border-default, #e5e7eb);
      margin: var(--nf-space-2, 0.5rem) var(--nf-space-2, 0.5rem);
    }

    .naf-shell__zone-header {
      padding: 0 var(--nf-space-2, 0.5rem) var(--nf-space-1, 0.25rem);
      margin-top: var(--nf-space-5, 1.25rem);
    }

    .naf-shell__zone-header:first-child {
      margin-top: var(--nf-space-1, 0.25rem);
    }

    .naf-shell__zone-label {
      font-size: 0.6875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--nf-text-muted, #6b7280);
      display: block;
      padding-bottom: var(--nf-space-1, 0.25rem);
      border-bottom: 1px solid var(--nf-border-subtle, #f3f4f6);
    }

    /* ─── Domain header ─── */
    .naf-shell__domain-header {
      display: flex;
      align-items: center;
      gap: var(--nf-space-2, 0.5rem);
      width: 100%;
      padding: var(--nf-space-2, 0.5rem);
      border: none;
      border-radius: var(--nf-radius-lg, 0.5rem);
      background: transparent;
      color: var(--nf-text-primary, #111827);
      font: inherit;
      font-size: var(--nf-font-size-sm, 0.875rem);
      font-weight: var(--nf-font-weight-semibold, 600);
      text-decoration: none;
      cursor: pointer;
      transition: background var(--nf-transition-fast, 100ms ease),
                  color var(--nf-transition-fast, 100ms ease);
      text-align: start;
      box-sizing: border-box;
    }

    .naf-shell__domain-header:hover {
      background: var(--nf-surface-hover, #f9fafb);
      color: var(--nf-text-primary, #111827);
    }

    .naf-shell__domain-header:focus-visible,
    .naf-shell__link:focus-visible {
      outline: 2px solid var(--nf-color-primary, #3b82f6);
      outline-offset: -2px;
    }

    .naf-shell__domain-header--link.is-active {
      background: var(--nf-primary-subtle, #eff6ff);
      color: var(--nf-color-primary-700, #1d4ed8);
    }

    .naf-shell__domain-icon {
      display: inline-flex;
      font-size: 18px;
      width: 20px;
      height: 20px;
      flex-shrink: 0;
      color: var(--nf-color-primary, #3b82f6);
    }

    .naf-shell__domain-header:hover .naf-shell__domain-icon,
    .naf-shell__domain-header.is-expanded .naf-shell__domain-icon,
    .naf-shell__domain-header.is-active .naf-shell__domain-icon {
      color: var(--nf-color-primary-700, #1d4ed8);
    }

    .naf-shell__domain-label {
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .naf-shell__domain-chevron {
      width: 18px !important;
      height: 18px !important;
      color: var(--nf-text-muted, #6b7280);
      transition: transform var(--nf-transition-normal, 150ms ease);
      flex-shrink: 0;
    }

    .naf-shell__domain-header.is-expanded .naf-shell__domain-chevron {
      transform: rotate(90deg);
    }

    /* RTL: mirror chevron-right so it points toward the inline end. */
    :host-context([dir="rtl"]) .naf-shell__domain-chevron {
      transform: scaleX(-1);
    }

    :host-context([dir="rtl"]) .naf-shell__domain-header.is-expanded .naf-shell__domain-chevron {
      transform: scaleX(-1) rotate(90deg);
    }

    /* ─── Collapsed: icons only ─── */
    .naf-shell__nav--collapsed .naf-shell__domain-header {
      justify-content: center;
      padding: var(--nf-space-2, 0.5rem);
    }

    .naf-shell__nav--collapsed .naf-shell__domain-label,
    .naf-shell__nav--collapsed .naf-shell__domain-chevron,
    .naf-shell__nav--collapsed .naf-shell__domain-header .naf-shell__link-badge,
    .naf-shell__nav--collapsed .naf-shell__zone-header,
    .naf-shell__nav--collapsed .naf-shell__zone-divider {
      display: none;
    }

    /* ─── Domain body ─── */
    .naf-shell__domain-body {
      padding-inline-start: var(--nf-space-2, 0.5rem);
      margin-bottom: var(--nf-space-1, 0.25rem);
    }

    .naf-shell__section {
      margin-top: var(--nf-space-1, 0.25rem);
    }

    .naf-shell__section-label {
      padding: var(--nf-space-1, 0.25rem) var(--nf-space-2, 0.5rem);
      font-size: var(--nf-font-size-xs, 0.75rem);
      font-weight: var(--nf-font-weight-medium, 500);
      text-transform: uppercase;
      letter-spacing: var(--nf-letter-spacing-wide, 0.025em);
      color: var(--nf-text-muted, #6b7280);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* ─── Links ─── */
    .naf-shell__link {
      display: flex;
      align-items: center;
      gap: var(--nf-space-2, 0.5rem);
      padding-block: var(--nf-space-1-5, 0.375rem);
      padding-inline-start: var(--nf-space-4, 1rem);
      padding-inline-end: var(--nf-space-2, 0.5rem);
      border-radius: var(--nf-radius-md, 0.375rem);
      color: var(--nf-text-muted, #6b7280);
      text-decoration: none;
      font-size: 0.8125rem;
      font-weight: var(--nf-font-weight-normal, 400);
      transition: background var(--nf-transition-fast, 100ms ease),
                  color var(--nf-transition-fast, 100ms ease);
      white-space: nowrap;
      overflow: hidden;
      border-inline-start: 2px solid transparent;
    }

    .naf-shell__link-label {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .naf-shell__link:hover {
      background: var(--nf-surface-hover, #f9fafb);
      color: var(--nf-text-primary, #111827);
    }

    .naf-shell__link.is-active {
      background: var(--nf-primary-subtle, #eff6ff);
      color: var(--nf-color-primary-700, #1d4ed8);
      font-weight: var(--nf-font-weight-medium, 500);
      border-inline-start-color: var(--nf-color-primary, #3b82f6);
    }

    .naf-shell__link--direct {
      padding-inline-start: var(--nf-space-2, 0.5rem);
    }

    .naf-shell__link-icon {
      display: inline-flex;
      width: 15px;
      height: 15px;
      color: var(--nf-text-muted, #9ca3af);
      flex-shrink: 0;
    }

    .naf-shell__link.is-active .naf-shell__link-icon {
      color: var(--nf-color-primary-700, #1d4ed8);
    }

    .naf-shell__link-badge {
      margin-inline-start: auto;
      min-width: 1.25rem;
      padding: 0 6px;
      font-size: 0.6875rem;
      font-weight: 600;
      line-height: 1.25rem;
      text-align: center;
      border-radius: 9999px;
      background: var(--nf-color-primary, #3b82f6);
      color: #fff;
    }

    .naf-shell__link-badge[data-variant='warning'] { background: var(--nf-color-warning, #d97706); }
    .naf-shell__link-badge[data-variant='error'] { background: var(--nf-color-danger, #dc2626); }
    .naf-shell__link-badge[data-variant='success'] { background: var(--nf-color-success, #16a34a); }

    .naf-shell__empty {
      font-size: var(--nf-font-size-sm, 0.875rem);
      color: var(--nf-text-muted, #6b7280);
      padding: var(--nf-space-4, 1rem) var(--nf-space-2, 0.5rem);
      text-align: center;
    }
  `],
})
export class SidebarNavComponent {
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

  /** Top-level nodes (domains), already filtered for the user; `zone` groups them. */
  readonly nodes = input<readonly SidebarNode[]>([]);
  readonly zones = input<readonly ZoneConfig[]>([]);
  /** Icons only; clicking a domain asks the shell to expand (`expandRequest`). */
  readonly collapsed = input(false);
  readonly emptyLabel = input('core.navigation.empty');

  readonly expandRequest = output<void>();
  /** A link was followed (a mobile shell closes its drawer). */
  readonly navigated = output<void>();

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  readonly visible = computed(() => filterVisibleNodes(this.nodes()));
  readonly zoneGroups = computed(() => groupByZone(this.visible(), this.zones()));
  readonly expanded = signal<ReadonlySet<string>>(new Set());
  /** Domains the user closed: following a link inside does not reopen them. */
  private readonly manuallyCollapsed = new Set<string>();

  readonly children = nodeChildren;
  readonly badge = badgeOf;
  readonly absolute = (route: string) => (route.startsWith('/') ? route : '/' + route.trim());
  readonly icon = (node: SidebarNode) => resolveNavIcon(node.icon);
  readonly label = (value: string | undefined) => displayLabel(value, (key) => this.translate.instant(key));

  constructor() {
    // Open the domain holding the current route, closing its siblings of the same zone.
    effect(() => {
      const active = findActiveDomainId(this.visible(), this.url());
      if (!active || this.manuallyCollapsed.has(active) || untracked(this.expanded).has(active)) return;
      untracked(() => this.open(active));
    });

    // Domains flagged `meta.expanded`, and a lone domain, start open.
    effect(() => {
      const nodes = this.visible();
      const opened = new Map<string, string>();
      for (const node of nodes) {
        const zone = node.zone || 'default';
        if (node.meta?.['expanded'] === true && !opened.has(zone)) opened.set(zone, node.id);
      }
      if (nodes.length === 1 && nodes[0].children?.length && !opened.has(nodes[0].zone || 'default')) {
        opened.set(nodes[0].zone || 'default', nodes[0].id);
      }
      if (opened.size) {
        untracked(() => this.expanded.update((set) => new Set([...set, ...opened.values()])));
      }
    });
  }

  onDomainClick(domain: SidebarNode): void {
    if (this.collapsed()) {
      this.manuallyCollapsed.delete(domain.id);
      this.open(domain.id);
      this.expandRequest.emit();
      return;
    }
    if (this.expanded().has(domain.id)) {
      this.expanded.update((set) => new Set([...set].filter((id) => id !== domain.id)));
      this.manuallyCollapsed.add(domain.id);
      return;
    }
    this.manuallyCollapsed.delete(domain.id);
    this.open(domain.id);
  }

  /** One open domain per zone. */
  private open(domainId: string): void {
    const zone = this.zoneGroups().find((group) => group.nodes.some((node) => node.id === domainId));
    const siblings = new Set((zone?.nodes ?? []).map((node) => node.id).filter((id) => id !== domainId));
    this.expanded.update((set) => {
      const next = new Set([...set].filter((id) => !siblings.has(id)));
      next.add(domainId);
      return next;
    });
  }
}
