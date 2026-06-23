import {
  Component,
  computed,
  inject,
  input,
  OnInit,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import type { ChartData, ChartOptions, NfChartType } from './chart.types';
import type { ChartType } from 'chart.js';
import { ThemeModeService } from '../../../../../core/theme/theme-mode.service';
import { DOCUMENT } from '@angular/common';

const DEFAULT_HEIGHT = '300px';
const MIN_HEIGHT_PX = 200;

/** Resolve a CSS custom property value from the document (e.g. --nf-text-primary). */
function getCssVar(doc: Document, name: string): string {
  if (typeof doc?.documentElement === 'undefined') return '';
  const value = getComputedStyle(doc.documentElement).getPropertyValue(name).trim();
  return value || '';
}

/**
 * Reusable Chart.js wrapper (bar, line, pie, doughnut, polarArea).
 * Uses platform CSS variables for colors and respects light/dark theme.
 */
@Component({
  selector: 'nf-chart',
  standalone: true,
  imports: [BaseChartDirective],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="nf-chart-js" [style.height]="height()" [style.minHeight.px]="minHeight()">
      <canvas
        baseChart
        [type]="type()"
        [data]="data()"
        [options]="$any(mergedOptions())">
      </canvas>
    </div>
  `,
  styles: [
    `
      .nf-chart-js {
        width: 100%;
        position: relative;
      }
      .nf-chart-js canvas {
        display: block;
      }
    `,
  ],
})
export class ChartComponent implements OnInit {
  private readonly document = inject(DOCUMENT);
  private readonly themeMode = inject(ThemeModeService);

  type = input.required<NfChartType>();
  data = input.required<ChartData>();
  options = input<ChartOptions<NfChartType>>();
  height = input<string>(DEFAULT_HEIGHT);
  minHeight = input<number>(MIN_HEIGHT_PX);

  /** Theme-aware options: user options merged with platform colors and dark mode. */
  mergedOptions = computed(() => {
    const user = this.options();
    const dark = this.themeMode.effectiveMode() === 'dark';
    const textColor = getCssVar(this.document, '--nf-text-primary') || (dark ? '#f9fafb' : '#111827');
    const secondaryColor = getCssVar(this.document, '--nf-text-secondary') || (dark ? '#d1d5db' : '#4b5563');
    const gridColor = getCssVar(this.document, '--nf-border-default') || (dark ? '#4b5563' : '#e5e7eb');

    const themeDefaults: Record<string, unknown> = {
      responsive: true,
      maintainAspectRatio: false,
      font: {
        family: 'inherit',
      },
      plugins: {
        legend: {
          labels: {
            color: textColor,
            font: { family: 'inherit' },
          },
        },
        tooltip: {
          titleFont: { family: 'inherit' },
          bodyFont: { family: 'inherit' },
        },
      },
      scales: {
        x: {
          ticks: { color: secondaryColor, font: { family: 'inherit' } },
          grid: { color: gridColor },
        },
        y: {
          ticks: { color: secondaryColor, font: { family: 'inherit' } },
          grid: { color: gridColor },
        },
      },
    };

    return this.deepMerge(themeDefaults, (user ?? {}) as Record<string, unknown>) as ChartOptions<ChartType>;
  });

  /** Palette from CSS vars for datasets when not provided (bar/line). */
  private readonly palette = signal<string[]>([]);

  ngOnInit(): void {
    this.resolvePalette();
  }

  private resolvePalette(): void {
    const doc = this.document;
    if (!doc?.documentElement) return;
    const colors = [
      getCssVar(doc, '--nf-color-primary-500'),
      getCssVar(doc, '--nf-color-success-500'),
      getCssVar(doc, '--nf-color-warning-500'),
      getCssVar(doc, '--nf-color-danger-500'),
      getCssVar(doc, '--nf-color-info-500'),
      getCssVar(doc, '--nf-color-gray-500'),
    ].filter(Boolean);
    if (colors.length) this.palette.set(colors);
  }

  private deepMerge<T extends Record<string, unknown>>(target: T, source: Partial<T>): T {
    const out = { ...target };
    for (const key of Object.keys(source) as (keyof T)[]) {
      const s = source[key];
      if (s === undefined) continue;
      const t = out[key];
      if (t != null && typeof t === 'object' && !Array.isArray(t) && typeof s === 'object' && !Array.isArray(s)) {
        (out as Record<string, unknown>)[key as string] = this.deepMerge(
          t as Record<string, unknown>,
          s as Record<string, unknown>
        ) as T[keyof T];
      } else {
        (out as Record<string, unknown>)[key as string] = s;
      }
    }
    return out;
  }
}
