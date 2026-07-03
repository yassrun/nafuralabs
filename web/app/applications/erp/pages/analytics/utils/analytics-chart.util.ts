import type { ChartData } from '@lib/anatomy';

import type { AnalyticsBucketRow } from '../services/analytics-api.service';

const CHART_COLORS = ['#1b3fae', '#f2d544', '#16a34a', '#dc2626', '#7c3aed', '#64748b', '#0ea5e9'];

export function bucketLabel(row: AnalyticsBucketRow, dimIndex = 1): string {
  const key = row.keys[dimIndex] ?? row.keys[0];
  return key?.trim() ? key : '—';
}

export function toBarChart(
  rows: AnalyticsBucketRow[],
  metric: string,
  datasetLabel: string,
  dimIndex = 1,
): ChartData<'bar'> {
  return {
    labels: rows.map((r) => bucketLabel(r, dimIndex)),
    datasets: [
      {
        label: datasetLabel,
        data: rows.map((r) => Number(r.metrics?.[metric]) || 0),
        backgroundColor: CHART_COLORS[0],
      },
    ],
  };
}

export function toGroupedBarChart(
  rows: AnalyticsBucketRow[],
  metrics: { key: string; label: string }[],
  dimIndex = 1,
): ChartData<'bar'> {
  return {
    labels: rows.map((r) => bucketLabel(r, dimIndex)),
    datasets: metrics.map((m, i) => ({
      label: m.label,
      data: rows.map((r) => Number(r.metrics?.[m.key]) || 0),
      backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
    })),
  };
}

export function toDoughnutFromMetrics(
  rows: AnalyticsBucketRow[],
  metrics: { key: string; label: string }[],
): ChartData<'doughnut'> {
  const slices = metrics.map((m) => ({
    label: m.label,
    value: rows.reduce((s, r) => s + (Number(r.metrics?.[m.key]) || 0), 0),
  }));
  return {
    labels: slices.map((s) => s.label),
    datasets: [
      {
        data: slices.map((s) => s.value),
        backgroundColor: CHART_COLORS.slice(0, slices.length),
      },
    ],
  };
}

export const ANALYTICS_CHART_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: 'bottom' as const } },
};
