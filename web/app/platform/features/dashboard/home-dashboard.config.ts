/**
 * Home dashboard widget configuration.
 * Cross-domain overview: KPIs, charts, recent activity, recent invoices.
 */

import type { WidgetConfig } from '@lib/anatomy/components/organisms/widgets/widget.types';

export const HOME_DASHBOARD_CONFIG: WidgetConfig[] = [
  {
    id: 'revenue-kpi',
    type: 'kpi',
    title: 'dashboard.widgets.revenue',
    span: 'third',
    dataSource: {
      endpoint: '/api/v1/dashboard/summary',
      refreshInterval: 300,
    },
    config: {
      valueField: 'totalRevenue',
      format: 'currency',
      currency: 'MAD',
      trendField: 'revenueTrend',
      trendDirection: 'up-good',
    },
  },
  {
    id: 'invoices-kpi',
    type: 'kpi',
    title: 'dashboard.widgets.invoices',
    span: 'third',
    dataSource: { endpoint: '/api/v1/dashboard/summary' },
    config: {
      valueField: 'invoiceCount',
      format: 'number',
      icon: 'receipt_long',
    },
  },
  {
    id: 'overdue-kpi',
    type: 'kpi',
    title: 'dashboard.widgets.overdue',
    span: 'third',
    dataSource: { endpoint: '/api/v1/dashboard/summary' },
    config: {
      valueField: 'overdueCount',
      format: 'number',
      color: 'danger',
      icon: 'warning',
    },
  },
  {
    id: 'revenue-trend',
    type: 'chart',
    title: 'dashboard.widgets.revenueTrend',
    span: 'half',
    dataSource: { endpoint: '/api/v1/dashboard/revenue-trend' },
    config: {
      chartType: 'line',
      labelsField: 'labels',
      datasetsField: 'datasets',
    },
  },
  {
    id: 'expense-breakdown',
    type: 'chart',
    title: 'dashboard.widgets.expenseBreakdown',
    span: 'half',
    dataSource: { endpoint: '/api/v1/dashboard/expense-breakdown' },
    config: {
      chartType: 'doughnut',
      labelsField: 'labels',
      datasetsField: 'datasets',
    },
  },
  {
    id: 'recent-activity',
    type: 'activity',
    title: 'dashboard.widgets.recentActivity',
    span: 'half',
    dataSource: {
      endpoint: '/api/v1/platform/collaboration/audit/log',
      params: { size: '10', sort: 'eventAt', direction: 'desc' },
    },
    config: { maxItems: 10 },
  },
  {
    id: 'recent-invoices',
    type: 'list',
    title: 'dashboard.widgets.recentInvoices',
    span: 'half',
    dataSource: {
      endpoint: '/api/v1/dashboard/recent-invoices',
      params: { size: '5' },
    },
    config: {
      columns: [
        { field: 'code', label: 'Code', type: 'text' },
        { field: 'amount', label: 'Amount', type: 'currency' },
        { field: 'status', label: 'Status', type: 'badge' },
      ],
      maxItems: 5,
      viewAllRoute: '/finance/invoices',
    },
  },
];
