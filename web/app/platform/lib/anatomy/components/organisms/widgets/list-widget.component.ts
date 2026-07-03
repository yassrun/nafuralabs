import { Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import type { WidgetConfig, ListWidgetConfig as ListConfig, ListWidgetData } from './widget.types';

@Component({
  selector: 'nf-list-widget',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="nf-list-widget">
      <ul class="nf-list-widget__list">
        @for (item of items(); track $index) {
          <li class="nf-list-widget__row">
            @if (rowClickRoute(); as route) {
              <a [routerLink]="buildRowRoute(route, item)" class="nf-list-widget__link">
                <ng-container *ngTemplateOutlet="rowTpl; context: { $implicit: item }" />
              </a>
            } @else {
              <ng-container *ngTemplateOutlet="rowTpl; context: { $implicit: item }" />
            }
          </li>
        }
      </ul>
      @if (viewAllRoute() && items().length > 0) {
        <div class="nf-list-widget__footer">
          <a [routerLink]="viewAllRoute()!" class="nf-list-widget__view-all">View All →</a>
        </div>
      }
    </div>

    <ng-template #rowTpl let-item>
      @for (col of widgetConfig().columns; track col.field) {
        <span class="nf-list-widget__cell nf-list-widget__cell--{{ col.type }}">
          {{ formatCell(item, col) }}
        </span>
      }
    </ng-template>
  `,
  styles: [
    `
      .nf-list-widget {
        display: flex;
        flex-direction: column;
        gap: var(--nf-space-2, 8px);
      }

      .nf-list-widget__list {
        margin: 0;
        padding: 0;
        list-style: none;
      }

      .nf-list-widget__row {
        padding: var(--nf-space-2, 8px) 0;
        border-bottom: 1px solid var(--nf-border-default);
      }

      .nf-list-widget__row:last-child {
        border-bottom: none;
      }

      .nf-list-widget__link {
        display: flex;
        flex-wrap: wrap;
        gap: var(--nf-space-2, 8px);
        align-items: center;
        color: inherit;
        text-decoration: none;
      }

      .nf-list-widget__link:hover {
        color: var(--nf-color-primary-600);
      }

      .nf-list-widget__cell {
        font-size: var(--nf-font-size-sm, 0.875rem);
      }

      .nf-list-widget__cell--currency {
        font-variant-numeric: tabular-nums;
      }

      .nf-list-widget__cell--badge {
        display: inline-flex;
        padding: 2px 8px;
        border-radius: 999px;
        font-size: 0.75rem;
        background: var(--nf-color-gray-100);
        color: var(--nf-text-secondary);
      }

      .nf-list-widget__footer {
        margin-top: var(--nf-space-2, 8px);
        padding-top: var(--nf-space-2, 8px);
        border-top: 1px solid var(--nf-border-default);
      }

      .nf-list-widget__view-all {
        font-size: var(--nf-font-size-sm, 0.875rem);
        color: var(--nf-color-primary-600);
        text-decoration: none;
      }

      .nf-list-widget__view-all:hover {
        text-decoration: underline;
      }
    `,
  ],
})
export class ListWidgetComponent {
  config = input.required<WidgetConfig>();
  /** API response (generic; component treats as ListWidgetData) */
  data = input<unknown>(null);

  widgetConfig = computed(() => this.config().config as ListConfig);

  items = computed(() => {
    const raw = this.data();
    const d = raw as ListWidgetData | null;
    const cfg = this.widgetConfig();
    const max = cfg.maxItems ?? 5;
    const list = (d && (d.items ?? (d as { items?: Record<string, unknown>[] }).items)) ?? [];
    return Array.isArray(list) ? list.slice(0, max) : [];
  });

  viewAllRoute = computed(() => this.widgetConfig().viewAllRoute);
  rowClickRoute = computed(() => this.widgetConfig().rowClickRoute);

  formatCell(item: Record<string, unknown>, col: { field: string; type: string }): string {
    const raw = item[col.field];
    if (raw == null) return '—';
    switch (col.type) {
      case 'currency':
        return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(Number(raw));
      case 'badge':
        return String(raw);
      default:
        return String(raw);
    }
  }

  /** Build route array for row click; appends item id when route is a base path. */
  buildRowRoute(routePattern: string, item: Record<string, unknown>): string[] {
    const id = item['id'] ?? item['code'] ?? item['key'];
    if (id != null) return [routePattern, String(id)];
    return [routePattern];
  }
}