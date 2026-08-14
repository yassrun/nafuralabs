import { environment } from '@env';

/** Demo charts (SOMACOM-style) only when dev auth bypass is enabled. */
export const USE_DASHBOARD_DEMO_DATA = environment.devAuthBypass;

export const DASHBOARD_CHART_EMPTY_STYLES = `
  .dash-chart-card__empty {
    margin: 24px 0;
    padding: 20px 16px;
    text-align: center;
    font-size: 0.875rem;
    color: var(--nf-color-text-secondary);
    border: 1px dashed var(--nf-color-border);
    border-radius: 8px;
    background: var(--nf-color-bg-subtle);
  }
`;
