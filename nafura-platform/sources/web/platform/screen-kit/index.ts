/**
 * Display components a business-context screen may use.
 * A screen imports this façade, never `lib/anatomy`.
 */
export { ButtonComponent } from '../../lib/anatomy/components/atoms/button';
export { BadgeComponent } from '../../lib/anatomy/components/atoms/badge';
export { IconComponent } from '../../lib/anatomy/components/atoms/icon';
export { EmptyStateComponent } from '../../lib/anatomy/components/molecules/empty-state';
export { LoadingStateComponent } from '../../lib/anatomy/components/molecules/loading-state';
export { KpiStripComponent } from '../../lib/anatomy/components/molecules/kpi-strip';
export { StatCardComponent } from '../../lib/anatomy/components/molecules/stat-card';
export { ChartComponent } from '../../lib/anatomy/components/organisms/chart';
export type { KpiItem } from '../../lib/anatomy/types';
export type { ChartData, NfChartType } from '../../lib/anatomy/components/organisms/chart';

export { PermissionService } from '../../core/security/services/permission.service';
export { ApiConfigService } from '../../core/config/api-config.service';
