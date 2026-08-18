import type { ListingRouteConfig } from '@lib/anatomy/types';
import type { WorkflowTemplate } from '../../models';

export const ROUTES: ListingRouteConfig<WorkflowTemplate> = {
  list: ['/administration/workflows'],
  detail: (item) => ['/administration/workflows', item.id],
  create: ['/administration/workflows/new'],
};
