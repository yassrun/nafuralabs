export const ANALYTICS_PAGE_STYLES = `
  .analytics-toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 12px;
    margin-bottom: 1rem;
  }
  .analytics-toolbar label {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--nf-color-text-secondary);
  }
  .analytics-toolbar input[type="date"] {
    padding: 6px 10px;
    border: 1px solid var(--nf-color-border);
    border-radius: 6px;
    font-size: 0.8125rem;
  }
  .analytics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 12px;
    margin-bottom: 1.25rem;
  }
  .analytics-charts {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 16px;
  }
  .analytics-chart-card {
    border: 1px solid var(--nf-color-border);
    border-radius: 8px;
    padding: 12px;
    background: var(--nf-color-surface);
    min-height: 280px;
  }
  .analytics-chart-card__title {
    margin: 0 0 8px;
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--nf-text-primary, var(--nf-color-text-primary));
  }
  .analytics-chart-card__body {
    height: 240px;
  }
  .loading-msg {
    padding: 2rem;
    color: var(--nf-color-text-secondary);
    font-size: 0.875rem;
  }
`;
