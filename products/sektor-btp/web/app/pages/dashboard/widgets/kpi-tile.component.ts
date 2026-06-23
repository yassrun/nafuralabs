import { Component, input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { StatCardComponent, type StatCardVariant, type TrendData } from '@lib/anatomy';

@Component({
  selector: 'app-dashboard-kpi-tile',
  standalone: true,
  imports: [RouterModule, TranslateModule, StatCardComponent],
  template: `
    <a
      class="kpi-tile"
      [routerLink]="link()"
      [queryParams]="queryParams()"
      [attr.data-testid]="testId()"
      [attr.aria-label]="labelKey() | translate"
    >
      <nf-stat-card
        [label]="labelKey() | translate"
        [value]="value()"
        [icon]="icon()"
        [variant]="variant()"
        [trend]="trend()"
      />
    </a>
  `,
  styles: [`
    :host { display: block; }
    .kpi-tile {
      text-decoration: none;
      color: inherit;
      display: block;
      border-radius: 8px;
      transition: box-shadow 0.2s ease, transform 0.15s ease;
    }
    .kpi-tile:hover {
      cursor: pointer;
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
      transform: translateY(-2px);
    }
    .kpi-tile:focus-visible {
      outline: 2px solid var(--nf-color-primary-500);
      outline-offset: 2px;
    }
  `],
})
export class KpiTileComponent {
  /** Router link commands, e.g. `['/chantiers']`. */
  link = input.required<(string | number)[]>();
  queryParams = input<Record<string, string | number | boolean | undefined>>({});
  labelKey = input.required<string>();
  value = input.required<string | number>();
  icon = input<string | undefined>(undefined);
  variant = input<StatCardVariant>('default');
  trend = input<TrendData | undefined>(undefined);
  testId = input('');
}
