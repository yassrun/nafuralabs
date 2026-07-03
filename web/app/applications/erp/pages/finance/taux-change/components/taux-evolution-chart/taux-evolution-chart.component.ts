import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  LOCALE_ID,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import type { TauxChange } from '@applications/erp/finance/models';

interface Series {
  label: string;
  color: string;
  points: { x: number; y: number; date: string; value: number }[];
}

@Component({
  selector: 'app-taux-evolution-chart',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ch">
      <header class="ch__head">
        <strong>{{ 'finance.tauxChange.evolutionChart.title' | translate }}</strong>
        <div class="ch__legend">
          @for (s of series(); track s.label) {
            <span class="ch__legend-item">
              <span class="ch__dot" [style.background]="s.color"></span>
              {{ s.label }}
            </span>
          }
        </div>
      </header>

      @if (series().length === 0) {
        <div class="ch__empty">{{ 'finance.tauxChange.evolutionChart.noData' | translate }}</div>
      } @else {
        <svg [attr.viewBox]="'0 0 ' + width + ' ' + height" class="ch__svg">
          <!-- Y axis grid -->
          @for (g of gridLines(); track g) {
            <line
              [attr.x1]="padX"
              [attr.x2]="width - padX"
              [attr.y1]="g.y"
              [attr.y2]="g.y"
              stroke="var(--nf-color-border)"
              stroke-dasharray="2 4" />
            <text
              [attr.x]="padX - 6"
              [attr.y]="g.y + 3"
              text-anchor="end"
              class="ch__axis">
              {{ g.label }}
            </text>
          }

          <!-- X axis labels (4 ticks) -->
          @for (t of xTicks(); track t.x) {
            <text [attr.x]="t.x" [attr.y]="height - 4" text-anchor="middle" class="ch__axis">
              {{ t.label }}
            </text>
          }

          <!-- Series lines -->
          @for (s of series(); track s.label) {
            <polyline
              fill="none"
              [attr.stroke]="s.color"
              stroke-width="2"
              [attr.points]="pointsAttr(s)" />
            @for (p of s.points; track p.x) {
              <circle
                [attr.cx]="p.x"
                [attr.cy]="p.y"
                r="2.4"
                [attr.fill]="s.color">
                <title>{{ s.label }} — {{ p.date }} : {{ p.value | number:'1.4-4' }}</title>
              </circle>
            }
          }
        </svg>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .ch {
        background: var(--nf-color-surface);
        border: 1px solid var(--nf-color-border);
        border-radius: 12px;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .ch__head {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .ch__head strong {
        font-size: 13px;
        color: var(--nf-text-primary);
      }
      .ch__legend {
        margin-left: auto;
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
      }
      .ch__legend-item {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        color: var(--nf-color-text-secondary);
      }
      .ch__dot {
        display: inline-block;
        width: 10px;
        height: 10px;
        border-radius: 999px;
      }
      .ch__svg {
        width: 100%;
        height: auto;
      }
      .ch__axis {
        font-size: 9px;
        fill: var(--nf-color-text-muted);
      }
      .ch__empty {
        color: var(--nf-color-text-muted);
        text-align: center;
        padding: 40px 0;
        font-style: italic;
      }
    `,
  ],
})
export class TauxEvolutionChartComponent {
  private readonly locale = inject(LOCALE_ID);

  readonly taux = input<TauxChange[]>([]);
  readonly pairs = input<Array<{ from: string; to: string }>>([
    { from: 'EUR', to: 'MAD' },
    { from: 'USD', to: 'MAD' },
  ]);

  readonly width = 720;
  readonly height = 240;
  readonly padX = 36;
  readonly padY = 18;

  private readonly colors = ['var(--nf-color-primary-700)', 'var(--nf-color-success-600)', 'var(--nf-color-warning-600)', 'var(--nf-color-primary-700)'];

  readonly series = computed<Series[]>(() => {
    const all = this.taux();
    const pairs = this.pairs();
    if (!all.length || !pairs.length) return [];

    const data = pairs.map((p, idx) => {
      const rows = all
        .filter((t) => t.deviseDeCode === p.from && t.deviseVersCode === p.to)
        .sort((a, b) => a.dateValidite.localeCompare(b.dateValidite));
      return {
        label: `${p.from} / ${p.to}`,
        color: this.colors[idx % this.colors.length],
        rows,
      };
    });

    const allValues = data.flatMap((s) => s.rows.map((r) => r.taux));
    if (!allValues.length) return [];
    const minV = Math.min(...allValues);
    const maxV = Math.max(...allValues);
    const span = Math.max(maxV - minV, 0.01);

    const dates = data
      .flatMap((s) => s.rows.map((r) => r.dateValidite))
      .sort();
    const minD = new Date(dates[0]).getTime();
    const maxD = new Date(dates[dates.length - 1]).getTime();
    const dSpan = Math.max(maxD - minD, 1);

    return data.map((s) => ({
      label: s.label,
      color: s.color,
      points: s.rows.map((r) => {
        const x =
          this.padX +
          ((new Date(r.dateValidite).getTime() - minD) / dSpan) *
            (this.width - 2 * this.padX);
        const y =
          this.height -
          this.padY -
          ((r.taux - minV) / span) * (this.height - 2 * this.padY);
        return { x, y, date: r.dateValidite, value: r.taux };
      }),
    }));
  });

  readonly gridLines = computed(() => {
    const series = this.series();
    if (!series.length) return [];
    const all = series.flatMap((s) => s.points.map((p) => p.value));
    if (!all.length) return [];
    const min = Math.min(...all);
    const max = Math.max(...all);
    const span = Math.max(max - min, 0.01);
    const count = 4;
    return Array.from({ length: count + 1 }, (_, i) => {
      const v = min + (span * (count - i)) / count;
      const y = this.padY + ((this.height - 2 * this.padY) * i) / count;
      return { y, label: v.toFixed(2) };
    });
  });

  readonly xTicks = computed(() => {
    const series = this.series();
    if (!series.length) return [];
    const allDates = series.flatMap((s) => s.points.map((p) => p.date)).sort();
    if (!allDates.length) return [];
    const min = new Date(allDates[0]).getTime();
    const max = new Date(allDates[allDates.length - 1]).getTime();
    const count = 4;
    return Array.from({ length: count + 1 }, (_, i) => {
      const t = min + ((max - min) * i) / count;
      const x = this.padX + ((this.width - 2 * this.padX) * i) / count;
      return {
        x,
        label: new Date(t).toLocaleDateString(this.locale, {
          month: 'short',
          year: '2-digit',
        }),
      };
    });
  });

  pointsAttr(s: Series): string {
    return s.points.map((p) => `${p.x},${p.y}`).join(' ');
  }
}
