/**
 * Chart.js integration types and presets for nf-chart.
 * Re-exports Chart.js types and provides preset options for common use cases.
 */

import type { ChartData, ChartOptions, ChartType } from 'chart.js';

export type { ChartData, ChartOptions, ChartType };

/** Chart types supported by the nf-chart wrapper. */
export type NfChartType = 'bar' | 'line' | 'pie' | 'doughnut' | 'polarArea';

/** Preset key for common chart configurations. */
export type ChartPresetKey = 'revenue' | 'distribution' | 'comparison';

/** Preset: type + default options (merged with caller options). Options are Chart.js-compatible. */
export interface ChartPreset<T extends NfChartType = NfChartType> {
  type: T;
  options?: Record<string, unknown>;
}

/**
 * Pre-configured option presets for common use cases.
 * Use with nf-chart by passing preset options to the options input.
 */
export const CHART_PRESETS: Record<ChartPresetKey, ChartPreset> = {
  revenue: {
    type: 'line',
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true },
      },
    },
  },
  distribution: {
    type: 'doughnut',
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'right' },
      },
    },
  },
  comparison: {
    type: 'bar',
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true },
      },
    },
  },
};
