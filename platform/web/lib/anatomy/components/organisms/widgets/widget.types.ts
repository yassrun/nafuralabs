/**
 * Widget system types for config-driven dashboards.
 * Each widget type has a component + data provider pattern.
 */

export type WidgetSpan = 'full' | 'half' | 'third' | 'two-thirds';

export interface WidgetDataSource {
  /** API endpoint for data */
  endpoint: string;
  /** Query params */
  params?: Record<string, string>;
  /** Auto-refresh interval in seconds; 0 = no refresh */
  refreshInterval?: number;
}

export interface KpiWidgetConfig {
  /** Field name for the main value in API response */
  valueField: string;
  format: 'number' | 'currency' | 'percent';
  currency?: string;
  /** Field name for trend value (e.g. percentage) */
  trendField?: string;
  /** Whether up or down is good for trend */
  trendDirection?: 'up-good' | 'down-good';
  icon?: string;
  color?: string;
}

export interface ChartWidgetConfig {
  chartType: 'bar' | 'line' | 'pie' | 'doughnut';
  preset?: string;
  /** Field name for labels array in API response */
  labelsField: string;
  /** Field name for datasets array in API response */
  datasetsField: string;
}

export interface ListWidgetColumn {
  field: string;
  label: string;
  type: 'text' | 'currency' | 'badge';
}

export interface ListWidgetConfig {
  columns: ListWidgetColumn[];
  /** Max rows to show; default 5 */
  maxItems?: number;
  /** Link to full listing */
  viewAllRoute?: string;
  /** Navigate on row click (e.g. detail route pattern) */
  rowClickRoute?: string;
}

export interface ActivityWidgetConfig {
  /** Filter by entity type; null = all */
  entityType?: string;
  /** Max entries; default 10 */
  maxItems?: number;
}

export type WidgetType = 'kpi' | 'chart' | 'list' | 'activity';

export type WidgetTypeConfig =
  | KpiWidgetConfig
  | ChartWidgetConfig
  | ListWidgetConfig
  | ActivityWidgetConfig;

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  span: WidgetSpan;
  dataSource: WidgetDataSource;
  config: WidgetTypeConfig;
}

/** API response shape for KPI widget */
export interface KpiWidgetData {
  value: number;
  trend?: number;
  trendLabel?: string;
  [key: string]: unknown;
}

/** API response shape for chart widget */
export interface ChartWidgetData {
  labels: string[];
  datasets: Array<{ label: string; data: number[] }>;
}

/** API response shape for list widget */
export interface ListWidgetData {
  items: Record<string, unknown>[];
}

/** API response shape for activity widget - audit trail entries */
export interface ActivityWidgetData {
  entries: Array<{
    id: string;
    actor: string;
    action: string;
    at: string;
    target?: string;
    details?: string;
    verb?: string;
    icon?: string;
    iconClass?: string;
  }>;
}
